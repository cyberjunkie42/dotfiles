(function() {
  var Client, connection, conv, convsettings, entity, ipc, isImg, later, notify, ref, ref1, remote, resendfocus, sendsetpresence, throttle, userinput, viewstate,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  Client = require('hangupsjs');

  remote = require('remote');

  ipc = require('ipc');

  ref = require('./models'), entity = ref.entity, conv = ref.conv, viewstate = ref.viewstate, userinput = ref.userinput, connection = ref.connection, convsettings = ref.convsettings, notify = ref.notify;

  ref1 = require('./util'), throttle = ref1.throttle, later = ref1.later, isImg = ref1.isImg;

  'connecting connected connect_failed'.split(' ').forEach(function(n) {
    return handle(n, function() {
      return connection.setState(n);
    });
  });

  handle('alive', function(time) {
    return connection.setLastActive(time);
  });

  handle('reqinit', function() {
    ipc.send('reqinit');
    connection.setState(connection.CONNECTING);
    return viewstate.setState(viewstate.STATE_STARTUP);
  });

  module.exports = {
    init: function(arg) {
      var init;
      init = arg.init;
      return action('init', init);
    }
  };

  handle('init', function(init) {
    var ref2, ref3;
    viewstate.setState(viewstate.STATE_NORMAL);
    entity._initFromSelfEntity(init.self_entity);
    entity._initFromEntities(init.entities);
    conv._initFromConvStates(init.conv_states);
    if (!conv[viewstate.selectedConv]) {
      return viewstate.setSelectedConv((ref2 = conv.list()) != null ? (ref3 = ref2[0]) != null ? ref3.conversation_id : void 0 : void 0);
    }
  });

  handle('chat_message', function(ev) {
    conv.addChatMessage(ev);
    return notify.addToNotify(ev);
  });

  handle('watermark', function(ev) {
    return conv.addWatermark(ev);
  });

  handle('update:unreadcount', function() {
    return console.log('update');
  });

  handle('addconversation', function() {
    viewstate.setState(viewstate.STATE_ADD_CONVERSATION);
    return convsettings.reset();
  });

  handle('convsettings', function() {
    var id;
    id = viewstate.selectedConv;
    if (!conv[id]) {
      return;
    }
    convsettings.reset();
    convsettings.loadConversation(conv[id]);
    return viewstate.setState(viewstate.STATE_ADD_CONVERSATION);
  });

  handle('activity', function(time) {
    return viewstate.updateActivity(time);
  });

  handle('atbottom', function(atbottom) {
    return viewstate.updateAtBottom(atbottom);
  });

  handle('attop', function(attop) {
    viewstate.updateAtTop(attop);
    return conv.updateAtTop(attop);
  });

  handle('history', function(conv_id, timestamp) {
    return ipc.send('getconversation', conv_id, timestamp, 20);
  });

  handle('handlehistory', function(r) {
    if (!r.conversation_state) {
      return;
    }
    return conv.updateHistory(r.conversation_state);
  });

  handle('selectConv', function(conv) {
    viewstate.setState(viewstate.STATE_NORMAL);
    viewstate.setSelectedConv(conv);
    return ipc.send('setfocus', viewstate.selectedConv);
  });

  handle('selectNextConv', function(offset) {
    if (offset == null) {
      offset = 1;
    }
    if (viewstate.state !== viewstate.STATE_NORMAL) {
      return;
    }
    viewstate.selectNextConv(offset);
    return ipc.send('setfocus', viewstate.selectedConv);
  });

  handle('sendmessage', function(txt) {
    var msg;
    msg = userinput.buildChatMessage(txt);
    ipc.send('sendchatmessage', msg);
    return conv.addChatMessagePlaceholder(entity.self.id, msg);
  });

  sendsetpresence = throttle(10000, function() {
    ipc.send('setpresence');
    return ipc.send('setactiveclient', true, 15);
  });

  resendfocus = throttle(15000, function() {
    return ipc.send('setfocus', viewstate.selectedConv);
  });

  handle('lastActivity', function() {
    sendsetpresence();
    if (document.hasFocus()) {
      return resendfocus();
    }
  });

  handle('appfocus', function() {
    return ipc.send('appfocus');
  });

  handle('updatewatermark', (function() {
    var throttleWaterByConv;
    throttleWaterByConv = {};
    return function() {
      var c, conv_id, sendWater;
      conv_id = viewstate.selectedConv;
      c = conv[conv_id];
      if (!c) {
        return;
      }
      sendWater = throttleWaterByConv[conv_id];
      if (!sendWater) {
        (function(conv_id) {
          sendWater = throttle(1000, function() {
            return ipc.send('updatewatermark', conv_id, Date.now());
          });
          return throttleWaterByConv[conv_id] = sendWater;
        })(conv_id);
      }
      return sendWater();
    };
  })());

  handle('getentity', function(ids) {
    return ipc.send('getentity', ids);
  });

  handle('addentities', function(es, conv_id) {
    var e, i, len, ref2;
    ref2 = es != null ? es : [];
    for (i = 0, len = ref2.length; i < len; i++) {
      e = ref2[i];
      entity.add(e);
    }
    if (conv_id) {
      (es != null ? es : []).forEach(function(p) {
        return conv.addParticipant(conv_id, p);
      });
      return viewstate.setState(viewstate.STATE_NORMAL);
    }
  });

  handle('uploadimage', function(files) {
    var _, client_generated_id, conv_id, ext, file, i, len, msg, ref2, ref3, results;
    conv_id = viewstate.selectedConv;
    if (!(viewstate.state === viewstate.STATE_NORMAL && conv[conv_id])) {
      return;
    }
    results = [];
    for (i = 0, len = files.length; i < len; i++) {
      file = files[i];
      if (!isImg(file.path)) {
        ref3 = (ref2 = file.path.match(/.*(\.\w+)$/)) != null ? ref2 : [], _ = ref3[0], ext = ref3[1];
        notr("Ignoring file of type " + ext);
        continue;
      }
      msg = userinput.buildChatMessage('uploading image…');
      msg.uploadimage = true;
      client_generated_id = msg.client_generated_id;
      conv.addChatMessagePlaceholder(entity.self.id, msg);
      results.push(ipc.send('uploadimage', {
        path: file.path,
        conv_id: conv_id,
        client_generated_id: client_generated_id
      }));
    }
    return results;
  });

  handle('onpasteimage', function() {
    var client_generated_id, conv_id, msg;
    conv_id = viewstate.selectedConv;
    if (!conv_id) {
      return;
    }
    msg = userinput.buildChatMessage('uploading image…');
    msg.uploadimage = true;
    client_generated_id = msg.client_generated_id;
    conv.addChatMessagePlaceholder(entity.self.id, msg);
    return ipc.send('uploadclipboardimage', {
      conv_id: conv_id,
      client_generated_id: client_generated_id
    });
  });

  handle('uploadingimage', function(spec) {});

  handle('leftresize', function(size) {
    return viewstate.setLeftSize(size);
  });

  handle('resize', function(dim) {
    return viewstate.setSize(dim);
  });

  handle('moved', function(pos) {
    return viewstate.setPosition(pos);
  });

  handle('conversationname', function(name) {
    return convsettings.setName(name);
  });

  handle('conversationquery', function(query) {
    return convsettings.setSearchQuery(query);
  });

  handle('searchentities', function(query, max_results) {
    return ipc.send('searchentities', query, max_results);
  });

  handle('setsearchedentities', function(r) {
    return convsettings.setSearchedEntities(r);
  });

  handle('selectentity', function(e) {
    return convsettings.addSelectedEntity(e);
  });

  handle('deselectentity', function(e) {
    return convsettings.removeSelectedEntity(e);
  });

  handle('togglegroup', function(e) {
    return convsettings.setGroup(!convsettings.group);
  });

  handle('saveconversation', function() {
    var c, conv_id, current, e, id, name, needsRename, one_to_one, p, recreate, ref2, selected, toadd;
    viewstate.setState(viewstate.STATE_NORMAL);
    conv_id = convsettings.id;
    c = conv[conv_id];
    one_to_one = (c != null ? (ref2 = c.type) != null ? ref2.indexOf('ONE_TO_ONE') : void 0 : void 0) >= 0;
    selected = (function() {
      var i, len, ref3, results;
      ref3 = convsettings.selectedEntities;
      results = [];
      for (i = 0, len = ref3.length; i < len; i++) {
        e = ref3[i];
        results.push(e.id.chat_id);
      }
      return results;
    })();
    recreate = conv_id && one_to_one && convsettings.group;
    needsRename = convsettings.group && convsettings.name && convsettings.name !== (c != null ? c.name : void 0);
    if (!conv_id || recreate) {
      name = (convsettings.group ? convsettings.name : void 0) || "";
      ipc.send('createconversation', selected, name, convsettings.group);
      return;
    }
    p = c.participant_data;
    current = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = p.length; i < len; i++) {
        c = p[i];
        if (!entity.isSelf(c.id.chat_id)) {
          results.push(c.id.chat_id);
        }
      }
      return results;
    })();
    toadd = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = selected.length; i < len; i++) {
        id = selected[i];
        if (indexOf.call(current, id) < 0) {
          results.push(id);
        }
      }
      return results;
    })();
    if (toadd.length) {
      ipc.send('adduser', conv_id, toadd);
    }
    if (needsRename) {
      return ipc.send('renameconversation', conv_id, convsettings.name);
    }
  });

  handle('conversation_rename', function(c) {
    conv.rename(c, c.conversation_rename.new_name);
    return conv.addChatMessage(c);
  });

  handle('membership_change', function(e) {
    var conv_id, id, ids, ref2;
    conv_id = e.conversation_id.id;
    ids = (function() {
      var i, len, ref2, results;
      ref2 = e.membership_change.participant_ids;
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        id = ref2[i];
        results.push(id.chat_id || id.gaia_id);
      }
      return results;
    })();
    if (e.membership_change.type === 'LEAVE') {
      if (ref2 = entity.self.id, indexOf.call(ids, ref2) >= 0) {
        return conv.deleteConv(conv_id);
      }
      return conv.removeParticipants(conv_id, ids);
    }
    conv.addChatMessage(e);
    return ipc.send('getentity', ids, {
      add_to_conv: conv_id
    });
  });

  handle('createconversationdone', function(c) {
    convsettings.reset();
    conv.add(c);
    return viewstate.setSelectedConv(c.id.id);
  });

  handle('notification_level', function(n) {
    var conv_id, level, ref2;
    conv_id = n != null ? (ref2 = n[0]) != null ? ref2[0] : void 0 : void 0;
    level = (n != null ? n[1] : void 0) === 10 ? 'QUIET' : 'RING';
    if (conv_id && level) {
      return conv.setNotificationLevel(conv_id, level);
    }
  });

  handle('togglenotif', function() {
    var QUIET, RING, c, conv_id, q, ref2;
    ref2 = Client.NotificationLevel, QUIET = ref2.QUIET, RING = ref2.RING;
    conv_id = viewstate.selectedConv;
    if (!(c = conv[conv_id])) {
      return;
    }
    q = conv.isQuiet(c);
    ipc.send('setconversationnotificationlevel', conv_id, (q ? RING : QUIET));
    return conv.setNotificationLevel(conv_id, (q ? 'RING' : 'QUIET'));
  });

  handle('togglestar', function() {
    var c, conv_id;
    conv_id = viewstate.selectedConv;
    if (!(c = conv[conv_id])) {
      return;
    }
    return conv.toggleStar(c);
  });

  handle('delete', function(a) {
    var c, conv_id, ref2;
    conv_id = a != null ? (ref2 = a[0]) != null ? ref2[0] : void 0 : void 0;
    if (!(c = conv[conv_id])) {
      return;
    }
    return conv.deleteConv(conv_id);
  });

  handle('deleteconv', function(confirmed) {
    var conv_id;
    conv_id = viewstate.selectedConv;
    if (!confirmed) {
      return later(function() {
        if (confirm('Really delete conversation?')) {
          return action('deleteconv', true);
        }
      });
    } else {
      return ipc.send('deleteconversation', conv_id);
    }
  });

  handle('leaveconv', function(confirmed) {
    var conv_id;
    conv_id = viewstate.selectedConv;
    if (!confirmed) {
      return later(function() {
        if (confirm('Really leave conversation?')) {
          return action('leaveconv', true);
        }
      });
    } else {
      return ipc.send('removeuser', conv_id);
    }
  });

  handle('lastkeydown', function(time) {
    return viewstate.setLastKeyDown(time);
  });

  handle('settyping', function(v) {
    var conv_id;
    conv_id = viewstate.selectedConv;
    if (!(conv_id && viewstate.state === viewstate.STATE_NORMAL)) {
      return;
    }
    return ipc.send('settyping', conv_id, v);
  });

  handle('typing', function(t) {
    return conv.addTyping(t);
  });

  handle('pruneTyping', function(conv_id) {
    return conv.pruneTyping(conv_id);
  });

  handle('syncallnewevents', throttle(10000, function(time) {
    if (!time) {
      return;
    }
    return ipc.send('syncallnewevents', time);
  }));

  handle('handlesyncedevents', function(r) {
    var e, i, j, len, len1, ref2, ref3, st, states;
    states = r != null ? r.conversation_state : void 0;
    if (!(states != null ? states.length : void 0)) {
      return;
    }
    for (i = 0, len = states.length; i < len; i++) {
      st = states[i];
      ref3 = (ref2 = st != null ? st.event : void 0) != null ? ref2 : [];
      for (j = 0, len1 = ref3.length; j < len1; j++) {
        e = ref3[j];
        conv.addChatMessage(e);
      }
    }
    return connection.setEventState(connection.IN_SYNC);
  });

  handle('syncrecentconversations', throttle(10000, function() {
    return ipc.send('syncrecentconversations');
  }));

  handle('handlerecentconversations', function(r) {
    var st;
    if (!(st = r.conversation_state)) {
      return;
    }
    conv.replaceFromStates(st);
    return connection.setEventState(connection.IN_SYNC);
  });

  handle('client_conversation', function(c) {
    var ref2;
    if (!conv[c != null ? (ref2 = c.conversation_id) != null ? ref2.id : void 0 : void 0]) {
      return conv.add(c);
    }
  });

  handle('hangout_event', function(e) {
    var ref2, ref3;
    if ((ref2 = e != null ? (ref3 = e.hangout_event) != null ? ref3.event_type : void 0 : void 0) !== 'START_HANGOUT' && ref2 !== 'END_HANGOUT') {
      return;
    }
    return notify.addToNotify(e);
  });

  'presence reply_to_invite settings conversation_notification invitation_watermark'.split(' ').forEach(function(n) {
    return handle(n, function() {
      var as;
      as = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return console.log.apply(console, [n].concat(slice.call(as)));
    });
  });

  handle('unreadtotal', function(total, orMore) {
    var value;
    value = "";
    if (total > 0) {
      value = total + (orMore ? "+" : "");
    }
    return ipc.send('updatebadge', value);
  });

  handle('showconvthumbs', function(doshow) {
    return viewstate.setShowConvThumbs(doshow);
  });

  handle('devtools', function() {
    return remote.getCurrentWindow().openDevTools({
      detach: true
    });
  });

  handle('quit', function() {
    return remote.require('app').quit();
  });

  handle('togglefullscreen', function() {
    return ipc.send('togglefullscreen');
  });

  handle('logout', function() {
    return ipc.send('logout');
  });

  handle('wonline', function(wonline) {
    connection.setWindowOnline(wonline);
    if (wonline) {
      return ipc.send('hangupsConnect');
    } else {
      return ipc.send('hangupsDisconnect');
    }
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,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MkIsU0FBQTtXQUN2QixHQUFHLENBQUMsSUFBSixDQUFTLGtCQUFUO0VBRHVCLENBQTNCOztFQUdBLE1BQUEsQ0FBTyxRQUFQLEVBQWlCLFNBQUE7V0FDYixHQUFHLENBQUMsSUFBSixDQUFTLFFBQVQ7RUFEYSxDQUFqQjs7RUFHQSxNQUFBLENBQU8sU0FBUCxFQUFrQixTQUFDLE9BQUQ7SUFDZCxVQUFVLENBQUMsZUFBWCxDQUEyQixPQUEzQjtJQUNBLElBQUcsT0FBSDthQUNJLEdBQUcsQ0FBQyxJQUFKLENBQVMsZ0JBQVQsRUFESjtLQUFBLE1BQUE7YUFHSSxHQUFHLENBQUMsSUFBSixDQUFTLG1CQUFULEVBSEo7O0VBRmMsQ0FBbEI7QUF0VEEiLCJmaWxlIjoidWkvZGlzcGF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIkNsaWVudCA9IHJlcXVpcmUgJ2hhbmd1cHNqcydcbnJlbW90ZSA9IHJlcXVpcmUgJ3JlbW90ZSdcbmlwYyAgICA9IHJlcXVpcmUgJ2lwYydcblxue2VudGl0eSwgY29udiwgdmlld3N0YXRlLCB1c2VyaW5wdXQsIGNvbm5lY3Rpb24sIGNvbnZzZXR0aW5ncywgbm90aWZ5fSA9IHJlcXVpcmUgJy4vbW9kZWxzJ1xue3Rocm90dGxlLCBsYXRlciwgaXNJbWd9ID0gcmVxdWlyZSAnLi91dGlsJ1xuXG4nY29ubmVjdGluZyBjb25uZWN0ZWQgY29ubmVjdF9mYWlsZWQnLnNwbGl0KCcgJykuZm9yRWFjaCAobikgLT5cbiAgICBoYW5kbGUgbiwgLT4gY29ubmVjdGlvbi5zZXRTdGF0ZSBuXG5cbmhhbmRsZSAnYWxpdmUnLCAodGltZSkgLT4gY29ubmVjdGlvbi5zZXRMYXN0QWN0aXZlIHRpbWVcblxuaGFuZGxlICdyZXFpbml0JywgLT5cbiAgICBpcGMuc2VuZCAncmVxaW5pdCdcbiAgICBjb25uZWN0aW9uLnNldFN0YXRlIGNvbm5lY3Rpb24uQ09OTkVDVElOR1xuICAgIHZpZXdzdGF0ZS5zZXRTdGF0ZSB2aWV3c3RhdGUuU1RBVEVfU1RBUlRVUFxuXG5tb2R1bGUuZXhwb3J0cyA9XG4gICAgaW5pdDogKHtpbml0fSkgLT4gYWN0aW9uICdpbml0JywgaW5pdFxuXG5cbmhhbmRsZSAnaW5pdCcsIChpbml0KSAtPlxuICAgICMgc2V0IHRoZSBpbml0aWFsIHZpZXcgc3RhdGVcbiAgICB2aWV3c3RhdGUuc2V0U3RhdGUgdmlld3N0YXRlLlNUQVRFX05PUk1BTFxuXG4gICAgIyB1cGRhdGUgbW9kZWwgZnJvbSBpbml0IG9iamVjdFxuICAgIGVudGl0eS5faW5pdEZyb21TZWxmRW50aXR5IGluaXQuc2VsZl9lbnRpdHlcbiAgICBlbnRpdHkuX2luaXRGcm9tRW50aXRpZXMgaW5pdC5lbnRpdGllc1xuICAgIGNvbnYuX2luaXRGcm9tQ29udlN0YXRlcyBpbml0LmNvbnZfc3RhdGVzXG4gICAgIyBlbnN1cmUgdGhlcmUncyBhIHNlbGVjdGVkIGNvbnZcbiAgICB1bmxlc3MgY29udlt2aWV3c3RhdGUuc2VsZWN0ZWRDb252XVxuICAgICAgICB2aWV3c3RhdGUuc2V0U2VsZWN0ZWRDb252IGNvbnYubGlzdCgpP1swXT8uY29udmVyc2F0aW9uX2lkXG5cbmhhbmRsZSAnY2hhdF9tZXNzYWdlJywgKGV2KSAtPlxuICAgIGNvbnYuYWRkQ2hhdE1lc3NhZ2UgZXZcbiAgICAjIHRoZXNlIG1lc3NhZ2VzIGFyZSB0byBnbyB0aHJvdWdoIG5vdGlmaWNhdGlvbnNcbiAgICBub3RpZnkuYWRkVG9Ob3RpZnkgZXZcblxuaGFuZGxlICd3YXRlcm1hcmsnLCAoZXYpIC0+XG4gICAgY29udi5hZGRXYXRlcm1hcmsgZXZcblxuaGFuZGxlICd1cGRhdGU6dW5yZWFkY291bnQnLCAtPlxuICAgIGNvbnNvbGUubG9nICd1cGRhdGUnXG5cbmhhbmRsZSAnYWRkY29udmVyc2F0aW9uJywgLT5cbiAgICB2aWV3c3RhdGUuc2V0U3RhdGUgdmlld3N0YXRlLlNUQVRFX0FERF9DT05WRVJTQVRJT05cbiAgICBjb252c2V0dGluZ3MucmVzZXQoKVxuXG5oYW5kbGUgJ2NvbnZzZXR0aW5ncycsIC0+XG4gICAgaWQgPSB2aWV3c3RhdGUuc2VsZWN0ZWRDb252XG4gICAgcmV0dXJuIHVubGVzcyBjb252W2lkXVxuICAgIGNvbnZzZXR0aW5ncy5yZXNldCgpXG4gICAgY29udnNldHRpbmdzLmxvYWRDb252ZXJzYXRpb24gY29udltpZF1cbiAgICB2aWV3c3RhdGUuc2V0U3RhdGUgdmlld3N0YXRlLlNUQVRFX0FERF9DT05WRVJTQVRJT05cblxuaGFuZGxlICdhY3Rpdml0eScsICh0aW1lKSAtPlxuICAgIHZpZXdzdGF0ZS51cGRhdGVBY3Rpdml0eSB0aW1lXG5cbmhhbmRsZSAnYXRib3R0b20nLCAoYXRib3R0b20pIC0+XG4gICAgdmlld3N0YXRlLnVwZGF0ZUF0Qm90dG9tIGF0Ym90dG9tXG5cbmhhbmRsZSAnYXR0b3AnLCAoYXR0b3ApIC0+XG4gICAgdmlld3N0YXRlLnVwZGF0ZUF0VG9wIGF0dG9wXG4gICAgY29udi51cGRhdGVBdFRvcCBhdHRvcFxuXG5oYW5kbGUgJ2hpc3RvcnknLCAoY29udl9pZCwgdGltZXN0YW1wKSAtPlxuICAgIGlwYy5zZW5kICdnZXRjb252ZXJzYXRpb24nLCBjb252X2lkLCB0aW1lc3RhbXAsIDIwXG5cbmhhbmRsZSAnaGFuZGxlaGlzdG9yeScsIChyKSAtPlxuICAgIHJldHVybiB1bmxlc3Mgci5jb252ZXJzYXRpb25fc3RhdGVcbiAgICBjb252LnVwZGF0ZUhpc3Rvcnkgci5jb252ZXJzYXRpb25fc3RhdGVcblxuaGFuZGxlICdzZWxlY3RDb252JywgKGNvbnYpIC0+XG4gICAgdmlld3N0YXRlLnNldFN0YXRlIHZpZXdzdGF0ZS5TVEFURV9OT1JNQUxcbiAgICB2aWV3c3RhdGUuc2V0U2VsZWN0ZWRDb252IGNvbnZcbiAgICBpcGMuc2VuZCAnc2V0Zm9jdXMnLCB2aWV3c3RhdGUuc2VsZWN0ZWRDb252XG5cbmhhbmRsZSAnc2VsZWN0TmV4dENvbnYnLCAob2Zmc2V0ID0gMSkgLT5cbiAgICBpZiB2aWV3c3RhdGUuc3RhdGUgIT0gdmlld3N0YXRlLlNUQVRFX05PUk1BTCB0aGVuIHJldHVyblxuICAgIHZpZXdzdGF0ZS5zZWxlY3ROZXh0Q29udiBvZmZzZXRcbiAgICBpcGMuc2VuZCAnc2V0Zm9jdXMnLCB2aWV3c3RhdGUuc2VsZWN0ZWRDb252XG5cbmhhbmRsZSAnc2VuZG1lc3NhZ2UnLCAodHh0KSAtPlxuICAgIG1zZyA9IHVzZXJpbnB1dC5idWlsZENoYXRNZXNzYWdlIHR4dFxuICAgIGlwYy5zZW5kICdzZW5kY2hhdG1lc3NhZ2UnLCBtc2dcbiAgICBjb252LmFkZENoYXRNZXNzYWdlUGxhY2Vob2xkZXIgZW50aXR5LnNlbGYuaWQsIG1zZ1xuXG5cbnNlbmRzZXRwcmVzZW5jZSA9IHRocm90dGxlIDEwMDAwLCAtPlxuICAgIGlwYy5zZW5kICdzZXRwcmVzZW5jZSdcbiAgICBpcGMuc2VuZCAnc2V0YWN0aXZlY2xpZW50JywgdHJ1ZSwgMTVcbnJlc2VuZGZvY3VzID0gdGhyb3R0bGUgMTUwMDAsIC0+IGlwYy5zZW5kICdzZXRmb2N1cycsIHZpZXdzdGF0ZS5zZWxlY3RlZENvbnZcblxuaGFuZGxlICdsYXN0QWN0aXZpdHknLCAtPlxuICAgIHNlbmRzZXRwcmVzZW5jZSgpXG4gICAgcmVzZW5kZm9jdXMoKSBpZiBkb2N1bWVudC5oYXNGb2N1cygpXG5cbmhhbmRsZSAnYXBwZm9jdXMnLCAtPlxuICAgIGlwYy5zZW5kICdhcHBmb2N1cydcblxuaGFuZGxlICd1cGRhdGV3YXRlcm1hcmsnLCBkbyAtPlxuICAgIHRocm90dGxlV2F0ZXJCeUNvbnYgPSB7fVxuICAgIC0+XG4gICAgICAgIGNvbnZfaWQgPSB2aWV3c3RhdGUuc2VsZWN0ZWRDb252XG4gICAgICAgIGMgPSBjb252W2NvbnZfaWRdXG4gICAgICAgIHJldHVybiB1bmxlc3MgY1xuICAgICAgICBzZW5kV2F0ZXIgPSB0aHJvdHRsZVdhdGVyQnlDb252W2NvbnZfaWRdXG4gICAgICAgIHVubGVzcyBzZW5kV2F0ZXJcbiAgICAgICAgICAgIGRvIChjb252X2lkKSAtPlxuICAgICAgICAgICAgICAgIHNlbmRXYXRlciA9IHRocm90dGxlIDEwMDAsIC0+IGlwYy5zZW5kICd1cGRhdGV3YXRlcm1hcmsnLCBjb252X2lkLCBEYXRlLm5vdygpXG4gICAgICAgICAgICAgICAgdGhyb3R0bGVXYXRlckJ5Q29udltjb252X2lkXSA9IHNlbmRXYXRlclxuICAgICAgICBzZW5kV2F0ZXIoKVxuXG5cbmhhbmRsZSAnZ2V0ZW50aXR5JywgKGlkcykgLT4gaXBjLnNlbmQgJ2dldGVudGl0eScsIGlkc1xuaGFuZGxlICdhZGRlbnRpdGllcycsIChlcywgY29udl9pZCkgLT5cbiAgICBlbnRpdHkuYWRkIGUgZm9yIGUgaW4gZXMgPyBbXVxuICAgIGlmIGNvbnZfaWQgI8KgYXV0by1hZGQgdGhlc2UgcHBsIHRvIGEgY29udlxuICAgICAgICAoZXMgPyBbXSkuZm9yRWFjaCAocCkgLT4gY29udi5hZGRQYXJ0aWNpcGFudCBjb252X2lkLCBwXG4gICAgICAgIHZpZXdzdGF0ZS5zZXRTdGF0ZSB2aWV3c3RhdGUuU1RBVEVfTk9STUFMXG5cbmhhbmRsZSAndXBsb2FkaW1hZ2UnLCAoZmlsZXMpIC0+XG4gICAgIyB0aGlzIG1heSBjaGFuZ2UgZHVyaW5nIHVwbG9hZFxuICAgIGNvbnZfaWQgPSB2aWV3c3RhdGUuc2VsZWN0ZWRDb252XG4gICAgIyBzZW5zZSBjaGVjayB0aGF0IGNsaWVudCBpcyBpbiBnb29kIHN0YXRlXG4gICAgcmV0dXJuIHVubGVzcyB2aWV3c3RhdGUuc3RhdGUgPT0gdmlld3N0YXRlLlNUQVRFX05PUk1BTCBhbmQgY29udltjb252X2lkXVxuICAgICMgc2hpcCBpdFxuICAgIGZvciBmaWxlIGluIGZpbGVzXG4gICAgICAgICMgb25seSBpbWFnZXMgcGxlYXNlXG4gICAgICAgIHVubGVzcyBpc0ltZyBmaWxlLnBhdGhcbiAgICAgICAgICAgIFtfLCBleHRdID0gZmlsZS5wYXRoLm1hdGNoKC8uKihcXC5cXHcrKSQvKSA/IFtdXG4gICAgICAgICAgICBub3RyIFwiSWdub3JpbmcgZmlsZSBvZiB0eXBlICN7ZXh0fVwiXG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAjIG1lc3NhZ2UgZm9yIGEgcGxhY2Vob2xkZXJcbiAgICAgICAgbXNnID0gdXNlcmlucHV0LmJ1aWxkQ2hhdE1lc3NhZ2UgJ3VwbG9hZGluZyBpbWFnZeKApidcbiAgICAgICAgbXNnLnVwbG9hZGltYWdlID0gdHJ1ZVxuICAgICAgICB7Y2xpZW50X2dlbmVyYXRlZF9pZH0gPSBtc2dcbiAgICAgICAgIyBhZGQgYSBwbGFjZWhvbGRlciBmb3IgdGhlIGltYWdlXG4gICAgICAgIGNvbnYuYWRkQ2hhdE1lc3NhZ2VQbGFjZWhvbGRlciBlbnRpdHkuc2VsZi5pZCwgbXNnXG4gICAgICAgICMgYW5kIGJlZ2luIHVwbG9hZFxuICAgICAgICBpcGMuc2VuZCAndXBsb2FkaW1hZ2UnLCB7cGF0aDpmaWxlLnBhdGgsIGNvbnZfaWQsIGNsaWVudF9nZW5lcmF0ZWRfaWR9XG5cbmhhbmRsZSAnb25wYXN0ZWltYWdlJywgLT5cbiAgICBjb252X2lkID0gdmlld3N0YXRlLnNlbGVjdGVkQ29udlxuICAgIHJldHVybiB1bmxlc3MgY29udl9pZFxuICAgIG1zZyA9IHVzZXJpbnB1dC5idWlsZENoYXRNZXNzYWdlICd1cGxvYWRpbmcgaW1hZ2XigKYnXG4gICAgbXNnLnVwbG9hZGltYWdlID0gdHJ1ZVxuICAgIHtjbGllbnRfZ2VuZXJhdGVkX2lkfSA9IG1zZ1xuICAgIGNvbnYuYWRkQ2hhdE1lc3NhZ2VQbGFjZWhvbGRlciBlbnRpdHkuc2VsZi5pZCwgbXNnXG4gICAgaXBjLnNlbmQgJ3VwbG9hZGNsaXBib2FyZGltYWdlJywge2NvbnZfaWQsIGNsaWVudF9nZW5lcmF0ZWRfaWR9XG5cbmhhbmRsZSAndXBsb2FkaW5naW1hZ2UnLCAoc3BlYykgLT5cbiAgICAjIFhYWCB0aGlzIGRvZXNuJ3QgbG9vayB2ZXJ5IGdvb2QgYmVjYXVzZSB0aGUgaW1hZ2VcbiAgICAjIHNob3dzLCB0aGVuIGZsaWNrZXJzIGF3YXkgYmVmb3JlIHRoZSByZWFsIGlzIGxvYWRlZFxuICAgICMgZnJvbSB0aGUgdXBsb2FkLlxuICAgICNjb252LnVwZGF0ZVBsYWNlaG9sZGVySW1hZ2Ugc3BlY1xuXG5oYW5kbGUgJ2xlZnRyZXNpemUnLCAoc2l6ZSkgLT4gdmlld3N0YXRlLnNldExlZnRTaXplIHNpemVcbmhhbmRsZSAncmVzaXplJywgKGRpbSkgLT4gdmlld3N0YXRlLnNldFNpemUgZGltXG5oYW5kbGUgJ21vdmVkJywgKHBvcykgLT4gdmlld3N0YXRlLnNldFBvc2l0aW9uIHBvc1xuXG5oYW5kbGUgJ2NvbnZlcnNhdGlvbm5hbWUnLCAobmFtZSkgLT5cbiAgICBjb252c2V0dGluZ3Muc2V0TmFtZSBuYW1lXG5oYW5kbGUgJ2NvbnZlcnNhdGlvbnF1ZXJ5JywgKHF1ZXJ5KSAtPlxuICAgIGNvbnZzZXR0aW5ncy5zZXRTZWFyY2hRdWVyeSBxdWVyeVxuaGFuZGxlICdzZWFyY2hlbnRpdGllcycsIChxdWVyeSwgbWF4X3Jlc3VsdHMpIC0+XG4gICAgaXBjLnNlbmQgJ3NlYXJjaGVudGl0aWVzJywgcXVlcnksIG1heF9yZXN1bHRzXG5oYW5kbGUgJ3NldHNlYXJjaGVkZW50aXRpZXMnLCAocikgLT5cbiAgICBjb252c2V0dGluZ3Muc2V0U2VhcmNoZWRFbnRpdGllcyByXG5oYW5kbGUgJ3NlbGVjdGVudGl0eScsIChlKSAtPiBjb252c2V0dGluZ3MuYWRkU2VsZWN0ZWRFbnRpdHkgZVxuaGFuZGxlICdkZXNlbGVjdGVudGl0eScsIChlKSAtPiBjb252c2V0dGluZ3MucmVtb3ZlU2VsZWN0ZWRFbnRpdHkgZVxuaGFuZGxlICd0b2dnbGVncm91cCcsIChlKSAtPiBjb252c2V0dGluZ3Muc2V0R3JvdXAoIWNvbnZzZXR0aW5ncy5ncm91cClcblxuaGFuZGxlICdzYXZlY29udmVyc2F0aW9uJywgLT5cbiAgICB2aWV3c3RhdGUuc2V0U3RhdGUgdmlld3N0YXRlLlNUQVRFX05PUk1BTFxuICAgIGNvbnZfaWQgPSBjb252c2V0dGluZ3MuaWRcbiAgICBjID0gY29udltjb252X2lkXVxuICAgIG9uZV90b19vbmUgPSBjPy50eXBlPy5pbmRleE9mKCdPTkVfVE9fT05FJykgPj0gMFxuICAgIHNlbGVjdGVkID0gKGUuaWQuY2hhdF9pZCBmb3IgZSBpbiBjb252c2V0dGluZ3Muc2VsZWN0ZWRFbnRpdGllcylcbiAgICByZWNyZWF0ZSA9IGNvbnZfaWQgYW5kIG9uZV90b19vbmUgYW5kIGNvbnZzZXR0aW5ncy5ncm91cFxuICAgIG5lZWRzUmVuYW1lID0gY29udnNldHRpbmdzLmdyb3VwIGFuZCBjb252c2V0dGluZ3MubmFtZSBhbmQgY29udnNldHRpbmdzLm5hbWUgIT0gYz8ubmFtZVxuICAgICMgcmVtZW1iZXI6IHdlIGRvbid0IHJlbmFtZSBvbmVfdG9fb25lcywgZ29vZ2xlIHdlYiBjbGllbnQgZG9lcyBub3QgZG8gaXRcbiAgICBpZiBub3QgY29udl9pZCBvciByZWNyZWF0ZVxuICAgICAgICBuYW1lID0gKGNvbnZzZXR0aW5ncy5uYW1lIGlmIGNvbnZzZXR0aW5ncy5ncm91cCkgb3IgXCJcIlxuICAgICAgICBpcGMuc2VuZCAnY3JlYXRlY29udmVyc2F0aW9uJywgc2VsZWN0ZWQsIG5hbWUsIGNvbnZzZXR0aW5ncy5ncm91cFxuICAgICAgICByZXR1cm5cbiAgICBwID0gYy5wYXJ0aWNpcGFudF9kYXRhXG4gICAgY3VycmVudCA9IChjLmlkLmNoYXRfaWQgZm9yIGMgaW4gcCB3aGVuIG5vdCBlbnRpdHkuaXNTZWxmIGMuaWQuY2hhdF9pZClcbiAgICB0b2FkZCA9IChpZCBmb3IgaWQgaW4gc2VsZWN0ZWQgd2hlbiBpZCBub3QgaW4gY3VycmVudClcbiAgICBpcGMuc2VuZCAnYWRkdXNlcicsIGNvbnZfaWQsIHRvYWRkIGlmIHRvYWRkLmxlbmd0aFxuICAgIGlwYy5zZW5kICdyZW5hbWVjb252ZXJzYXRpb24nLCBjb252X2lkLCBjb252c2V0dGluZ3MubmFtZSBpZiBuZWVkc1JlbmFtZVxuXG5oYW5kbGUgJ2NvbnZlcnNhdGlvbl9yZW5hbWUnLCAoYykgLT5cbiAgICBjb252LnJlbmFtZSBjLCBjLmNvbnZlcnNhdGlvbl9yZW5hbWUubmV3X25hbWVcbiAgICBjb252LmFkZENoYXRNZXNzYWdlIGNcblxuaGFuZGxlICdtZW1iZXJzaGlwX2NoYW5nZScsIChlKSAtPlxuICAgIGNvbnZfaWQgPSBlLmNvbnZlcnNhdGlvbl9pZC5pZFxuICAgIGlkcyA9IChpZC5jaGF0X2lkIG9yIGlkLmdhaWFfaWQgZm9yIGlkIGluIGUubWVtYmVyc2hpcF9jaGFuZ2UucGFydGljaXBhbnRfaWRzKVxuICAgIGlmIGUubWVtYmVyc2hpcF9jaGFuZ2UudHlwZSA9PSAnTEVBVkUnXG4gICAgICAgIGlmIGVudGl0eS5zZWxmLmlkIGluIGlkc1xuICAgICAgICAgICAgcmV0dXJuIGNvbnYuZGVsZXRlQ29udiBjb252X2lkXG4gICAgICAgIHJldHVybiBjb252LnJlbW92ZVBhcnRpY2lwYW50cyBjb252X2lkLCBpZHNcbiAgICBjb252LmFkZENoYXRNZXNzYWdlIGVcbiAgICBpcGMuc2VuZCAnZ2V0ZW50aXR5JywgaWRzLCB7YWRkX3RvX2NvbnY6IGNvbnZfaWR9XG5cbmhhbmRsZSAnY3JlYXRlY29udmVyc2F0aW9uZG9uZScsIChjKSAtPlxuICAgIGNvbnZzZXR0aW5ncy5yZXNldCgpXG4gICAgY29udi5hZGQgY1xuICAgIHZpZXdzdGF0ZS5zZXRTZWxlY3RlZENvbnYgYy5pZC5pZFxuXG5oYW5kbGUgJ25vdGlmaWNhdGlvbl9sZXZlbCcsIChuKSAtPlxuICAgIGNvbnZfaWQgPSBuP1swXT9bMF1cbiAgICBsZXZlbCA9IGlmIG4/WzFdID09IDEwIHRoZW4gJ1FVSUVUJyBlbHNlICdSSU5HJ1xuICAgIGNvbnYuc2V0Tm90aWZpY2F0aW9uTGV2ZWwgY29udl9pZCwgbGV2ZWwgaWYgY29udl9pZCBhbmQgbGV2ZWxcblxuaGFuZGxlICd0b2dnbGVub3RpZicsIC0+XG4gICAge1FVSUVULCBSSU5HfSA9IENsaWVudC5Ob3RpZmljYXRpb25MZXZlbFxuICAgIGNvbnZfaWQgPSB2aWV3c3RhdGUuc2VsZWN0ZWRDb252XG4gICAgcmV0dXJuIHVubGVzcyBjID0gY29udltjb252X2lkXVxuICAgIHEgPSBjb252LmlzUXVpZXQoYylcbiAgICBpcGMuc2VuZCAnc2V0Y29udmVyc2F0aW9ubm90aWZpY2F0aW9ubGV2ZWwnLCBjb252X2lkLCAoaWYgcSB0aGVuIFJJTkcgZWxzZSBRVUlFVClcbiAgICBjb252LnNldE5vdGlmaWNhdGlvbkxldmVsIGNvbnZfaWQsIChpZiBxIHRoZW4gJ1JJTkcnIGVsc2UgJ1FVSUVUJylcblxuaGFuZGxlICd0b2dnbGVzdGFyJywgLT5cbiAgICBjb252X2lkID0gdmlld3N0YXRlLnNlbGVjdGVkQ29udlxuICAgIHJldHVybiB1bmxlc3MgYyA9IGNvbnZbY29udl9pZF1cbiAgICBjb252LnRvZ2dsZVN0YXIoYylcblxuaGFuZGxlICdkZWxldGUnLCAoYSkgLT5cbiAgICBjb252X2lkID0gYT9bMF0/WzBdXG4gICAgcmV0dXJuIHVubGVzcyBjID0gY29udltjb252X2lkXVxuICAgIGNvbnYuZGVsZXRlQ29udiBjb252X2lkXG5cbmhhbmRsZSAnZGVsZXRlY29udicsIChjb25maXJtZWQpIC0+XG4gICAgY29udl9pZCA9IHZpZXdzdGF0ZS5zZWxlY3RlZENvbnZcbiAgICB1bmxlc3MgY29uZmlybWVkXG4gICAgICAgIGxhdGVyIC0+IGlmIGNvbmZpcm0gJ1JlYWxseSBkZWxldGUgY29udmVyc2F0aW9uPydcbiAgICAgICAgICAgIGFjdGlvbiAnZGVsZXRlY29udicsIHRydWVcbiAgICBlbHNlXG4gICAgICAgIGlwYy5zZW5kICdkZWxldGVjb252ZXJzYXRpb24nLCBjb252X2lkXG5cbmhhbmRsZSAnbGVhdmVjb252JywgKGNvbmZpcm1lZCkgLT5cbiAgICBjb252X2lkID0gdmlld3N0YXRlLnNlbGVjdGVkQ29udlxuICAgIHVubGVzcyBjb25maXJtZWRcbiAgICAgICAgbGF0ZXIgLT4gaWYgY29uZmlybSAnUmVhbGx5IGxlYXZlIGNvbnZlcnNhdGlvbj8nXG4gICAgICAgICAgICBhY3Rpb24gJ2xlYXZlY29udicsIHRydWVcbiAgICBlbHNlXG4gICAgICAgIGlwYy5zZW5kICdyZW1vdmV1c2VyJywgY29udl9pZFxuXG5oYW5kbGUgJ2xhc3RrZXlkb3duJywgKHRpbWUpIC0+IHZpZXdzdGF0ZS5zZXRMYXN0S2V5RG93biB0aW1lXG5oYW5kbGUgJ3NldHR5cGluZycsICh2KSAtPlxuICAgIGNvbnZfaWQgPSB2aWV3c3RhdGUuc2VsZWN0ZWRDb252XG4gICAgcmV0dXJuIHVubGVzcyBjb252X2lkIGFuZCB2aWV3c3RhdGUuc3RhdGUgPT0gdmlld3N0YXRlLlNUQVRFX05PUk1BTFxuICAgIGlwYy5zZW5kICdzZXR0eXBpbmcnLCBjb252X2lkLCB2XG5cbmhhbmRsZSAndHlwaW5nJywgKHQpIC0+XG4gICAgY29udi5hZGRUeXBpbmcgdFxuaGFuZGxlICdwcnVuZVR5cGluZycsIChjb252X2lkKSAtPlxuICAgIGNvbnYucHJ1bmVUeXBpbmcgY29udl9pZFxuXG5oYW5kbGUgJ3N5bmNhbGxuZXdldmVudHMnLCB0aHJvdHRsZSAxMDAwMCwgKHRpbWUpIC0+XG4gICAgcmV0dXJuIHVubGVzcyB0aW1lXG4gICAgaXBjLnNlbmQgJ3N5bmNhbGxuZXdldmVudHMnLCB0aW1lXG5oYW5kbGUgJ2hhbmRsZXN5bmNlZGV2ZW50cycsIChyKSAtPlxuICAgIHN0YXRlcyA9IHI/LmNvbnZlcnNhdGlvbl9zdGF0ZVxuICAgIHJldHVybiB1bmxlc3Mgc3RhdGVzPy5sZW5ndGhcbiAgICBmb3Igc3QgaW4gc3RhdGVzXG4gICAgICAgIGZvciBlIGluIChzdD8uZXZlbnQgPyBbXSlcbiAgICAgICAgICAgIGNvbnYuYWRkQ2hhdE1lc3NhZ2UgZVxuICAgIGNvbm5lY3Rpb24uc2V0RXZlbnRTdGF0ZSBjb25uZWN0aW9uLklOX1NZTkNcblxuaGFuZGxlICdzeW5jcmVjZW50Y29udmVyc2F0aW9ucycsIHRocm90dGxlIDEwMDAwLCAtPlxuICAgIGlwYy5zZW5kICdzeW5jcmVjZW50Y29udmVyc2F0aW9ucydcbmhhbmRsZSAnaGFuZGxlcmVjZW50Y29udmVyc2F0aW9ucycsIChyKSAtPlxuICAgIHJldHVybiB1bmxlc3Mgc3QgPSByLmNvbnZlcnNhdGlvbl9zdGF0ZVxuICAgIGNvbnYucmVwbGFjZUZyb21TdGF0ZXMgc3RcbiAgICBjb25uZWN0aW9uLnNldEV2ZW50U3RhdGUgY29ubmVjdGlvbi5JTl9TWU5DXG5cbmhhbmRsZSAnY2xpZW50X2NvbnZlcnNhdGlvbicsIChjKSAtPlxuICAgIGNvbnYuYWRkIGMgdW5sZXNzIGNvbnZbYz8uY29udmVyc2F0aW9uX2lkPy5pZF1cblxuaGFuZGxlICdoYW5nb3V0X2V2ZW50JywgKGUpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBlPy5oYW5nb3V0X2V2ZW50Py5ldmVudF90eXBlIGluIFsnU1RBUlRfSEFOR09VVCcsICdFTkRfSEFOR09VVCddXG4gICAgIyB0cmlnZ2VyIG5vdGlmaWNhdGlvbnMgZm9yIHRoaXNcbiAgICBub3RpZnkuYWRkVG9Ob3RpZnkgZVxuXG4ncHJlc2VuY2UgcmVwbHlfdG9faW52aXRlIHNldHRpbmdzIGNvbnZlcnNhdGlvbl9ub3RpZmljYXRpb24gaW52aXRhdGlvbl93YXRlcm1hcmsnLnNwbGl0KCcgJykuZm9yRWFjaCAobikgLT5cbiAgICBoYW5kbGUgbiwgKGFzLi4uKSAtPiBjb25zb2xlLmxvZyBuLCBhcy4uLlxuXG5oYW5kbGUgJ3VucmVhZHRvdGFsJywgKHRvdGFsLCBvck1vcmUpIC0+XG4gICAgdmFsdWUgPSBcIlwiXG4gICAgaWYgdG90YWwgPiAwIHRoZW4gdmFsdWUgPSB0b3RhbCArIChpZiBvck1vcmUgdGhlbiBcIitcIiBlbHNlIFwiXCIpXG4gICAgaXBjLnNlbmQgJ3VwZGF0ZWJhZGdlJywgdmFsdWVcblxuaGFuZGxlICdzaG93Y29udnRodW1icycsIChkb3Nob3cpIC0+XG4gICAgdmlld3N0YXRlLnNldFNob3dDb252VGh1bWJzIGRvc2hvd1xuXG5oYW5kbGUgJ2RldnRvb2xzJywgLT5cbiAgICByZW1vdGUuZ2V0Q3VycmVudFdpbmRvdygpLm9wZW5EZXZUb29scyBkZXRhY2g6dHJ1ZVxuXG5oYW5kbGUgJ3F1aXQnLCAtPlxuICAgIHJlbW90ZS5yZXF1aXJlKCdhcHAnKS5xdWl0KClcblxuaGFuZGxlICd0b2dnbGVmdWxsc2NyZWVuJywgLT5cbiAgICBpcGMuc2VuZCAndG9nZ2xlZnVsbHNjcmVlbidcblxuaGFuZGxlICdsb2dvdXQnLCAtPlxuICAgIGlwYy5zZW5kICdsb2dvdXQnXG5cbmhhbmRsZSAnd29ubGluZScsICh3b25saW5lKSAtPlxuICAgIGNvbm5lY3Rpb24uc2V0V2luZG93T25saW5lIHdvbmxpbmVcbiAgICBpZiB3b25saW5lXG4gICAgICAgIGlwYy5zZW5kICdoYW5ndXBzQ29ubmVjdCdcbiAgICBlbHNlXG4gICAgICAgIGlwYy5zZW5kICdoYW5ndXBzRGlzY29ubmVjdCdcbiJdfQ==