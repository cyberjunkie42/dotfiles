(function() {
  var autosize, clipboard, cursorToEnd, history, historyBackup, historyIndex, historyLength, historyPush, historyWalk, isAltCtrlMeta, isModifierKey, lastConv, later, laterMaybeFocus, maybeFocus, messages;

  autosize = require('autosize');

  clipboard = require('clipboard');

  messages = require('./messages');

  later = require('../util').later;

  isModifierKey = function(ev) {
    return ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey;
  };

  isAltCtrlMeta = function(ev) {
    return ev.altKey || ev.ctrlKey || ev.metaKey;
  };

  cursorToEnd = function(el) {
    return el.selectionStart = el.selectionEnd = el.value.length;
  };

  history = [];

  historyIndex = 0;

  historyLength = 100;

  historyBackup = "";

  historyPush = function(data) {
    history.push(data);
    if (history.length === historyLength) {
      history.shift();
    }
    return historyIndex = history.length;
  };

  historyWalk = function(el, offset) {
    var val;
    if (offset === -1 && historyIndex === history.length) {
      historyBackup = el.value;
    }
    historyIndex = historyIndex + offset;
    if (historyIndex < 0) {
      historyIndex = 0;
    }
    if (historyIndex > history.length) {
      historyIndex = history.length;
    }
    val = history[historyIndex] || historyBackup;
    el.value = val;
    return setTimeout((function() {
      return cursorToEnd(el);
    }), 1);
  };

  lastConv = null;

  module.exports = view(function(models) {
    div({
      "class": 'input'
    }, function() {
      return div(function() {
        textarea({
          autofocus: true,
          placeholder: 'Message',
          rows: 1
        }, '', {
          onDOMNodeInserted: function(e) {
            var ta;
            ta = e.target;
            later(function() {
              return autosize(ta);
            });
            return ta.addEventListener('autosize:resized', function() {
              ta.parentNode.style.height = (ta.offsetHeight + 24) + 'px';
              return messages.scrollToBottom();
            });
          },
          onkeydown: function(e) {
            if ((e.metaKey || e.ctrlKey) && e.keyIdentifier === 'Up') {
              action('selectNextConv', -1);
            }
            if ((e.metaKey || e.ctrlKey) && e.keyIdentifier === 'Down') {
              action('selectNextConv', +1);
            }
            if (!isModifierKey(e)) {
              if (e.keyCode === 13) {
                e.preventDefault();
                action('sendmessage', e.target.value);
                historyPush(e.target.value);
                e.target.value = '';
                autosize.update(e.target);
              }
              if (e.target.value === '') {
                if (e.keyIdentifier === "Up") {
                  historyWalk(e.target, -1);
                }
                if (e.keyIdentifier === "Down") {
                  historyWalk(e.target, +1);
                }
              }
            }
            if (!isAltCtrlMeta(e)) {
              return action('lastkeydown', Date.now());
            }
          },
          onpaste: function(e) {
            if (!clipboard.readImage().isEmpty()) {
              return action('onpasteimage');
            }
          }
        });
        button({
          title: 'Attach image',
          onclick: function(ev) {
            return document.getElementById('attachFile').click();
          }
        }, function() {
          return span({
            "class": 'icon-attach'
          });
        });
        return input({
          type: 'file',
          id: 'attachFile',
          accept: '.jpg,.jpeg,.png,.gif',
          onchange: function(ev) {
            return action('uploadimage', ev.target.files);
          }
        });
      });
    });
    if (lastConv !== models.viewstate.selectedConv) {
      lastConv = models.viewstate.selectedConv;
      return laterMaybeFocus();
    }
  });

  laterMaybeFocus = function() {
    return later(maybeFocus);
  };

  maybeFocus = function() {
    var el, ref;
    el = document.activeElement;
    if (!el || !((ref = el.nodeName) === 'INPUT' || ref === 'TEXTAREA')) {
      el = document.querySelector('.input textarea');
      if (el) {
        return el.focus();
      }
    }
  };

  handle('noinputkeydown', function(ev) {
    var el;
    el = document.querySelector('.input textarea');
    if (el && !isAltCtrlMeta(ev)) {
      return el.focus();
    }
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVpL3ZpZXdzL2lucHV0LmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsUUFBQSxHQUFXLE9BQUEsQ0FBUSxVQUFSOztFQUNYLFNBQUEsR0FBWSxPQUFBLENBQVEsV0FBUjs7RUFDWixRQUFBLEdBQVcsT0FBQSxDQUFRLFlBQVI7O0VBRVYsUUFBUyxPQUFBLENBQVEsU0FBUixFQUFUOztFQUVELGFBQUEsR0FBZ0IsU0FBQyxFQUFEO1dBQVEsRUFBRSxDQUFDLE1BQUgsSUFBYSxFQUFFLENBQUMsT0FBaEIsSUFBMkIsRUFBRSxDQUFDLE9BQTlCLElBQXlDLEVBQUUsQ0FBQztFQUFwRDs7RUFDaEIsYUFBQSxHQUFnQixTQUFDLEVBQUQ7V0FBUSxFQUFFLENBQUMsTUFBSCxJQUFhLEVBQUUsQ0FBQyxPQUFoQixJQUEyQixFQUFFLENBQUM7RUFBdEM7O0VBRWhCLFdBQUEsR0FBYyxTQUFDLEVBQUQ7V0FBUSxFQUFFLENBQUMsY0FBSCxHQUFvQixFQUFFLENBQUMsWUFBSCxHQUFrQixFQUFFLENBQUMsS0FBSyxDQUFDO0VBQXZEOztFQUVkLE9BQUEsR0FBVTs7RUFDVixZQUFBLEdBQWU7O0VBQ2YsYUFBQSxHQUFnQjs7RUFDaEIsYUFBQSxHQUFnQjs7RUFFaEIsV0FBQSxHQUFjLFNBQUMsSUFBRDtJQUNWLE9BQU8sQ0FBQyxJQUFSLENBQWEsSUFBYjtJQUNBLElBQUcsT0FBTyxDQUFDLE1BQVIsS0FBa0IsYUFBckI7TUFBd0MsT0FBTyxDQUFDLEtBQVIsQ0FBQSxFQUF4Qzs7V0FDQSxZQUFBLEdBQWUsT0FBTyxDQUFDO0VBSGI7O0VBS2QsV0FBQSxHQUFjLFNBQUMsRUFBRCxFQUFLLE1BQUw7QUFFVixRQUFBO0lBQUEsSUFBRyxNQUFBLEtBQVUsQ0FBQyxDQUFYLElBQWlCLFlBQUEsS0FBZ0IsT0FBTyxDQUFDLE1BQTVDO01BQXdELGFBQUEsR0FBZ0IsRUFBRSxDQUFDLE1BQTNFOztJQUNBLFlBQUEsR0FBZSxZQUFB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LFNBQUMsRUFBRDtBQUNyQixRQUFBO0lBQUEsRUFBQSxHQUFLLFFBQVEsQ0FBQyxhQUFULENBQXVCLGlCQUF2QjtJQUNMLElBQWMsRUFBQSxJQUFPLENBQUksYUFBQSxDQUFjLEVBQWQsQ0FBekI7YUFBQSxFQUFFLENBQUMsS0FBSCxDQUFBLEVBQUE7O0VBRnFCLENBQXpCO0FBdkZBIiwiZmlsZSI6InVpL3ZpZXdzL2lucHV0LmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiYXV0b3NpemUgPSByZXF1aXJlICdhdXRvc2l6ZSdcbmNsaXBib2FyZCA9IHJlcXVpcmUgJ2NsaXBib2FyZCdcbm1lc3NhZ2VzID0gcmVxdWlyZSAnLi9tZXNzYWdlcydcblxue2xhdGVyfSA9IHJlcXVpcmUgJy4uL3V0aWwnXG5cbmlzTW9kaWZpZXJLZXkgPSAoZXYpIC0+IGV2LmFsdEtleSB8fCBldi5jdHJsS2V5IHx8IGV2Lm1ldGFLZXkgfHwgZXYuc2hpZnRLZXlcbmlzQWx0Q3RybE1ldGEgPSAoZXYpIC0+IGV2LmFsdEtleSB8fCBldi5jdHJsS2V5IHx8IGV2Lm1ldGFLZXlcblxuY3Vyc29yVG9FbmQgPSAoZWwpIC0+IGVsLnNlbGVjdGlvblN0YXJ0ID0gZWwuc2VsZWN0aW9uRW5kID0gZWwudmFsdWUubGVuZ3RoXG5cbmhpc3RvcnkgPSBbXVxuaGlzdG9yeUluZGV4ID0gMFxuaGlzdG9yeUxlbmd0aCA9IDEwMFxuaGlzdG9yeUJhY2t1cCA9IFwiXCJcblxuaGlzdG9yeVB1c2ggPSAoZGF0YSkgLT5cbiAgICBoaXN0b3J5LnB1c2ggZGF0YVxuICAgIGlmIGhpc3RvcnkubGVuZ3RoID09IGhpc3RvcnlMZW5ndGggdGhlbiBoaXN0b3J5LnNoaWZ0KClcbiAgICBoaXN0b3J5SW5kZXggPSBoaXN0b3J5Lmxlbmd0aFxuXG5oaXN0b3J5V2FsayA9IChlbCwgb2Zmc2V0KSAtPlxuICAgICMgaWYgd2UgYXJlIHN0YXJ0aW5nIHRvIGRpdmUgaW50byBoaXN0b3J5IGJlIGJhY2t1cCBjdXJyZW50IG1lc3NhZ2VcbiAgICBpZiBvZmZzZXQgaXMgLTEgYW5kIGhpc3RvcnlJbmRleCBpcyBoaXN0b3J5Lmxlbmd0aCB0aGVuIGhpc3RvcnlCYWNrdXAgPSBlbC52YWx1ZVxuICAgIGhpc3RvcnlJbmRleCA9IGhpc3RvcnlJbmRleCArIG9mZnNldFxuICAgICMgY29uc3RyYWluIGluZGV4XG4gICAgaWYgaGlzdG9yeUluZGV4IDwgMCB0aGVuIGhpc3RvcnlJbmRleCA9IDBcbiAgICBpZiBoaXN0b3J5SW5kZXggPiBoaXN0b3J5Lmxlbmd0aCB0aGVuIGhpc3RvcnlJbmRleCA9IGhpc3RvcnkubGVuZ3RoXG4gICAgIyBpZiBkb24ndCBoYXZlIGhpc3RvcnkgdmFsdWUgcmVzdG9yZSAnY3VycmVudCBtZXNzYWdlJ1xuICAgIHZhbCA9IGhpc3RvcnlbaGlzdG9yeUluZGV4XSBvciBoaXN0b3J5QmFja3VwXG4gICAgZWwudmFsdWUgPSB2YWxcbiAgICBzZXRUaW1lb3V0ICgtPiBjdXJzb3JUb0VuZCBlbCksIDFcblxubGFzdENvbnYgPSBudWxsXG5cbm1vZHVsZS5leHBvcnRzID0gdmlldyAobW9kZWxzKSAtPlxuICAgIGRpdiBjbGFzczonaW5wdXQnLCAtPiBkaXYgLT5cbiAgICAgICAgdGV4dGFyZWEgYXV0b2ZvY3VzOnRydWUsIHBsYWNlaG9sZGVyOidNZXNzYWdlJywgcm93czogMSwgJydcbiAgICAgICAgLCBvbkRPTU5vZGVJbnNlcnRlZDogKGUpIC0+XG4gICAgICAgICAgICAjIGF0IHRoaXMgcG9pbnQgdGhlIG5vZGUgaXMgc3RpbGwgbm90IGluc2VydGVkXG4gICAgICAgICAgICB0YSA9IGUudGFyZ2V0XG4gICAgICAgICAgICBsYXRlciAtPiBhdXRvc2l6ZSB0YVxuICAgICAgICAgICAgdGEuYWRkRXZlbnRMaXN0ZW5lciAnYXV0b3NpemU6cmVzaXplZCcsIC0+XG4gICAgICAgICAgICAgICAgIyB3ZSBkbyB0aGlzIGJlY2F1c2UgdGhlIGF1dG9zaXppbmcgc2V0cyB0aGUgaGVpZ2h0IHRvIG5vdGhpbmdcbiAgICAgICAgICAgICAgICAjIHdoaWxlIG1lYXN1cmluZyBhbmQgdGhhdCBjYXVzZXMgdGhlIG1lc3NhZ2VzIHNjcm9sbCBhYm92ZSB0b1xuICAgICAgICAgICAgICAgICMgbW92ZS4gYnkgcGlubmluZyB0aGUgZGl2IG9mIHRoZSBvdXRlciBob2xkaW5nIGRpdiwgd2VcbiAgICAgICAgICAgICAgICAjIGFyZSBub3QgbW92aW5nIHRoZSBzY3JvbGxlci5cbiAgICAgICAgICAgICAgICB0YS5wYXJlbnROb2RlLnN0eWxlLmhlaWdodCA9ICh0YS5vZmZzZXRIZWlnaHQgKyAyNCkgKyAncHgnXG4gICAgICAgICAgICAgICAgbWVzc2FnZXMuc2Nyb2xsVG9Cb3R0b20oKVxuICAgICAgICAsIG9ua2V5ZG93bjogKGUpIC0+XG4gICAgICAgICAgICBpZiAoZS5tZXRhS2V5IG9yIGUuY3RybEtleSkgYW5kIGUua2V5SWRlbnRpZmllciA9PSAnVXAnIHRoZW4gYWN0aW9uICdzZWxlY3ROZXh0Q29udicsIC0xXG4gICAgICAgICAgICBpZiAoZS5tZXRhS2V5IG9yIGUuY3RybEtleSkgYW5kIGUua2V5SWRlbnRpZmllciA9PSAnRG93bicgdGhlbiBhY3Rpb24gJ3NlbGVjdE5leHRDb252JywgKzFcbiAgICAgICAgICAgIHVubGVzcyBpc01vZGlmaWVyS2V5KGUpXG4gICAgICAgICAgICAgICAgaWYgZS5rZXlDb2RlID09IDEzXG4gICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gJ3NlbmRtZXNzYWdlJywgZS50YXJnZXQudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgaGlzdG9yeVB1c2ggZS50YXJnZXQudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQudmFsdWUgPSAnJ1xuICAgICAgICAgICAgICAgICAgICBhdXRvc2l6ZS51cGRhdGUgZS50YXJnZXRcbiAgICAgICAgICAgICAgICBpZiBlLnRhcmdldC52YWx1ZSA9PSAnJ1xuICAgICAgICAgICAgICAgICAgICBpZiBlLmtleUlkZW50aWZpZXIgaXMgXCJVcFwiIHRoZW4gaGlzdG9yeVdhbGsgZS50YXJnZXQsIC0xXG4gICAgICAgICAgICAgICAgICAgIGlmIGUua2V5SWRlbnRpZmllciBpcyBcIkRvd25cIiB0aGVuIGhpc3RvcnlXYWxrIGUudGFyZ2V0LCArMVxuICAgICAgICAgICAgYWN0aW9uICdsYXN0a2V5ZG93bicsIERhdGUubm93KCkgdW5sZXNzIGlzQWx0Q3RybE1ldGEoZSlcbiAgICAgICAgLCBvbnBhc3RlOiAoZSkgLT5cbiAgICAgICAgICAgIGFjdGlvbiAnb25wYXN0ZWltYWdlJyBpZiBub3QgY2xpcGJvYXJkLnJlYWRJbWFnZSgpLmlzRW1wdHkoKVxuICAgICAgICBidXR0b24gdGl0bGU6J0F0dGFjaCBpbWFnZScsIG9uY2xpY2s6IChldikgLT5cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhdHRhY2hGaWxlJykuY2xpY2soKVxuICAgICAgICAsIC0+XG4gICAgICAgICAgICBzcGFuIGNsYXNzOidpY29uLWF0dGFjaCdcbiAgICAgICAgaW5wdXQgdHlwZTonZmlsZScsIGlkOidhdHRhY2hGaWxlJywgYWNjZXB0OicuanBnLC5qcGVnLC5wbmcsLmdpZicsIG9uY2hhbmdlOiAoZXYpIC0+XG4gICAgICAgICAgICBhY3Rpb24gJ3VwbG9hZGltYWdlJywgZXYudGFyZ2V0LmZpbGVzXG5cbiAgICAjIGZvY3VzIHdoZW4gc3dpdGNoaW5nIGNvbnZzXG4gICAgaWYgbGFzdENvbnYgIT0gbW9kZWxzLnZpZXdzdGF0ZS5zZWxlY3RlZENvbnZcbiAgICAgICAgbGFzdENvbnYgPSBtb2RlbHMudmlld3N0YXRlLnNlbGVjdGVkQ29udlxuICAgICAgICBsYXRlck1heWJlRm9jdXMoKVxuXG5sYXRlck1heWJlRm9jdXMgPSAtPiBsYXRlciBtYXliZUZvY3VzXG5cbm1heWJlRm9jdXMgPSAtPlxuICAgICMgbm8gYWN0aXZlIGVsZW1lbnQ/IG9yIG5vdCBmb2N1c2luZyBzb21ldGhpbmcgcmVsZXZhbnQuLi5cbiAgICBlbCA9IGRvY3VtZW50LmFjdGl2ZUVsZW1lbnRcbiAgICBpZiAhZWwgb3Igbm90IChlbC5ub2RlTmFtZSBpbiBbJ0lOUFVUJywgJ1RFWFRBUkVBJ10pXG4gICAgICAgICMgc3RlYWwgaXQhISFcbiAgICAgICAgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuaW5wdXQgdGV4dGFyZWEnKVxuICAgICAgICBlbC5mb2N1cygpIGlmIGVsXG5cbmhhbmRsZSAnbm9pbnB1dGtleWRvd24nLCAoZXYpIC0+XG4gICAgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuaW5wdXQgdGV4dGFyZWEnKVxuICAgIGVsLmZvY3VzKCkgaWYgZWwgYW5kIG5vdCBpc0FsdEN0cmxNZXRhKGV2KVxuIl19