(function() {
  var HISTORY_AMOUNT, MAX_UNREAD, add, addChatMessage, addChatMessagePlaceholder, addTyping, addWatermark, domerge, entity, findByEventId, findClientGenerated, funcs, getProxiedName, isEventType, isPureHangout, isQuiet, isStarred, lastChanged, later, lookup, merge, nameof, nameofconv, pruneTyping, ref, rename, sortby, starredconvs, toggleStar, tryparse, uniqfn, unread, unreadTotal, viewstate,
    slice = [].slice,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  entity = require('./entity');

  viewstate = require('./viewstate');

  ref = require('../util'), nameof = ref.nameof, nameofconv = ref.nameofconv, getProxiedName = ref.getProxiedName, later = ref.later, uniqfn = ref.uniqfn, tryparse = ref.tryparse;

  merge = function() {
    var j, k, len1, o, os, t, v;
    t = arguments[0], os = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    for (j = 0, len1 = os.length; j < len1; j++) {
      o = os[j];
      for (k in o) {
        v = o[k];
        if (v !== null && v !== (void 0)) {
          t[k] = v;
        }
      }
    }
    return t;
  };

  lookup = {};

  domerge = function(id, props) {
    var ref1;
    return lookup[id] = merge((ref1 = lookup[id]) != null ? ref1 : {}, props);
  };

  add = function(conv) {
    var conversation, event, id, j, len1, p, ref1, ref2, ref3, ref4;
    if (conv != null ? (ref1 = conv.conversation) != null ? (ref2 = ref1.conversation_id) != null ? ref2.id : void 0 : void 0 : void 0) {
      conversation = conv.conversation, event = conv.event;
      conv = conversation;
      conv.event = event;
    }
    id = (conv.conversation_id || conv.id).id;
    domerge(id, conv);
    if (conv.event < 20) {
      conv.nomorehistory = true;
    }
    ref4 = (ref3 = conv != null ? conv.participant_data : void 0) != null ? ref3 : [];
    for (j = 0, len1 = ref4.length; j < len1; j++) {
      p = ref4[j];
      entity.add(p);
    }
    return lookup[id];
  };

  rename = function(conv, newname) {
    var id;
    id = conv.conversation_id.id;
    lookup[id].name = newname;
    return updated('conv');
  };

  addChatMessage = function(msg) {
    var conv, cpos, id, ref1, ref2, ref3, ref4;
    id = ((ref1 = msg.conversation_id) != null ? ref1 : {}).id;
    if (!id) {
      return;
    }
    conv = lookup[id];
    if (!conv) {
      conv = lookup[id] = {
        conversation_id: {
          id: id
        },
        event: [],
        self_conversation_state: {
          sort_timestamp: 0
        }
      };
    }
    if (!conv.event) {
      conv.event = [];
    }
    cpos = findClientGenerated(conv, msg != null ? (ref2 = msg.self_event_state) != null ? ref2.client_generated_id : void 0 : void 0);
    if (!cpos) {
      cpos = findByEventId(conv, msg.event_id);
    }
    if (cpos) {
      conv.event[cpos] = msg;
    } else {
      conv.event.push(msg);
    }
    if (conv != null) {
      if ((ref3 = conv.self_conversation_state) != null) {
        ref3.sort_timestamp = (ref4 = msg.timestamp) != null ? ref4 : Date.now() * 1000;
      }
    }
    unreadTotal();
    updated('conv');
    return conv;
  };

  findClientGenerated = function(conv, client_generated_id) {
    var e, i, j, len1, ref1, ref2, ref3;
    if (!client_generated_id) {
      return;
    }
    ref2 = (ref1 = conv.event) != null ? ref1 : [];
    for (i = j = 0, len1 = ref2.length; j < len1; i = ++j) {
      e = ref2[i];
      if (((ref3 = e.self_event_state) != null ? ref3.client_generated_id : void 0) === client_generated_id) {
        return i;
      }
    }
  };

  findByEventId = function(conv, event_id) {
    var e, i, j, len1, ref1, ref2;
    if (!event_id) {
      return;
    }
    ref2 = (ref1 = conv.event) != null ? ref1 : [];
    for (i = j = 0, len1 = ref2.length; j < len1; i = ++j) {
      e = ref2[i];
      if (e.event_id === event_id) {
        return i;
      }
    }
  };

  addChatMessagePlaceholder = function(chat_id, arg) {
    var client_generated_id, conv_id, ev, islater, ref1, ref2, segsj, sr, ts, uploadimage;
    conv_id = arg.conv_id, client_generated_id = arg.client_generated_id, segsj = arg.segsj, ts = arg.ts, uploadimage = arg.uploadimage;
    ts = ts * 1000;
    ev = {
      chat_message: {
        message_content: {
          segment: segsj
        }
      },
      conversation_id: {
        id: conv_id
      },
      self_event_state: {
        client_generated_id: client_generated_id
      },
      sender_id: {
        chat_id: chat_id,
        gaia_id: chat_id
      },
      timestamp: ts,
      placeholder: true,
      uploadimage: uploadimage
    };
    sr = (ref1 = lookup[conv_id]) != null ? (ref2 = ref1.self_conversation_state) != null ? ref2.self_read_state : void 0 : void 0;
    islater = ts > (sr != null ? sr.latest_read_timestamp : void 0);
    if (sr && islater) {
      sr.latest_read_timestamp = ts;
    }
    return addChatMessage(ev);
  };

  addWatermark = function(ev) {
    var conv, conv_id, islater, latest_read_timestamp, participant_id, ref1, ref2, rev, sr, uniq;
    conv_id = ev != null ? (ref1 = ev.conversation_id) != null ? ref1.id : void 0 : void 0;
    if (!(conv_id && (conv = lookup[conv_id]))) {
      return;
    }
    if (!conv.read_state) {
      conv.read_state = [];
    }
    participant_id = ev.participant_id, latest_read_timestamp = ev.latest_read_timestamp;
    conv.read_state.push({
      participant_id: participant_id,
      latest_read_timestamp: latest_read_timestamp
    });
    if (conv.read_state.length > 200) {
      rev = conv.read_state.reverse();
      uniq = uniqfn(rev, function(e) {
        return e.participant_id.chat_id;
      });
      conv.read_state = uniq.reverse();
    }
    sr = conv != null ? (ref2 = conv.self_conversation_state) != null ? ref2.self_read_state : void 0 : void 0;
    islater = latest_read_timestamp > (sr != null ? sr.latest_read_timestamp : void 0);
    if (entity.isSelf(participant_id.chat_id) && sr && islater) {
      sr.latest_read_timestamp = latest_read_timestamp;
    }
    unreadTotal();
    return updated('conv');
  };

  uniqfn = function(as, fn) {
    var bs;
    bs = as.map(fn);
    return as.filter(function(e, i) {
      return bs.indexOf(bs[i]) === i;
    });
  };

  sortby = function(conv) {
    var ref1, ref2;
    return (ref1 = conv != null ? (ref2 = conv.self_conversation_state) != null ? ref2.sort_timestamp : void 0 : void 0) != null ? ref1 : 0;
  };

  MAX_UNREAD = 20;

  unread = function(conv) {
    var c, e, j, len1, ref1, ref2, ref3, ref4, t;
    t = conv != null ? (ref1 = conv.self_conversation_state) != null ? (ref2 = ref1.self_read_state) != null ? ref2.latest_read_timestamp : void 0 : void 0 : void 0;
    if (typeof t !== 'number') {
      return 0;
    }
    c = 0;
    ref4 = (ref3 = conv != null ? conv.event : void 0) != null ? ref3 : [];
    for (j = 0, len1 = ref4.length; j < len1; j++) {
      e = ref4[j];
      if (e.chat_message && e.timestamp > t) {
        c++;
      }
      if (c >= MAX_UNREAD) {
        return MAX_UNREAD;
      }
    }
    return c;
  };

  unreadTotal = (function() {
    var current, orMore;
    current = 0;
    orMore = false;
    return function() {
      var countunread, newTotal, sum;
      sum = function(a, b) {
        return a + b;
      };
      orMore = false;
      countunread = function(c) {
        var count;
        if (isQuiet(c)) {
          return 0;
        }
        count = funcs.unread(c);
        if (count === MAX_UNREAD) {
          orMore = true;
        }
        return count;
      };
      newTotal = funcs.list(false).map(countunread).reduce(sum, 0);
      if (current !== newTotal) {
        current = newTotal;
        return later(function() {
          return action('unreadtotal', newTotal, orMore);
        });
      }
    };
  })();

  isQuiet = function(c) {
    var ref1;
    return (c != null ? (ref1 = c.self_conversation_state) != null ? ref1.notification_level : void 0 : void 0) === 'QUIET';
  };

  starredconvs = tryparse(localStorage.starredconvs) || [];

  isStarred = function(c) {
    var ref1, ref2;
    return ref1 = c != null ? (ref2 = c.conversation_id) != null ? ref2.id : void 0 : void 0, indexOf.call(starredconvs, ref1) >= 0;
  };

  toggleStar = function(c) {
    var i, id;
    id = c != null ? c.conversation_id.id : void 0;
    if (indexOf.call(starredconvs, id) < 0) {
      starredconvs.push(id);
    } else {
      starredconvs = (function() {
        var j, len1, results;
        results = [];
        for (j = 0, len1 = starredconvs.length; j < len1; j++) {
          i = starredconvs[j];
          if (i !== id) {
            results.push(i);
          }
        }
        return results;
      })();
    }
    localStorage.starredconvs = JSON.stringify(starredconvs);
    return updated('conv');
  };

  isEventType = function(type) {
    return function(ev) {
      return !!ev[type];
    };
  };

  isPureHangout = (function() {
    var isNotHangout, nots;
    nots = ['chat_message', 'conversation_rename'].map(isEventType);
    isNotHangout = function(e) {
      return nots.some(function(f) {
        return f(e);
      });
    };
    return function(c) {
      var ref1;
      return !((ref1 = c != null ? c.event : void 0) != null ? ref1 : []).some(isNotHangout);
    };
  })();

  lastChanged = function(c) {
    var ref1, ref2, ref3, ref4, ref5;
    return ((ref1 = c != null ? (ref2 = c.event) != null ? (ref3 = ref2[((ref4 = c != null ? (ref5 = c.event) != null ? ref5.length : void 0 : void 0) != null ? ref4 : 0) - 1]) != null ? ref3.timestamp : void 0 : void 0 : void 0) != null ? ref1 : 0) / 1000;
  };

  HISTORY_AMOUNT = 20;

  addTyping = function(typing) {
    var c, conv_id, len, ref1;
    conv_id = typing != null ? (ref1 = typing.conversation_id) != null ? ref1.id : void 0 : void 0;
    if (entity.isSelf(typing.user_id.chat_id)) {
      return;
    }
    if (!(c = lookup[conv_id])) {
      return;
    }
    if (!c.typing) {
      c.typing = [];
    }
    len = c.typing.length;
    c.typing.unshift(typing);
    c.typing = uniqfn(c.typing, function(t) {
      return t.user_id.chat_id;
    });
    c.typing.sort(function(t1, t2) {
      return t1.user_id.chat_id - t2.user_id.chat_id;
    });
    later(function() {
      return action('pruneTyping', conv_id);
    });
    updated('conv');
    if (len === 0) {
      return updated('startTyping');
    }
  };

  pruneTyping = (function() {
    var KEEP_OTHERS, KEEP_STOPPED, findNext, keepFor, prune;
    findNext = function(arr) {
      var expiry, i, j, len1, next, t;
      expiry = arr.map(function(t) {
        return t.timestamp + keepFor(t);
      });
      for (i = j = 0, len1 = expiry.length; j < len1; i = ++j) {
        t = expiry[i];
        if (!next || expiry[i] < expiry[next]) {
          next = i;
        }
      }
      return next;
    };
    KEEP_STOPPED = 1500;
    KEEP_OTHERS = 10000;
    keepFor = function(t) {
      if ((t != null ? t.status : void 0) === 'STOPPED') {
        return KEEP_STOPPED;
      } else {
        return KEEP_OTHERS;
      }
    };
    prune = function(t) {
      return (Date.now() - (t != null ? t.timestamp : void 0) / 1000) < keepFor(t);
    };
    return function(conv_id) {
      var c, lengthBefore, next, nextidx, waitUntil;
      if (!(c = lookup[conv_id])) {
        return;
      }
      if (c.typingtimer) {
        c.typingtimer = clearTimeout(c.typingtimer);
      }
      lengthBefore = c.typing.length;
      c.typing = c.typing.filter(prune);
      if (c.typing.length !== lengthBefore) {
        updated('conv');
      }
      if (!((nextidx = findNext(c.typing)) >= 0)) {
        return;
      }
      next = c.typing[nextidx];
      waitUntil = (keepFor(next) + next.timestamp / 1000) - Date.now();
      if (waitUntil < 0) {
        return console.error('typing prune error', waitUntil);
      }
      return c.typingtimer = setTimeout((function() {
        return action('pruneTyping', conv_id);
      }), waitUntil);
    };
  })();

  funcs = {
    count: function() {
      var c, k, v;
      c = 0;
      for (k in lookup) {
        v = lookup[k];
        if (typeof v === 'object') {
          c++;
        }
      }
      return c;
    },
    _reset: function() {
      var k, v;
      for (k in lookup) {
        v = lookup[k];
        if (typeof v === 'object') {
          delete lookup[k];
        }
      }
      updated('conv');
      return null;
    },
    _initFromConvStates: function(convs) {
      var c, conv, countIf, j, len1;
      c = 0;
      countIf = function(a) {
        if (a) {
          return c++;
        }
      };
      for (j = 0, len1 = convs.length; j < len1; j++) {
        conv = convs[j];
        countIf(add(conv));
      }
      updated('conv');
      return c;
    },
    add: add,
    rename: rename,
    addChatMessage: addChatMessage,
    addChatMessagePlaceholder: addChatMessagePlaceholder,
    addWatermark: addWatermark,
    MAX_UNREAD: MAX_UNREAD,
    unread: unread,
    isQuiet: isQuiet,
    isStarred: isStarred,
    toggleStar: toggleStar,
    isPureHangout: isPureHangout,
    lastChanged: lastChanged,
    addTyping: addTyping,
    pruneTyping: pruneTyping,
    setNotificationLevel: function(conv_id, level) {
      var c, ref1;
      if (!(c = lookup[conv_id])) {
        return;
      }
      if ((ref1 = c.self_conversation_state) != null) {
        ref1.notification_level = level;
      }
      return updated('conv');
    },
    deleteConv: function(conv_id) {
      var c;
      if (!(c = lookup[conv_id])) {
        return;
      }
      delete lookup[conv_id];
      viewstate.setSelectedConv(null);
      return updated('conv');
    },
    removeParticipants: function(conv_id, ids) {
      var c, getId, p;
      if (!(c = lookup[conv_id])) {
        return;
      }
      getId = function(p) {
        return p.id.chat_id || p.id.gaia_id;
      };
      return c.participant_data = (function() {
        var j, len1, ref1, ref2, results;
        ref1 = c.participant_data;
        results = [];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          p = ref1[j];
          if (ref2 = getId(p), indexOf.call(ids, ref2) < 0) {
            results.push(p);
          }
        }
        return results;
      })();
    },
    addParticipant: function(conv_id, participant) {
      var c;
      if (!(c = lookup[conv_id])) {
        return;
      }
      return c.participant_data.push(participant);
    },
    replaceFromStates: function(states) {
      var j, len1, st;
      for (j = 0, len1 = states.length; j < len1; j++) {
        st = states[j];
        add(st);
      }
      return updated('conv');
    },
    updateAtTop: function(attop) {
      var c, conv_id, ref1, ref2, ref3, timestamp;
      if (viewstate.state !== viewstate.STATE_NORMAL) {
        return;
      }
      conv_id = viewstate != null ? viewstate.selectedConv : void 0;
      if (attop && (c = lookup[conv_id]) && !(c != null ? c.nomorehistory : void 0) && !(c != null ? c.requestinghistory : void 0)) {
        timestamp = ((ref1 = (ref2 = c.event) != null ? (ref3 = ref2[0]) != null ? ref3.timestamp : void 0 : void 0) != null ? ref1 : 0) / 1000;
        if (!timestamp) {
          return;
        }
        c.requestinghistory = true;
        later(function() {
          return action('history', conv_id, timestamp, HISTORY_AMOUNT);
        });
        return updated('conv');
      }
    },
    updateHistory: function(state) {
      var c, conv_id, event, ref1, ref2;
      conv_id = state != null ? (ref1 = state.conversation_id) != null ? ref1.id : void 0 : void 0;
      if (!(c = lookup[conv_id])) {
        return;
      }
      c.requestinghistory = false;
      event = state != null ? state.event : void 0;
      c.event = (event != null ? event : []).concat((ref2 = c.event) != null ? ref2 : []);
      if ((event != null ? event.length : void 0) === 0) {
        c.nomorehistory = true;
      }
      updated('beforeHistory');
      updated('conv');
      return updated('afterHistory');
    },
    updatePlaceholderImage: function(arg) {
      var c, client_generated_id, conv_id, cpos, ev, path, seg;
      conv_id = arg.conv_id, client_generated_id = arg.client_generated_id, path = arg.path;
      if (!(c = lookup[conv_id])) {
        return;
      }
      cpos = findClientGenerated(c, client_generated_id);
      ev = c.event[cpos];
      seg = ev.chat_message.message_content.segment[0];
      seg.link_data = {
        link_target: path
      };
      return updated('conv');
    },
    list: function(sort) {
      var c, convs, k, starred, v;
      if (sort == null) {
        sort = true;
      }
      convs = (function() {
        var results;
        results = [];
        for (k in lookup) {
          v = lookup[k];
          if (typeof v === 'object') {
            results.push(v);
          }
        }
        return results;
      })();
      if (sort) {
        starred = (function() {
          var j, len1, results;
          results = [];
          for (j = 0, len1 = convs.length; j < len1; j++) {
            c = convs[j];
            if (isStarred(c)) {
              results.push(c);
            }
          }
          return results;
        })();
        convs = (function() {
          var j, len1, results;
          results = [];
          for (j = 0, len1 = convs.length; j < len1; j++) {
            c = convs[j];
            if (!isStarred(c)) {
              results.push(c);
            }
          }
          return results;
        })();
        starred.sort(function(e1, e2) {
          return nameofconv(e1).localeCompare(nameofconv(e2));
        });
        convs.sort(function(e1, e2) {
          return sortby(e2) - sortby(e1);
        });
        return starred.concat(convs);
      }
      return convs;
    }
  };

  module.exports = merge(lookup, funcs);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVpL21vZGVscy9jb252LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsb1lBQUE7SUFBQTs7O0VBQUEsTUFBQSxHQUFTLE9BQUEsQ0FBUSxVQUFSOztFQUNULFNBQUEsR0FBWSxPQUFBLENBQVEsYUFBUjs7RUFDWixNQUFpRSxPQUFBLENBQVEsU0FBUixDQUFqRSxFQUFDLGFBQUEsTUFBRCxFQUFTLGlCQUFBLFVBQVQsRUFBcUIscUJBQUEsY0FBckIsRUFBcUMsWUFBQSxLQUFyQyxFQUE0QyxhQUFBLE1BQTVDLEVBQW9ELGVBQUE7O0VBRXBELEtBQUEsR0FBVSxTQUFBO0FBQWMsUUFBQTtJQUFiLGtCQUFHO0FBQVUsU0FBQSxzQ0FBQTs7QUFBQSxXQUFBLE1BQUE7O1lBQTJCLENBQUEsS0FBVSxJQUFWLElBQUEsQ0FBQSxLQUFnQjtVQUEzQyxDQUFFLENBQUEsQ0FBQSxDQUFGLEdBQU87O0FBQVA7QUFBQTtXQUFtRTtFQUFqRjs7RUFFVixNQUFBLEdBQVM7O0VBRVQsT0FBQSxHQUFVLFNBQUMsRUFBRCxFQUFLLEtBQUw7QUFBZSxRQUFBO1dBQUEsTUFBTyxDQUFBLEVBQUEsQ0FBUCxHQUFhLEtBQUEsc0NBQW9CLEVBQXBCLEVBQXlCLEtBQXpCO0VBQTVCOztFQUVWLEdBQUEsR0FBTSxTQUFDLElBQUQ7QUFFRixRQUFBO0lBQUEsb0dBQXNDLENBQUUsNkJBQXhDO01BQ0ssb0JBQUEsWUFBRCxFQUFlLGFBQUE7TUFDZixJQUFBLEdBQU87TUFDUCxJQUFJLENBQUMsS0FBTCxHQUFhLE1BSGpCOztJQUlDLEtBQU0sQ0FBQSxJQUFJLENBQUMsZUFBTCxJQUF3QixJQUFJLENBQUMsRUFBN0IsRUFBTjtJQUNELE9BQUEsQ0FBUSxFQUFSLEVBQVksSUFBWjtJQUdBLElBQTZCLElBQUksQ0FBQyxLQUFMLEdBQWEsRUFBMUM7TUFBQSxJQUFJLENBQUMsYUFBTCxHQUFxQixLQUFyQjs7QUFHQTtBQUFBLFNBQUEsd0NBQUE7O01BQUEs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QUFBOzs7UUFDWCxLQUFBOztBQUFTO2VBQUEseUNBQUE7O2dCQUFzQixDQUFJLFNBQUEsQ0FBVSxDQUFWOzJCQUExQjs7QUFBQTs7O1FBQ1QsT0FBTyxDQUFDLElBQVIsQ0FBYSxTQUFDLEVBQUQsRUFBSyxFQUFMO2lCQUFZLFVBQUEsQ0FBVyxFQUFYLENBQWMsQ0FBQyxhQUFmLENBQTZCLFVBQUEsQ0FBVyxFQUFYLENBQTdCO1FBQVosQ0FBYjtRQUNBLEtBQUssQ0FBQyxJQUFOLENBQVcsU0FBQyxFQUFELEVBQUssRUFBTDtpQkFBWSxNQUFBLENBQU8sRUFBUCxDQUFBLEdBQWEsTUFBQSxDQUFPLEVBQVA7UUFBekIsQ0FBWDtBQUNBLGVBQU8sT0FBTyxDQUFDLE1BQVIsQ0FBZSxLQUFmLEVBTFg7O2FBTUE7SUFSRSxDQXpGTjs7O0VBcUdKLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLEtBQUEsQ0FBTSxNQUFOLEVBQWMsS0FBZDtBQXJWakIiLCJmaWxlIjoidWkvbW9kZWxzL2NvbnYuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJlbnRpdHkgPSByZXF1aXJlICcuL2VudGl0eScgICAgICNcbnZpZXdzdGF0ZSA9IHJlcXVpcmUgJy4vdmlld3N0YXRlJ1xue25hbWVvZiwgbmFtZW9mY29udiwgZ2V0UHJveGllZE5hbWUsIGxhdGVyLCB1bmlxZm4sIHRyeXBhcnNlfSAgPSByZXF1aXJlICcuLi91dGlsJ1xuXG5tZXJnZSAgID0gKHQsIG9zLi4uKSAtPiB0W2tdID0gdiBmb3Igayx2IG9mIG8gd2hlbiB2IG5vdCBpbiBbbnVsbCwgdW5kZWZpbmVkXSBmb3IgbyBpbiBvczsgdFxuXG5sb29rdXAgPSB7fVxuXG5kb21lcmdlID0gKGlkLCBwcm9wcykgLT4gbG9va3VwW2lkXSA9IG1lcmdlIChsb29rdXBbaWRdID8ge30pLCBwcm9wc1xuXG5hZGQgPSAoY29udikgLT5cbiAgICAjIHJlamlnIHRoZSBzdHJ1Y3R1cmUgc2luY2UgaXQncyBpbnNhbmVcbiAgICBpZiBjb252Py5jb252ZXJzYXRpb24/LmNvbnZlcnNhdGlvbl9pZD8uaWRcbiAgICAgICAge2NvbnZlcnNhdGlvbiwgZXZlbnR9ID0gY29udlxuICAgICAgICBjb252ID0gY29udmVyc2F0aW9uXG4gICAgICAgIGNvbnYuZXZlbnQgPSBldmVudFxuICAgIHtpZH0gPSBjb252LmNvbnZlcnNhdGlvbl9pZCBvciBjb252LmlkXG4gICAgZG9tZXJnZSBpZCwgY29udlxuICAgICMgd2UgbWFyayBjb252ZXJzYXRpb25zIHdpdGggZmV3IGV2ZW50cyB0byBrbm93IHRoYXQgdGhleSBkZWZpbml0ZWx5XG4gICAgIyBnb3Qgbm8gbW9yZSBoaXN0b3J5LlxuICAgIGNvbnYubm9tb3JlaGlzdG9yeSA9IHRydWUgaWYgY29udi5ldmVudCA8IDIwXG4gICAgIyBwYXJ0aWNpcGFudF9kYXRhIGNvbnRhaW5zIGVudGl0eSBpbmZvcm1hdGlvblxuICAgICMgd2Ugd2FudCBpbiB0aGUgZW50aXR5IGxvb2t1cFxuICAgIGVudGl0eS5hZGQgcCBmb3IgcCBpbiBjb252Py5wYXJ0aWNpcGFudF9kYXRhID8gW11cbiAgICBsb29rdXBbaWRdXG5cbnJlbmFtZSA9IChjb252LCBuZXduYW1lKSAtPlxuICAgIHtpZH0gPSBjb252LmNvbnZlcnNhdGlvbl9pZFxuICAgIGxvb2t1cFtpZF0ubmFtZSA9IG5ld25hbWVcbiAgICB1cGRhdGVkICdjb252J1xuXG5hZGRDaGF0TWVzc2FnZSA9IChtc2cpIC0+XG4gICAge2lkfSA9IG1zZy5jb252ZXJzYXRpb25faWQgPyB7fVxuICAgIHJldHVybiB1bmxlc3MgaWRcbiAgICBjb252ID0gbG9va3VwW2lkXVxuICAgIHVubGVzcyBjb252XG4gICAgICAgICMgYSBjaGF0IG1lc3NhZ2UgdGhhdCBiZWxvbmdzIHRvIG5vIGNvbnZlcnNhdGlvbi4gY3VyaW91cy5cbiAgICAgICAgIyBtYWtlIHNvbWV0aGluZyBza2VsZXRhbCBqdXN0IHRvIGhvbGQgdGhlIG5ldyBtZXNzYWdlXG4gICAgICAgIGNvbnYgPSBsb29rdXBbaWRdID0ge1xuICAgICAgICAgICAgY29udmVyc2F0aW9uX2lkOiB7aWR9XG4gICAgICAgICAgICBldmVudDogW11cbiAgICAgICAgICAgIHNlbGZfY29udmVyc2F0aW9uX3N0YXRlOnNvcnRfdGltZXN0YW1wOjBcbiAgICAgICAgfVxuICAgIGNvbnYuZXZlbnQgPSBbXSB1bmxlc3MgY29udi5ldmVudFxuICAgICMgd2UgY2FuIGFkZCBtZXNzYWdlIHBsYWNlaG9sZGVyIHRoYXQgbmVlZHMgcmVwbGFjaW5nIHdoZW5cbiAgICAjIHRoZSByZWFsIGV2ZW50IGRyb3BzIGluLiBpZiB3ZSBmaW5kIHRoZSBzYW1lIGV2ZW50IGlkLlxuICAgIGNwb3MgPSBmaW5kQ2xpZW50R2VuZXJhdGVkIGNvbnYsIG1zZz8uc2VsZl9ldmVudF9zdGF0ZT8uY2xpZW50X2dlbmVyYXRlZF9pZFxuICAgIHVubGVzcyBjcG9zXG4gICAgICAgIGNwb3MgPSBmaW5kQnlFdmVudElkIGNvbnYsIG1zZy5ldmVudF9pZFxuICAgIGlmIGNwb3NcbiAgICAgICAgIyByZXBsYWNlIGV2ZW50IGJ5IHBvc2l0aW9uXG4gICAgICAgIGNvbnYuZXZlbnRbY3Bvc10gPSBtc2dcbiAgICBlbHNlXG4gICAgICAgICMgYWRkIGxhc3RcbiAgICAgICAgY29udi5ldmVudC5wdXNoIG1zZ1xuICAgICMgdXBkYXRlIHRoZSBzb3J0IHRpbWVzdGFtcCB0byBsaXN0IGNvbnYgZmlyc3RcbiAgICBjb252Py5zZWxmX2NvbnZlcnNhdGlvbl9zdGF0ZT8uc29ydF90aW1lc3RhbXAgPSBtc2cudGltZXN0YW1wID8gKERhdGUubm93KCkgKiAxMDAwKVxuICAgIHVucmVhZFRvdGFsKClcbiAgICB1cGRhdGVkICdjb252J1xuICAgIGNvbnZcblxuZmluZENsaWVudEdlbmVyYXRlZCA9IChjb252LCBjbGllbnRfZ2VuZXJhdGVkX2lkKSAtPlxuICAgIHJldHVybiB1bmxlc3MgY2xpZW50X2dlbmVyYXRlZF9pZFxuICAgIGZvciBlLCBpIGluIGNvbnYuZXZlbnQgPyBbXVxuICAgICAgICByZXR1cm4gaSBpZiBlLnNlbGZfZXZlbnRfc3RhdGU/LmNsaWVudF9nZW5lcmF0ZWRfaWQgPT0gY2xpZW50X2dlbmVyYXRlZF9pZFxuXG5maW5kQnlFdmVudElkID0gKGNvbnYsIGV2ZW50X2lkKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZXZlbnRfaWRcbiAgICBmb3IgZSwgaSBpbiBjb252LmV2ZW50ID8gW11cbiAgICAgICAgcmV0dXJuIGkgaWYgZS5ldmVudF9pZCA9PSBldmVudF9pZFxuXG5cbiMgdGhpcyBpcyB1c2VkIHdoZW4gc2VuZGluZyBuZXcgbWVzc2FnZXMsIHdlIGFkZCBhIHBsYWNlaG9sZGVyIHdpdGhcbiMgdGhlIGNvcnJlY3QgY2xpZW50X2dlbmVyYXRlZF9pZC4gdGhpcyBlbnRyeSB3aWxsIGJlIHJlcGxhY2VkIGluXG4jIGFkZENoYXRNZXNzYWdlIHdoZW4gdGhlIHJlYWwgbWVzc2FnZSBhcnJpdmVzIGZyb20gdGhlIHNlcnZlci5cbmFkZENoYXRNZXNzYWdlUGxhY2Vob2xkZXIgPSAoY2hhdF9pZCwge2NvbnZfaWQsIGNsaWVudF9nZW5lcmF0ZWRfaWQsIHNlZ3NqLCB0cywgdXBsb2FkaW1hZ2V9KSAtPlxuICAgIHRzID0gdHMgKiAxMDAwICMgZ29vZyBmb3JtXG4gICAgZXYgPVxuICAgICAgICBjaGF0X21lc3NhZ2U6bWVzc2FnZV9jb250ZW50OnNlZ21lbnQ6c2Vnc2pcbiAgICAgICAgY29udmVyc2F0aW9uX2lkOmlkOmNvbnZfaWRcbiAgICAgICAgc2VsZl9ldmVudF9zdGF0ZTpjbGllbnRfZ2VuZXJhdGVkX2lkOmNsaWVudF9nZW5lcmF0ZWRfaWRcbiAgICAgICAgc2VuZGVyX2lkOlxuICAgICAgICAgICAgY2hhdF9pZDpjaGF0X2lkXG4gICAgICAgICAgICBnYWlhX2lkOmNoYXRfaWRcbiAgICAgICAgdGltZXN0YW1wOnRzXG4gICAgICAgIHBsYWNlaG9sZGVyOnRydWVcbiAgICAgICAgdXBsb2FkaW1hZ2U6dXBsb2FkaW1hZ2VcbiAgICAjIGxldHMgc2F5IHRoaXMgaXMgYWxzbyByZWFkIHRvIGF2b2lkIGFueSBiYWRnZXNcbiAgICBzciA9IGxvb2t1cFtjb252X2lkXT8uc2VsZl9jb252ZXJzYXRpb25fc3RhdGU/LnNlbGZfcmVhZF9zdGF0ZVxuICAgIGlzbGF0ZXIgPSB0cyA+IHNyPy5sYXRlc3RfcmVhZF90aW1lc3RhbXBcbiAgICBzci5sYXRlc3RfcmVhZF90aW1lc3RhbXAgPSB0cyBpZiBzciBhbmQgaXNsYXRlclxuICAgICMgdGhpcyB0cmlnZ2VycyB0aGUgbW9kZWwgdXBkYXRlXG4gICAgYWRkQ2hhdE1lc3NhZ2UgZXZcblxuYWRkV2F0ZXJtYXJrID0gKGV2KSAtPlxuICAgIGNvbnZfaWQgPSBldj8uY29udmVyc2F0aW9uX2lkPy5pZFxuICAgIHJldHVybiB1bmxlc3MgY29udl9pZCBhbmQgY29udiA9IGxvb2t1cFtjb252X2lkXVxuICAgIGNvbnYucmVhZF9zdGF0ZSA9IFtdIHVubGVzcyBjb252LnJlYWRfc3RhdGVcbiAgICB7cGFydGljaXBhbnRfaWQsIGxhdGVzdF9yZWFkX3RpbWVzdGFtcH0gPSBldlxuICAgIGNvbnYucmVhZF9zdGF0ZS5wdXNoIHtcbiAgICAgICAgcGFydGljaXBhbnRfaWRcbiAgICAgICAgbGF0ZXN0X3JlYWRfdGltZXN0YW1wXG4gICAgfVxuICAgICMgcGFjayB0aGUgcmVhZF9zdGF0ZSBieSBrZWVwaW5nIHRoZSBsYXN0IG9mIGVhY2ggcGFydGljaXBhbnRfaWRcbiAgICBpZiBjb252LnJlYWRfc3RhdGUubGVuZ3RoID4gMjAwXG4gICAgICAgIHJldiA9IGNvbnYucmVhZF9zdGF0ZS5yZXZlcnNlKClcbiAgICAgICAgdW5pcSA9IHVuaXFmbiByZXYsIChlKSAtPiBlLnBhcnRpY2lwYW50X2lkLmNoYXRfaWRcbiAgICAgICAgY29udi5yZWFkX3N0YXRlID0gdW5pcS5yZXZlcnNlKClcbiAgICBzciA9IGNvbnY/LnNlbGZfY29udmVyc2F0aW9uX3N0YXRlPy5zZWxmX3JlYWRfc3RhdGVcbiAgICBpc2xhdGVyID0gbGF0ZXN0X3JlYWRfdGltZXN0YW1wID4gc3I/LmxhdGVzdF9yZWFkX3RpbWVzdGFtcFxuICAgIGlmIGVudGl0eS5pc1NlbGYocGFydGljaXBhbnRfaWQuY2hhdF9pZCkgYW5kIHNyIGFuZCBpc2xhdGVyXG4gICAgICAgIHNyLmxhdGVzdF9yZWFkX3RpbWVzdGFtcCA9IGxhdGVzdF9yZWFkX3RpbWVzdGFtcFxuICAgIHVucmVhZFRvdGFsKClcbiAgICB1cGRhdGVkICdjb252J1xuXG51bmlxZm4gPSAoYXMsIGZuKSAtPiBicyA9IGFzLm1hcCBmbjsgYXMuZmlsdGVyIChlLCBpKSAtPiBicy5pbmRleE9mKGJzW2ldKSA9PSBpXG5cbnNvcnRieSA9IChjb252KSAtPiBjb252Py5zZWxmX2NvbnZlcnNhdGlvbl9zdGF0ZT8uc29ydF90aW1lc3RhbXAgPyAwXG5cbiMgdGhpcyBudW1iZXIgY29ycmVsYXRlcyB0byBudW1iZXIgb2YgbWF4IGV2ZW50cyB3ZSBnZXQgZnJvbVxuIyBoYW5nb3V0cyBvbiBjbGllbnQgc3RhcnR1cC5cbk1BWF9VTlJFQUQgPSAyMFxuXG51bnJlYWQgPSAoY29udikgLT5cbiAgICB0ID0gY29udj8uc2VsZl9jb252ZXJzYXRpb25fc3RhdGU/LnNlbGZfcmVhZF9zdGF0ZT8ubGF0ZXN0X3JlYWRfdGltZXN0YW1wXG4gICAgcmV0dXJuIDAgdW5sZXNzIHR5cGVvZiB0ID09ICdudW1iZXInXG4gICAgYyA9IDBcbiAgICBmb3IgZSBpbiBjb252Py5ldmVudCA/IFtdXG4gICAgICAgIGMrKyBpZiBlLmNoYXRfbWVzc2FnZSBhbmQgZS50aW1lc3RhbXAgPiB0XG4gICAgICAgIHJldHVybiBNQVhfVU5SRUFEIGlmIGMgPj0gTUFYX1VOUkVBRFxuICAgIGNcblxudW5yZWFkVG90YWwgPSBkbyAtPlxuICAgIGN1cnJlbnQgPSAwXG4gICAgb3JNb3JlID0gZmFsc2VcbiAgICAtPlxuICAgICAgICBzdW0gPSAoYSwgYikgLT4gcmV0dXJuIGEgKyBiXG4gICAgICAgIG9yTW9yZSA9IGZhbHNlXG4gICAgICAgIGNvdW50dW5yZWFkID0gKGMpIC0+XG4gICAgICAgICAgICBpZiBpc1F1aWV0KGMpIHRoZW4gcmV0dXJuIDBcbiAgICAgICAgICAgIGNvdW50ID0gZnVuY3MudW5yZWFkIGNcbiAgICAgICAgICAgIGlmIGNvdW50ID09IE1BWF9VTlJFQUQgdGhlbiBvck1vcmUgPSB0cnVlXG4gICAgICAgICAgICByZXR1cm4gY291bnRcbiAgICAgICAgbmV3VG90YWwgPSBmdW5jcy5saXN0KGZhbHNlKS5tYXAoY291bnR1bnJlYWQpLnJlZHVjZShzdW0sMClcbiAgICAgICAgaWYgY3VycmVudCAhPSBuZXdUb3RhbFxuICAgICAgICAgICAgY3VycmVudCA9IG5ld1RvdGFsXG4gICAgICAgICAgICBsYXRlciAtPiBhY3Rpb24gJ3VucmVhZHRvdGFsJywgbmV3VG90YWwsIG9yTW9yZVxuXG5pc1F1aWV0ID0gKGMpIC0+IGM/LnNlbGZfY29udmVyc2F0aW9uX3N0YXRlPy5ub3RpZmljYXRpb25fbGV2ZWwgPT0gJ1FVSUVUJ1xuXG5zdGFycmVkY29udnMgPSB0cnlwYXJzZShsb2NhbFN0b3JhZ2Uuc3RhcnJlZGNvbnZzKSB8fCBbXVxuXG5pc1N0YXJyZWQgPSAoYykgLT4gcmV0dXJuIGM/LmNvbnZlcnNhdGlvbl9pZD8uaWQgaW4gc3RhcnJlZGNvbnZzXG5cbnRvZ2dsZVN0YXIgPSAoYykgLT5cbiAgICB7aWR9ID0gYz8uY29udmVyc2F0aW9uX2lkXG4gICAgaWYgaWQgbm90IGluIHN0YXJyZWRjb252c1xuICAgICAgICBzdGFycmVkY29udnMucHVzaChpZClcbiAgICBlbHNlXG4gICAgICAgIHN0YXJyZWRjb252cyA9IChpIGZvciBpIGluIHN0YXJyZWRjb252cyB3aGVuIGkgIT0gaWQpXG4gICAgbG9jYWxTdG9yYWdlLnN0YXJyZWRjb252cyA9IEpTT04uc3RyaW5naWZ5KHN0YXJyZWRjb252cyk7XG4gICAgdXBkYXRlZCAnY29udidcblxuaXNFdmVudFR5cGUgPSAodHlwZSkgLT4gKGV2KSAtPiAhIWV2W3R5cGVdXG5cbiMgYSBcImhhbmdvdXRcIiBpcyBpbiBnb29nbGUgdGVybXMgc3RyaWN0bHkgYW4gYXVkaW8vdmlkZW8gZXZlbnRcbiMgbWFueSBjb252ZXJzYXRpb25zIGluIHRoZSBjb252ZXJzYXRpb24gbGlzdCBhcmUganVzdCBzdWNoIGFuXG4jIGV2ZW50IHdpdGggbm8gZnVydGhlciBjaGF0IG1lc3NhZ2VzIG9yIGFjdGl2aXR5LiB0aGlzIGZ1bmN0aW9uXG4jIHRlbGxzIHdoZXRoZXIgYSBoYW5nb3V0IG9ubHkgY29udGFpbnMgdmlkZW8vYXVkaW8uXG5pc1B1cmVIYW5nb3V0ID0gZG8gLT5cbiAgICBub3RzID0gWydjaGF0X21lc3NhZ2UnLCAnY29udmVyc2F0aW9uX3JlbmFtZSddLm1hcChpc0V2ZW50VHlwZSlcbiAgICBpc05vdEhhbmdvdXQgPSAoZSkgLT4gbm90cy5zb21lIChmKSAtPiBmKGUpXG4gICAgKGMpIC0+XG4gICAgICAgIG5vdCAoYz8uZXZlbnQgPyBbXSkuc29tZSBpc05vdEhhbmdvdXRcblxuIyB0aGUgdGltZSBvZiB0aGUgbGFzdCBhZGRlZCBldmVudFxubGFzdENoYW5nZWQgPSAoYykgLT4gKGM/LmV2ZW50P1soYz8uZXZlbnQ/Lmxlbmd0aCA/IDApIC0gMV0/LnRpbWVzdGFtcCA/IDApIC8gMTAwMFxuXG4jIHRoZSBudW1iZXIgb2YgaGlzdG9yeSBldmVudHMgdG8gcmVxdWVzdFxuSElTVE9SWV9BTU9VTlQgPSAyMFxuXG4jIGFkZCBhIHR5cGluZyBlbnRyeVxuYWRkVHlwaW5nID0gKHR5cGluZykgLT5cbiAgICBjb252X2lkID0gdHlwaW5nPy5jb252ZXJzYXRpb25faWQ/LmlkXG4gICAgIyBubyB0eXBpbmcgZW50cmllcyBmb3Igc2VsZlxuICAgIHJldHVybiBpZiBlbnRpdHkuaXNTZWxmIHR5cGluZy51c2VyX2lkLmNoYXRfaWRcbiAgICAjIGFuZCBubyBlbnRyaWVzIGluIG5vbi1leGlzdGluZyBjb252c1xuICAgIHJldHVybiB1bmxlc3MgYyA9IGxvb2t1cFtjb252X2lkXVxuICAgIGMudHlwaW5nID0gW10gdW5sZXNzIGMudHlwaW5nXG4gICAgIyBsZW5ndGggYXQgc3RhcnRcbiAgICBsZW4gPSBjLnR5cGluZy5sZW5ndGhcbiAgICAjIGFkZCBuZXcgc3RhdGUgdG8gc3RhcnQgb2YgYXJyYXlcbiAgICBjLnR5cGluZy51bnNoaWZ0IHR5cGluZ1xuICAgICMgZW5zdXJlIHRoZXJlJ3Mgb25seSBvbmUgZW50cnkgaW4gYXJyYXkgcGVyIHVzZXJcbiAgICBjLnR5cGluZyA9IHVuaXFmbiBjLnR5cGluZywgKHQpIC0+IHQudXNlcl9pZC5jaGF0X2lkXG4gICAgIyBhbmQgc29ydCBpdCBpbiBhIHN0YWJsZSB3YXlcbiAgICBjLnR5cGluZy5zb3J0ICh0MSwgdDIpIC0+IHQxLnVzZXJfaWQuY2hhdF9pZCAtIHQyLnVzZXJfaWQuY2hhdF9pZFxuICAgICMgc2NoZWR1bGUgYSBwcnVuaW5nXG4gICAgbGF0ZXIgLT4gYWN0aW9uICdwcnVuZVR5cGluZycsIGNvbnZfaWRcbiAgICAjIGFuZCBtYXJrIGFzIHVwZGF0ZWRcbiAgICB1cGRhdGVkICdjb252J1xuICAgICMgaW5kaWNpYXRlIHdlIGp1c3Qgc3RhcnRlZCBoYXZpbmcgdHlwaW5nIGVudHJpZXNcbiAgICB1cGRhdGVkICdzdGFydFR5cGluZycgaWYgbGVuID09IDBcblxuIyBwcnVuZSBvbGQgdHlwaW5nIGVudHJpZXNcbnBydW5lVHlwaW5nID0gZG8gLT5cblxuICAgIGZpbmROZXh0ID0gKGFycikgLT5cbiAgICAgICAgZXhwaXJ5ID0gYXJyLm1hcCAodCkgLT4gdC50aW1lc3RhbXAgKyBrZWVwRm9yKHQpXG4gICAgICAgIG5leHQgPSBpIGZvciB0LCBpIGluIGV4cGlyeSB3aGVuICFuZXh0IG9yIGV4cGlyeVtpXSA8IGV4cGlyeVtuZXh0XVxuICAgICAgICBuZXh0XG5cbiAgICBLRUVQX1NUT1BQRUQgPSAxNTAwICAjIHRpbWUgdG8ga2VlcCBTVE9QUEVEIHR5cGluZyBlbnRyaWVzXG4gICAgS0VFUF9PVEhFUlMgID0gMTAwMDAgIyB0aW1lIHRvIGtlZXAgb3RoZXIgdHlwaW5nIGVudHJpZXMgYmVmb3JlIHBydW5pbmdcblxuICAgIGtlZXBGb3IgPSAodCkgLT4gaWYgdD8uc3RhdHVzID09ICdTVE9QUEVEJyB0aGVuIEtFRVBfU1RPUFBFRCBlbHNlIEtFRVBfT1RIRVJTXG5cbiAgICBwcnVuZSA9ICh0KSAtPiAoRGF0ZS5ub3coKSAtIHQ/LnRpbWVzdGFtcCAvIDEwMDApIDwga2VlcEZvcih0KVxuXG4gICAgKGNvbnZfaWQpIC0+XG4gICAgICAgIHJldHVybiB1bmxlc3MgYyA9IGxvb2t1cFtjb252X2lkXVxuICAgICAgICAjIHN0b3AgZXhpc3RpbmcgdGltZXJcbiAgICAgICAgYy50eXBpbmd0aW1lciA9IGNsZWFyVGltZW91dCBjLnR5cGluZ3RpbWVyIGlmIGMudHlwaW5ndGltZXJcbiAgICAgICAgIyB0aGUgbGVuZ3RoIGJlZm9yZSBwcnVuZVxuICAgICAgICBsZW5ndGhCZWZvcmUgPSBjLnR5cGluZy5sZW5ndGhcbiAgICAgICAgIyBmaWx0ZXIgb3V0IG9sZCBzdHVmZlxuICAgICAgICBjLnR5cGluZyA9IGMudHlwaW5nLmZpbHRlcihwcnVuZSlcbiAgICAgICAgIyBtYXliZSB3ZSBjaGFuZ2VkIHNvbWV0aGluZz9cbiAgICAgICAgdXBkYXRlZCAnY29udicgaWYgYy50eXBpbmcubGVuZ3RoICE9IGxlbmd0aEJlZm9yZVxuICAgICAgICAjIHdoZW4gaXMgbmV4dCBleHBpcmluZz9cbiAgICAgICAgcmV0dXJuIHVubGVzcyAobmV4dGlkeCA9IGZpbmROZXh0IGMudHlwaW5nKSA+PSAwXG4gICAgICAgICMgdGhlIG5leHQgZW50cnkgdG8gZXhwaXJlXG4gICAgICAgIG5leHQgPSBjLnR5cGluZ1tuZXh0aWR4XVxuICAgICAgICAjIGhvdyBsb25nIHdlIHdhaXQgdW50aWwgZG9pbmcgYW5vdGhlciBwcnVuZVxuICAgICAgICB3YWl0VW50aWwgPSAoa2VlcEZvcihuZXh0KSArIG5leHQudGltZXN0YW1wIC8gMTAwMCkgLSBEYXRlLm5vdygpXG4gICAgICAgIHJldHVybiBjb25zb2xlLmVycm9yICd0eXBpbmcgcHJ1bmUgZXJyb3InLCB3YWl0VW50aWwgaWYgd2FpdFVudGlsIDwgMFxuICAgICAgICAjIHNjaGVkdWxlIG5leHQgcHJ1bmVcbiAgICAgICAgYy50eXBpbmd0aW1lciA9IHNldFRpbWVvdXQgKC0+IGFjdGlvbiAncHJ1bmVUeXBpbmcnLCBjb252X2lkKSwgd2FpdFVudGlsXG5cbmZ1bmNzID1cbiAgICBjb3VudDogLT5cbiAgICAgICAgYyA9IDA7IChjKysgZm9yIGssIHYgb2YgbG9va3VwIHdoZW4gdHlwZW9mIHYgPT0gJ29iamVjdCcpOyBjXG5cbiAgICBfcmVzZXQ6IC0+XG4gICAgICAgIGRlbGV0ZSBsb29rdXBba10gZm9yIGssIHYgb2YgbG9va3VwIHdoZW4gdHlwZW9mIHYgPT0gJ29iamVjdCdcbiAgICAgICAgdXBkYXRlZCAnY29udidcbiAgICAgICAgbnVsbFxuXG4gICAgX2luaXRGcm9tQ29udlN0YXRlczogKGNvbnZzKSAtPlxuICAgICAgICBjID0gMFxuICAgICAgICBjb3VudElmID0gKGEpIC0+IGMrKyBpZiBhXG4gICAgICAgIGNvdW50SWYgYWRkIGNvbnYgZm9yIGNvbnYgaW4gY29udnNcbiAgICAgICAgdXBkYXRlZCAnY29udidcbiAgICAgICAgY1xuXG4gICAgYWRkOmFkZFxuICAgIHJlbmFtZTogcmVuYW1lXG4gICAgYWRkQ2hhdE1lc3NhZ2U6IGFkZENoYXRNZXNzYWdlXG4gICAgYWRkQ2hhdE1lc3NhZ2VQbGFjZWhvbGRlcjogYWRkQ2hhdE1lc3NhZ2VQbGFjZWhvbGRlclxuICAgIGFkZFdhdGVybWFyazogYWRkV2F0ZXJtYXJrXG4gICAgTUFYX1VOUkVBRDogTUFYX1VOUkVBRFxuICAgIHVucmVhZDogdW5yZWFkXG4gICAgaXNRdWlldDogaXNRdWlldFxuICAgIGlzU3RhcnJlZDogaXNTdGFycmVkXG4gICAgdG9nZ2xlU3RhcjogdG9nZ2xlU3RhclxuICAgIGlzUHVyZUhhbmdvdXQ6IGlzUHVyZUhhbmdvdXRcbiAgICBsYXN0Q2hhbmdlZDogbGFzdENoYW5nZWRcbiAgICBhZGRUeXBpbmc6IGFkZFR5cGluZ1xuICAgIHBydW5lVHlwaW5nOiBwcnVuZVR5cGluZ1xuXG4gICAgc2V0Tm90aWZpY2F0aW9uTGV2ZWw6IChjb252X2lkLCBsZXZlbCkgLT5cbiAgICAgICAgcmV0dXJuIHVubGVzcyBjID0gbG9va3VwW2NvbnZfaWRdXG4gICAgICAgIGMuc2VsZl9jb252ZXJzYXRpb25fc3RhdGU/Lm5vdGlmaWNhdGlvbl9sZXZlbCA9IGxldmVsXG4gICAgICAgIHVwZGF0ZWQgJ2NvbnYnXG5cbiAgICBkZWxldGVDb252OiAoY29udl9pZCkgLT5cbiAgICAgICAgcmV0dXJuIHVubGVzcyBjID0gbG9va3VwW2NvbnZfaWRdXG4gICAgICAgIGRlbGV0ZSBsb29rdXBbY29udl9pZF1cbiAgICAgICAgdmlld3N0YXRlLnNldFNlbGVjdGVkQ29udiBudWxsXG4gICAgICAgIHVwZGF0ZWQgJ2NvbnYnXG5cbiAgICByZW1vdmVQYXJ0aWNpcGFudHM6IChjb252X2lkLCBpZHMpIC0+XG4gICAgICAgIHJldHVybiB1bmxlc3MgYyA9IGxvb2t1cFtjb252X2lkXVxuICAgICAgICBnZXRJZCA9IChwKSAtPiByZXR1cm4gcC5pZC5jaGF0X2lkIG9yIHAuaWQuZ2FpYV9pZFxuICAgICAgICBjLnBhcnRpY2lwYW50X2RhdGEgPSAocCBmb3IgcCBpbiBjLnBhcnRpY2lwYW50X2RhdGEgd2hlbiBnZXRJZChwKSBub3QgaW4gaWRzKVxuXG4gICAgYWRkUGFydGljaXBhbnQ6IChjb252X2lkLCBwYXJ0aWNpcGFudCkgLT5cbiAgICAgICAgcmV0dXJuIHVubGVzcyBjID0gbG9va3VwW2NvbnZfaWRdXG4gICAgICAgIGMucGFydGljaXBhbnRfZGF0YS5wdXNoIHBhcnRpY2lwYW50XG5cbiAgICByZXBsYWNlRnJvbVN0YXRlczogKHN0YXRlcykgLT5cbiAgICAgICAgYWRkIHN0IGZvciBzdCBpbiBzdGF0ZXNcbiAgICAgICAgdXBkYXRlZCAnY29udidcblxuICAgIHVwZGF0ZUF0VG9wOiAoYXR0b3ApIC0+XG4gICAgICAgIHJldHVybiB1bmxlc3Mgdmlld3N0YXRlLnN0YXRlID09IHZpZXdzdGF0ZS5TVEFURV9OT1JNQUxcbiAgICAgICAgY29udl9pZCA9IHZpZXdzdGF0ZT8uc2VsZWN0ZWRDb252XG4gICAgICAgIGlmIGF0dG9wIGFuZCAoYyA9IGxvb2t1cFtjb252X2lkXSkgYW5kICFjPy5ub21vcmVoaXN0b3J5IGFuZCAhYz8ucmVxdWVzdGluZ2hpc3RvcnlcbiAgICAgICAgICAgIHRpbWVzdGFtcCA9IChjLmV2ZW50P1swXT8udGltZXN0YW1wID8gMCkgLyAxMDAwXG4gICAgICAgICAgICByZXR1cm4gdW5sZXNzIHRpbWVzdGFtcFxuICAgICAgICAgICAgYy5yZXF1ZXN0aW5naGlzdG9yeSA9IHRydWVcbiAgICAgICAgICAgIGxhdGVyIC0+IGFjdGlvbiAnaGlzdG9yeScsIGNvbnZfaWQsIHRpbWVzdGFtcCwgSElTVE9SWV9BTU9VTlRcbiAgICAgICAgICAgIHVwZGF0ZWQgJ2NvbnYnXG5cbiAgICB1cGRhdGVIaXN0b3J5OiAoc3RhdGUpIC0+XG4gICAgICAgIGNvbnZfaWQgPSBzdGF0ZT8uY29udmVyc2F0aW9uX2lkPy5pZFxuICAgICAgICByZXR1cm4gdW5sZXNzIGMgPSBsb29rdXBbY29udl9pZF1cbiAgICAgICAgYy5yZXF1ZXN0aW5naGlzdG9yeSA9IGZhbHNlXG4gICAgICAgIGV2ZW50ID0gc3RhdGU/LmV2ZW50XG4gICAgICAgIGMuZXZlbnQgPSAoZXZlbnQgPyBbXSkuY29uY2F0IChjLmV2ZW50ID8gW10pXG4gICAgICAgIGMubm9tb3JlaGlzdG9yeSA9IHRydWUgaWYgZXZlbnQ/Lmxlbmd0aCA9PSAwXG5cbiAgICAgICAgIyBmaXJzdCBzaWduYWwgaXMgdG8gZ2l2ZSB2aWV3cyBhIGNoYW5nZSB0byByZWNvcmQgdGhlXG4gICAgICAgICMgY3VycmVudCB2aWV3IHBvc2l0aW9uIGJlZm9yZSBpbmplY3RpbmcgbmV3IERPTVxuICAgICAgICB1cGRhdGVkICdiZWZvcmVIaXN0b3J5J1xuICAgICAgICAjIHJlZHJhd1xuICAgICAgICB1cGRhdGVkICdjb252J1xuICAgICAgICAjIGxhc3Qgc2lnbmFsIGlzIHRvIG1vdmUgdmlldyB0byBiZSBhdCBzYW1lIHBsYWNlXG4gICAgICAgICMgYXMgd2hlbiB3ZSBpbmplY3RlZCBET00uXG4gICAgICAgIHVwZGF0ZWQgJ2FmdGVySGlzdG9yeSdcblxuICAgIHVwZGF0ZVBsYWNlaG9sZGVySW1hZ2U6ICh7Y29udl9pZCwgY2xpZW50X2dlbmVyYXRlZF9pZCwgcGF0aH0pIC0+XG4gICAgICAgIHJldHVybiB1bmxlc3MgYyA9IGxvb2t1cFtjb252X2lkXVxuICAgICAgICBjcG9zID0gZmluZENsaWVudEdlbmVyYXRlZCBjLCBjbGllbnRfZ2VuZXJhdGVkX2lkXG4gICAgICAgIGV2ID0gYy5ldmVudFtjcG9zXVxuICAgICAgICBzZWcgPSBldi5jaGF0X21lc3NhZ2UubWVzc2FnZV9jb250ZW50LnNlZ21lbnRbMF1cbiAgICAgICAgc2VnLmxpbmtfZGF0YSA9IGxpbmtfdGFyZ2V0OnBhdGhcbiAgICAgICAgdXBkYXRlZCAnY29udidcblxuICAgIGxpc3Q6IChzb3J0ID0gdHJ1ZSkgLT5cbiAgICAgICAgY29udnMgPSAodiBmb3IgaywgdiBvZiBsb29rdXAgd2hlbiB0eXBlb2YgdiA9PSAnb2JqZWN0JylcbiAgICAgICAgaWYgc29ydFxuICAgICAgICAgICAgc3RhcnJlZCA9IChjIGZvciBjIGluIGNvbnZzIHdoZW4gaXNTdGFycmVkKGMpKVxuICAgICAgICAgICAgY29udnMgPSAoYyBmb3IgYyBpbiBjb252cyB3aGVuIG5vdCBpc1N0YXJyZWQoYykpXG4gICAgICAgICAgICBzdGFycmVkLnNvcnQgKGUxLCBlMikgLT4gbmFtZW9mY29udihlMSkubG9jYWxlQ29tcGFyZShuYW1lb2Zjb252KGUyKSlcbiAgICAgICAgICAgIGNvbnZzLnNvcnQgKGUxLCBlMikgLT4gc29ydGJ5KGUyKSAtIHNvcnRieShlMSlcbiAgICAgICAgICAgIHJldHVybiBzdGFycmVkLmNvbmNhdCBjb252c1xuICAgICAgICBjb252c1xuXG5cblxubW9kdWxlLmV4cG9ydHMgPSBtZXJnZSBsb29rdXAsIGZ1bmNzXG4iXX0=