(function() {
  var callNeedAnswer, getProxiedName, nameof, notifier, openHangout, path, ref, shell, textMessage;

  notifier = require('node-notifier');

  shell = require('shell');

  path = require('path');

  ref = require('../util'), nameof = ref.nameof, getProxiedName = ref.getProxiedName;

  callNeedAnswer = {};

  module.exports = function(models) {
    var conv, entity, notify, quietIf, tonot;
    conv = models.conv, notify = models.notify, entity = models.entity;
    tonot = notify.popToNotify();
    quietIf = function(c, chat_id) {
      return (typeof document !== "undefined" && document !== null ? document.hasFocus() : void 0) || conv.isQuiet(c) || entity.isSelf(chat_id);
    };
    return tonot.forEach(function(msg) {
      var c, chat_id, cid, conv_id, proxied, ref1, ref2, ref3, ref4, ref5, ref6, sender, text;
      conv_id = msg != null ? (ref1 = msg.conversation_id) != null ? ref1.id : void 0 : void 0;
      c = conv[conv_id];
      chat_id = msg != null ? (ref2 = msg.sender_id) != null ? ref2.chat_id : void 0 : void 0;
      proxied = getProxiedName(msg);
      cid = proxied ? proxied : msg != null ? (ref3 = msg.sender_id) != null ? ref3.chat_id : void 0 : void 0;
      sender = nameof(entity[cid]);
      text = null;
      if (msg.chat_message != null) {
        if (((ref4 = msg.chat_message) != null ? ref4.message_content : void 0) == null) {
          return;
        }
        text = textMessage(msg.chat_message.message_content, proxied);
      } else if (((ref5 = msg.hangout_event) != null ? ref5.event_type : void 0) === 'START_HANGOUT') {
        text = "Incoming call";
        callNeedAnswer[conv_id] = true;
        notr({
          html: ("Incoming call from " + sender + ". ") + '<a href="#" class="accept">Accept</a> / ' + '<a href="#" class="reject">Reject</a>',
          stay: 0,
          id: "hang" + conv_id,
          onclick: function(e) {
            var ref6;
            delete callNeedAnswer[conv_id];
            if ((e != null ? (ref6 = e.target) != null ? ref6.className : void 0 : void 0) === 'accept') {
              notr({
                html: 'Accepted',
                stay: 1000,
                id: "hang" + conv_id
              });
              return openHangout(conv_id);
            } else {
              return notr({
                html: 'Rejected',
                stay: 1000,
                id: "hang" + conv_id
              });
            }
          }
        });
      } else if (((ref6 = msg.hangout_event) != null ? ref6.event_type : void 0) === 'END_HANGOUT') {
        if (callNeedAnswer[conv_id]) {
          delete callNeedAnswer[conv_id];
          notr({
            html: ("Missed call from " + sender + ". ") + '<a href="#">OK</a>',
            id: "hang" + conv_id,
            stay: 0
          });
        }
      } else {
        return;
      }
      if (!text || quietIf(c, chat_id)) {
        return;
      }
      return notifier.notify({
        title: sender,
        message: text,
        wait: true,
        sender: 'com.github.yakyak',
        sound: true
      }, function(err, res) {
        if ((res != null ? res.trim() : void 0) === 'Activate') {
          action('appfocus');
          return action('selectConv', c);
        }
      });
    });
  };

  textMessage = function(cont, proxied) {
    var i, seg, segs;
    segs = (function() {
      var j, len, ref1, ref2, results;
      ref2 = (ref1 = cont != null ? cont.segment : void 0) != null ? ref1 : [];
      results = [];
      for (i = j = 0, len = ref2.length; j < len; i = ++j) {
        seg = ref2[i];
        if (proxied && i < 2) {
          continue;
        }
        if (!seg.text) {
          continue;
        }
        results.push(seg.text);
      }
      return results;
    })();
    return segs.join('');
  };

  openHangout = function(conv_id) {
    return shell.openExternal("https://plus.google.com/hangouts/_/CONVERSATION/" + conv_id);
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVpL3ZpZXdzL25vdGlmaWNhdGlvbnMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxRQUFBLEdBQVcsT0FBQSxDQUFRLGVBQVI7O0VBQ1gsS0FBQSxHQUFXLE9BQUEsQ0FBUSxPQUFSOztFQUNYLElBQUEsR0FBVyxPQUFBLENBQVEsTUFBUjs7RUFFWCxNQUEyQixPQUFBLENBQVEsU0FBUixDQUEzQixFQUFDLGFBQUEsTUFBRCxFQUFTLHFCQUFBOztFQUdULGNBQUEsR0FBaUI7O0VBRWpCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCLFNBQUMsTUFBRDtBQUNiLFFBQUE7SUFBQyxjQUFBLElBQUQsRUFBTyxnQkFBQSxNQUFQLEVBQWUsZ0JBQUE7SUFDZixLQUFBLEdBQVEsTUFBTSxDQUFDLFdBQVAsQ0FBQTtJQUVSLE9BQUEsR0FBVSxTQUFDLENBQUQsRUFBSSxPQUFKO3FFQUFnQixRQUFRLENBQUUsUUFBVixDQUFBLFdBQUEsSUFBd0IsSUFBSSxDQUFDLE9BQUwsQ0FBYSxDQUFiLENBQXhCLElBQTJDLE1BQU0sQ0FBQyxNQUFQLENBQWMsT0FBZDtJQUEzRDtXQUVWLEtBQUssQ0FBQyxPQUFOLENBQWMsU0FBQyxHQUFEO0FBQ1YsVUFBQTtNQUFBLE9BQUEsNERBQThCLENBQUU7TUFDaEMsQ0FBQSxHQUFJLElBQUssQ0FBQSxPQUFBO01BQ1QsT0FBQSxzREFBd0IsQ0FBRTtNQUUxQixPQUFBLEdBQVUsY0FBQSxDQUFlLEdBQWY7TUFDVixHQUFBLEdBQVMsT0FBSCxHQUFnQixPQUFoQixzREFBMkMsQ0FBRTtNQUNuRCxNQUFBLEdBQVMsTUFBQSxDQUFPLE1BQU8sQ0FBQSxHQUFBLENBQWQ7TUFDVCxJQUFBLEdBQU87TUFFUCxJQUFHLHdCQUFIO1FBQ0ksSUFBYywyRUFBZDtBQUFBLGlCQUFBOztRQUNBLElBQUEsR0FBTyxXQUFBLENBQVksR0FBRyxDQUFDLFlBQVksQ0FBQyxlQUE3QixFQUE4QyxPQUE5QyxFQUZYO09BQUEsTUFHSyw4Q0FBb0IsQ0FBRSxvQkFBbkIsS0FBaUMsZUFBcEM7UUFDRCxJQUFBLEdBQU87UUFDUCxjQUFlLENBQUEsT0FBQSxDQUFmLEdBQTBCO1FBQzFCLElBQUEsQ0FDSTtVQUFBLElBQUEsRUFBTSxDQUFBLHFCQUFBLEdBQXNCLE1BQXRCLEdBQTZCLElBQTdCLENBQUEsR0FDTiwwQ0FETSxHQUVOLHVDQUZBO1VBR0EsSUFBQSxFQUFNLENBSE47VUFJQSxFQUFBLEVBQUksTUFBQSxHQUFPLE9BSlg7VUFLQSxPQUFBLEVBQVMsU0FBQyxDQUFEO0FBQ0wsZ0JBQUE7WUFBQSxPQUFPLGNBQWUsQ0FBQSxPQUFBO1lBQ3RCLGlEQUFZLENBQUUsNEJBQVgsS0FBd0IsUUFBM0I7Y0FDSSxJQUFBLENBQUs7Z0JBQUMsSUFBQSxFQUFLLFVBQU47Z0JBQWtCLElBQUEsRUFBSyxJQUF2QjtnQkFBNkIsRUFBQSxFQUFHLE1BQUEsR0FBTyxPQUF2QztlQUFMO3FCQUNBLFdBQUEsQ0FBWSxPQUFaLEVBRko7YUFBQSxNQUFBO3FCQUlJLElBQUEsQ0FBSztnQkFBQyxJQUFBLEVBQUssVUFBTjtnQkFBa0IsSUFBQSxFQUFLLElBQXZCO2dCQUE2QixFQUFBLEVBQUcsTUFBQSxHQUFPLE9BQXZDO2VBQUwsRUFKSjs7VUFGSyxDQUxUO1NBREosRUFIQztPQUFBLE1BZ0JBLDhDQUFvQixDQUFFLG9CQUFuQixLQUFpQyxhQUFwQztRQUNELElBQUcsY0FBZSxDQUFBLE9BQUEsQ0FBbEI7VUFDSSxPQUFPLGNBQWUsQ0FBQSxPQUFBO1VBQ3RCLElBQUEsQ0FDSTtZQUFBLElBQUEsRUFBTSxDQUFBLG1CQUFBLEdBQW9CLE1BQXBCLEdBQTJCLElBQTNCLENBQUEsR0FBaUMsb0JBQXZDO1lBQ0EsRUFBQSxFQUFJLE1BQUEsR0FBTyxPQURYO1lBRUEsSUFBQSxFQUFNLENBRk47V0FESixFQUZKO1NBREM7T0FBQSxNQUFBO0FBUUQsZUFSQzs7TUFXTCxJQUFVLENBQUMsSUFBRCxJQUFTLE9BQUEsQ0FBUSxDQUFSLEVBQVcsT0FBWCxDQUFuQjtBQUFBLGVBQUE7O2FBQ0EsUUFBUSxDQUFDLE1BQVQsQ0FDSTtRQUFBLEtBQUEsRUFBTyxNQUFQO1FBQ0EsT0FBQSxFQUFTLElBRFQ7UUFFQSxJQUFBLEVBQU0sSUFGTjtRQUdBLE1BQUEsRUFBUSxtQkFIUjtRQUlBLEtBQUEsRUFBTyxJQUpQO09BREosRUFNRSxTQUFDLEdBQUQsRUFBTSxHQUFOO1FBQWMsbUJBQUcsR0FBRyxDQUFFLElBQUwsQ0FBQSxXQUFBLEtBQWUsVUFBbEI7VUFDZCxNQUFBLENBQU8sVUFBUDtpQkFDQSxNQUFBLENBQU8sWUFBUCxFQUFxQixDQUFyQixFQUZjOztNQUFkLENBTkY7SUF6Q1UsQ0FBZDtFQU5hOztFQTBEakIsV0FBQSxHQUFjLFNBQUMsSUFBRCxFQUFPLE9BQVA7QUFDVixRQUFBO0lBQUEsSUFBQTs7QUFBTztBQUFBO1dBQUEsOENBQUE7O1FBQ0gsSUFBWSxPQUFBLElBQVksQ0FBQSxHQUFJLENBQTVCO0FBQUEsbUJBQUE7O1FBQ0EsSUFBQSxDQUFnQixHQUFHLENBQUMsSUFBcEI7QUFBQSxtQkFBQTs7cUJBQ0EsR0FBRyxDQUFDO0FBSEQ7OztXQUlQLElBQUksQ0FBQyxJQUFMLENBQVUsRUFBVjtFQUxVOztFQVFkLFdBQUEsR0FBYyxTQUFDLE9BQUQ7V0FDVixLQUFLLENBQUMsWUFBTixDQUFtQixrREFBQSxHQUFtRCxPQUF0RTtFQURVO0FBM0VkIiwiZmlsZSI6InVpL3ZpZXdzL25vdGlmaWNhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJub3RpZmllciA9IHJlcXVpcmUgJ25vZGUtbm90aWZpZXInXG5zaGVsbCAgICA9IHJlcXVpcmUgJ3NoZWxsJ1xucGF0aCAgICAgPSByZXF1aXJlICdwYXRoJ1xuXG57bmFtZW9mLCBnZXRQcm94aWVkTmFtZX0gPSByZXF1aXJlICcuLi91dGlsJ1xuXG4jIGNvbnZfaWQgbWFya2VycyBmb3IgY2FsbCBub3RpZmljYXRpb25zXG5jYWxsTmVlZEFuc3dlciA9IHt9XG5cbm1vZHVsZS5leHBvcnRzID0gKG1vZGVscykgLT5cbiAgICB7Y29udiwgbm90aWZ5LCBlbnRpdHl9ID0gbW9kZWxzXG4gICAgdG9ub3QgPSBub3RpZnkucG9wVG9Ob3RpZnkoKVxuXG4gICAgcXVpZXRJZiA9IChjLCBjaGF0X2lkKSAtPiBkb2N1bWVudD8uaGFzRm9jdXMoKSBvciBjb252LmlzUXVpZXQoYykgb3IgZW50aXR5LmlzU2VsZihjaGF0X2lkKVxuXG4gICAgdG9ub3QuZm9yRWFjaCAobXNnKSAtPlxuICAgICAgICBjb252X2lkID0gbXNnPy5jb252ZXJzYXRpb25faWQ/LmlkXG4gICAgICAgIGMgPSBjb252W2NvbnZfaWRdXG4gICAgICAgIGNoYXRfaWQgPSBtc2c/LnNlbmRlcl9pZD8uY2hhdF9pZFxuXG4gICAgICAgIHByb3hpZWQgPSBnZXRQcm94aWVkTmFtZShtc2cpXG4gICAgICAgIGNpZCA9IGlmIHByb3hpZWQgdGhlbiBwcm94aWVkIGVsc2UgbXNnPy5zZW5kZXJfaWQ/LmNoYXRfaWRcbiAgICAgICAgc2VuZGVyID0gbmFtZW9mIGVudGl0eVtjaWRdXG4gICAgICAgIHRleHQgPSBudWxsXG5cbiAgICAgICAgaWYgbXNnLmNoYXRfbWVzc2FnZT9cbiAgICAgICAgICAgIHJldHVybiB1bmxlc3MgbXNnLmNoYXRfbWVzc2FnZT8ubWVzc2FnZV9jb250ZW50P1xuICAgICAgICAgICAgdGV4dCA9IHRleHRNZXNzYWdlIG1zZy5jaGF0X21lc3NhZ2UubWVzc2FnZV9jb250ZW50LCBwcm94aWVkXG4gICAgICAgIGVsc2UgaWYgbXNnLmhhbmdvdXRfZXZlbnQ/LmV2ZW50X3R5cGUgPT0gJ1NUQVJUX0hBTkdPVVQnXG4gICAgICAgICAgICB0ZXh0ID0gXCJJbmNvbWluZyBjYWxsXCJcbiAgICAgICAgICAgIGNhbGxOZWVkQW5zd2VyW2NvbnZfaWRdID0gdHJ1ZVxuICAgICAgICAgICAgbm90clxuICAgICAgICAgICAgICAgIGh0bWw6IFwiSW5jb21pbmcgY2FsbCBmcm9tICN7c2VuZGVyfS4gXCIgK1xuICAgICAgICAgICAgICAgICc8YSBocmVmPVwiI1wiIGNsYXNzPVwiYWNjZXB0XCI+QWNjZXB0PC9hPiAvICcgK1xuICAgICAgICAgICAgICAgICc8YSBocmVmPVwiI1wiIGNsYXNzPVwicmVqZWN0XCI+UmVqZWN0PC9hPidcbiAgICAgICAgICAgICAgICBzdGF5OiAwXG4gICAgICAgICAgICAgICAgaWQ6IFwiaGFuZyN7Y29udl9pZH1cIlxuICAgICAgICAgICAgICAgIG9uY2xpY2s6IChlKSAtPlxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgY2FsbE5lZWRBbnN3ZXJbY29udl9pZF1cbiAgICAgICAgICAgICAgICAgICAgaWYgZT8udGFyZ2V0Py5jbGFzc05hbWUgPT0gJ2FjY2VwdCdcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdHIoe2h0bWw6J0FjY2VwdGVkJywgc3RheToxMDAwLCBpZDpcImhhbmcje2NvbnZfaWR9XCJ9KVxuICAgICAgICAgICAgICAgICAgICAgICAgb3BlbkhhbmdvdXQgY29udl9pZFxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBub3RyKHtodG1sOidSZWplY3RlZCcsIHN0YXk6MTAwMCwgaWQ6XCJoYW5nI3tjb252X2lkfVwifSlcbiAgICAgICAgZWxzZSBpZiBtc2cuaGFuZ291dF9ldmVudD8uZXZlbnRfdHlwZSA9PSAnRU5EX0hBTkdPVVQnXG4gICAgICAgICAgICBpZiBjYWxsTmVlZEFuc3dlcltjb252X2lkXVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWxsTmVlZEFuc3dlcltjb252X2lkXVxuICAgICAgICAgICAgICAgIG5vdHJcbiAgICAgICAgICAgICAgICAgICAgaHRtbDogXCJNaXNzZWQgY2FsbCBmcm9tICN7c2VuZGVyfS4gXCIgKyAnPGEgaHJlZj1cIiNcIj5PSzwvYT4nXG4gICAgICAgICAgICAgICAgICAgIGlkOiBcImhhbmcje2NvbnZfaWR9XCJcbiAgICAgICAgICAgICAgICAgICAgc3RheTogMFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXR1cm5cblxuICAgICAgICAjIG1heWJlIHRyaWdnZXIgT1Mgbm90aWZpY2F0aW9uXG4gICAgICAgIHJldHVybiBpZiAhdGV4dCBvciBxdWlldElmKGMsIGNoYXRfaWQpXG4gICAgICAgIG5vdGlmaWVyLm5vdGlmeVxuICAgICAgICAgICAgdGl0bGU6IHNlbmRlclxuICAgICAgICAgICAgbWVzc2FnZTogdGV4dFxuICAgICAgICAgICAgd2FpdDogdHJ1ZVxuICAgICAgICAgICAgc2VuZGVyOiAnY29tLmdpdGh1Yi55YWt5YWsnXG4gICAgICAgICAgICBzb3VuZDogdHJ1ZVxuICAgICAgICAsIChlcnIsIHJlcykgLT4gaWYgcmVzPy50cmltKCkgPT0gJ0FjdGl2YXRlJ1xuICAgICAgICAgIGFjdGlvbiAnYXBwZm9jdXMnXG4gICAgICAgICAgYWN0aW9uICdzZWxlY3RDb252JywgY1xuXG5cbnRleHRNZXNzYWdlID0gKGNvbnQsIHByb3hpZWQpIC0+XG4gICAgc2VncyA9IGZvciBzZWcsIGkgaW4gY29udD8uc2VnbWVudCA/IFtdXG4gICAgICAgIGNvbnRpbnVlIGlmIHByb3hpZWQgYW5kIGkgPCAyXG4gICAgICAgIGNvbnRpbnVlIHVubGVzcyBzZWcudGV4dFxuICAgICAgICBzZWcudGV4dFxuICAgIHNlZ3Muam9pbignJylcblxuXG5vcGVuSGFuZ291dCA9IChjb252X2lkKSAtPlxuICAgIHNoZWxsLm9wZW5FeHRlcm5hbCBcImh0dHBzOi8vcGx1cy5nb29nbGUuY29tL2hhbmdvdXRzL18vQ09OVkVSU0FUSU9OLyN7Y29udl9pZH1cIlxuIl19