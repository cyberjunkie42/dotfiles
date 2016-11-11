(function() {
  var applayout, connection, conninfo, controls, convadd, convlist, input, later, messages, models, notifications, redraw, ref, remote, setLeftSize, typinginfo, viewstate;

  remote = require('remote');

  ref = require('./index'), applayout = ref.applayout, convlist = ref.convlist, messages = ref.messages, input = ref.input, conninfo = ref.conninfo, convadd = ref.convadd, controls = ref.controls, notifications = ref.notifications, typinginfo = ref.typinginfo;

  models = require('../models');

  viewstate = models.viewstate, connection = models.connection;

  later = require('../util').later;

  handle('update:connection', (function() {
    var el;
    el = null;
    return function() {
      conninfo(connection);
      if (connection.state === connection.CONNECTED) {
        if (el != null) {
          if (typeof el.hide === "function") {
            el.hide();
          }
        }
        return el = null;
      } else {
        return el = notr({
          html: conninfo.el.innerHTML,
          stay: 0,
          id: 'conn'
        });
      }
    };
  })());

  setLeftSize = function(left) {
    document.querySelector('.left').style.width = left + 'px';
    return document.querySelector('.leftresize').style.left = (left - 2) + 'px';
  };

  handle('update:viewstate', function() {
    setLeftSize(viewstate.leftSize);
    if (viewstate.state === viewstate.STATE_STARTUP) {
      if (Array.isArray(viewstate.size)) {
        later(function() {
          var ref1;
          return (ref1 = remote.getCurrentWindow()).setSize.apply(ref1, viewstate.size);
        });
      }
      if (Array.isArray(viewstate.pos)) {
        later(function() {
          var ref1;
          return (ref1 = remote.getCurrentWindow()).setPosition.apply(ref1, viewstate.pos);
        });
      }
      applayout.left(null);
      applayout.main(null);
      applayout.maininfo(null);
      return applayout.foot(null);
    } else if (viewstate.state === viewstate.STATE_NORMAL) {
      redraw();
      applayout.lfoot(controls);
      applayout.left(convlist);
      applayout.main(messages);
      applayout.maininfo(typinginfo);
      return applayout.foot(input);
    } else if (viewstate.state === viewstate.STATE_ADD_CONVERSATION) {
      redraw();
      applayout.left(convlist);
      applayout.main(convadd);
      applayout.maininfo(null);
      return applayout.foot(null);
    } else {
      return console.log('unknown viewstate.state', viewstate.state);
    }
  });

  handle('update:entity', function() {
    return redraw();
  });

  handle('update:conv', function() {
    return redraw();
  });

  handle('update:searchedentities', function() {
    return redraw();
  });

  handle('update:selectedEntities', function() {
    return redraw();
  });

  handle('update:convsettings', function() {
    return redraw();
  });

  redraw = function() {
    notifications(models);
    controls(models);
    convlist(models);
    messages(models);
    typinginfo(models);
    input(models);
    return convadd(models);
  };

  handle('update:switchConv', function() {
    return messages.scrollToBottom();
  });

  handle('update:beforeHistory', function() {
    return applayout.recordMainPos();
  });

  handle('update:afterHistory', function() {
    return applayout.adjustMainPos();
  });

  handle('update:beforeImg', function() {
    return applayout.recordMainPos();
  });

  handle('update:afterImg', function() {
    if (viewstate.atbottom) {
      return messages.scrollToBottom();
    } else {
      return applayout.adjustMainPos();
    }
  });

  handle('update:startTyping', function() {
    if (viewstate.atbottom) {
      return messages.scrollToBottom();
    }
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVpL3ZpZXdzL2NvbnRyb2xsZXIuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0VBRVQsTUFDNkIsT0FBQSxDQUFRLFNBQVIsQ0FEN0IsRUFBQyxnQkFBQSxTQUFELEVBQVksZUFBQSxRQUFaLEVBQXNCLGVBQUEsUUFBdEIsRUFBZ0MsWUFBQSxLQUFoQyxFQUF1QyxlQUFBLFFBQXZDLEVBQWlELGNBQUEsT0FBakQsRUFBMEQsZUFBQSxRQUExRCxFQUNBLG9CQUFBLGFBREEsRUFDZSxpQkFBQTs7RUFFZixNQUFBLEdBQWMsT0FBQSxDQUFRLFdBQVI7O0VBQ2IsbUJBQUEsU0FBRCxFQUFZLG9CQUFBOztFQUVYLFFBQVMsT0FBQSxDQUFRLFNBQVIsRUFBVDs7RUFHRCxNQUFBLENBQU8sbUJBQVAsRUFBK0IsQ0FBQSxTQUFBO0FBQzNCLFFBQUE7SUFBQSxFQUFBLEdBQUs7V0FDTCxTQUFBO01BRUksUUFBQSxDQUFTLFVBQVQ7TUFHQSxJQUFHLFVBQVUsQ0FBQyxLQUFYLEtBQW9CLFVBQVUsQ0FBQyxTQUFsQzs7O1lBQ0ksRUFBRSxDQUFFOzs7ZUFDSixFQUFBLEdBQUssS0FGVDtPQUFBLE1BQUE7ZUFJSSxFQUFBLEdBQUssSUFBQSxDQUFLO1VBQUMsSUFBQSxFQUFLLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBbEI7VUFBNkIsSUFBQSxFQUFLLENBQWxDO1VBQXFDLEVBQUEsRUFBRyxNQUF4QztTQUFMLEVBSlQ7O0lBTEo7RUFGMkIsQ0FBQSxDQUFILENBQUEsQ0FBNUI7O0VBY0EsV0FBQSxHQUFjLFNBQUMsSUFBRDtJQUNWLFFBQVEsQ0FBQyxhQUFULENBQXVCLE9BQXZCLENBQStCLENBQUMsS0FBSyxDQUFDLEtBQXRDLEdBQThDLElBQUEsR0FBTztXQUNyRCxRQUFRLENBQUMsYUFBVCxDQUF1QixhQUF2QixDQUFxQyxDQUFDLEtBQUssQ0FBQyxJQUE1QyxHQUFtRCxD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QTlCOztFQUdBLE1BQUEsQ0FBTyxrQkFBUCxFQUEyQixTQUFBO1dBQ3ZCLFNBQVMsQ0FBQyxhQUFWLENBQUE7RUFEdUIsQ0FBM0I7O0VBRUEsTUFBQSxDQUFPLGlCQUFQLEVBQTBCLFNBQUE7SUFDdEIsSUFBRyxTQUFTLENBQUMsUUFBYjthQUNJLFFBQVEsQ0FBQyxjQUFULENBQUEsRUFESjtLQUFBLE1BQUE7YUFHSSxTQUFTLENBQUMsYUFBVixDQUFBLEVBSEo7O0VBRHNCLENBQTFCOztFQU1BLE1BQUEsQ0FBTyxvQkFBUCxFQUE2QixTQUFBO0lBQ3pCLElBQUcsU0FBUyxDQUFDLFFBQWI7YUFDSSxRQUFRLENBQUMsY0FBVCxDQUFBLEVBREo7O0VBRHlCLENBQTdCO0FBaEdBIiwiZmlsZSI6InVpL3ZpZXdzL2NvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJyZW1vdGUgPSByZXF1aXJlICdyZW1vdGUnXG5cbnthcHBsYXlvdXQsIGNvbnZsaXN0LCBtZXNzYWdlcywgaW5wdXQsIGNvbm5pbmZvLCBjb252YWRkLCBjb250cm9scyxcbm5vdGlmaWNhdGlvbnMsIHR5cGluZ2luZm99ID0gcmVxdWlyZSAnLi9pbmRleCdcblxubW9kZWxzICAgICAgPSByZXF1aXJlICcuLi9tb2RlbHMnXG57dmlld3N0YXRlLCBjb25uZWN0aW9ufSA9IG1vZGVsc1xuXG57bGF0ZXJ9ID0gcmVxdWlyZSAnLi4vdXRpbCdcblxuXG5oYW5kbGUgJ3VwZGF0ZTpjb25uZWN0aW9uJywgZG8gLT5cbiAgICBlbCA9IG51bGxcbiAgICAtPlxuICAgICAgICAjIGRyYXcgdmlld1xuICAgICAgICBjb25uaW5mbyBjb25uZWN0aW9uXG5cbiAgICAgICAgIyBwbGFjZSBpbiBsYXlvdXRcbiAgICAgICAgaWYgY29ubmVjdGlvbi5zdGF0ZSA9PSBjb25uZWN0aW9uLkNPTk5FQ1RFRFxuICAgICAgICAgICAgZWw/LmhpZGU/KClcbiAgICAgICAgICAgIGVsID0gbnVsbFxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBlbCA9IG5vdHIge2h0bWw6Y29ubmluZm8uZWwuaW5uZXJIVE1MLCBzdGF5OjAsIGlkOidjb25uJ31cblxuXG5zZXRMZWZ0U2l6ZSA9IChsZWZ0KSAtPlxuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5sZWZ0Jykuc3R5bGUud2lkdGggPSBsZWZ0ICsgJ3B4J1xuICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5sZWZ0cmVzaXplJykuc3R5bGUubGVmdCA9IChsZWZ0IC0gMikgKyAncHgnXG5cblxuaGFuZGxlICd1cGRhdGU6dmlld3N0YXRlJywgLT5cbiAgICBzZXRMZWZ0U2l6ZSB2aWV3c3RhdGUubGVmdFNpemVcbiAgICBpZiB2aWV3c3RhdGUuc3RhdGUgPT0gdmlld3N0YXRlLlNUQVRFX1NUQVJUVVBcbiAgICAgICAgaWYgQXJyYXkuaXNBcnJheSB2aWV3c3RhdGUuc2l6ZVxuICAgICAgICAgICAgbGF0ZXIgLT4gcmVtb3RlLmdldEN1cnJlbnRXaW5kb3coKS5zZXRTaXplIHZpZXdzdGF0ZS5zaXplLi4uXG4gICAgICAgIGlmIEFycmF5LmlzQXJyYXkgdmlld3N0YXRlLnBvc1xuICAgICAgICAgICAgbGF0ZXIgLT4gcmVtb3RlLmdldEN1cnJlbnRXaW5kb3coKS5zZXRQb3NpdGlvbiB2aWV3c3RhdGUucG9zLi4uXG4gICAgICAgIGFwcGxheW91dC5sZWZ0IG51bGxcbiAgICAgICAgYXBwbGF5b3V0Lm1haW4gbnVsbFxuICAgICAgICBhcHBsYXlvdXQubWFpbmluZm8gbnVsbFxuICAgICAgICBhcHBsYXlvdXQuZm9vdCBudWxsXG4gICAgZWxzZSBpZiB2aWV3c3RhdGUuc3RhdGUgPT0gdmlld3N0YXRlLlNUQVRFX05PUk1BTFxuICAgICAgICByZWRyYXcoKVxuICAgICAgICBhcHBsYXlvdXQubGZvb3QgY29udHJvbHNcbiAgICAgICAgYXBwbGF5b3V0LmxlZnQgY29udmxpc3RcbiAgICAgICAgYXBwbGF5b3V0Lm1haW4gbWVzc2FnZXNcbiAgICAgICAgYXBwbGF5b3V0Lm1haW5pbmZvIHR5cGluZ2luZm9cbiAgICAgICAgYXBwbGF5b3V0LmZvb3QgaW5wdXRcbiAgICBlbHNlIGlmIHZpZXdzdGF0ZS5zdGF0ZSA9PSB2aWV3c3RhdGUuU1RBVEVfQUREX0NPTlZFUlNBVElPTlxuICAgICAgICByZWRyYXcoKVxuICAgICAgICBhcHBsYXlvdXQubGVmdCBjb252bGlzdFxuICAgICAgICBhcHBsYXlvdXQubWFpbiBjb252YWRkXG4gICAgICAgIGFwcGxheW91dC5tYWluaW5mbyBudWxsXG4gICAgICAgIGFwcGxheW91dC5mb290IG51bGxcbiAgICBlbHNlXG4gICAgICAgIGNvbnNvbGUubG9nICd1bmtub3duIHZpZXdzdGF0ZS5zdGF0ZScsIHZpZXdzdGF0ZS5zdGF0ZVxuXG5oYW5kbGUgJ3VwZGF0ZTplbnRpdHknLCAtPlxuICAgIHJlZHJhdygpXG5cbmhhbmRsZSAndXBkYXRlOmNvbnYnLCAtPlxuICAgIHJlZHJhdygpXG5cbmhhbmRsZSAndXBkYXRlOnNlYXJjaGVkZW50aXRpZXMnLCAtPlxuICByZWRyYXcoKVxuXG5oYW5kbGUgJ3VwZGF0ZTpzZWxlY3RlZEVudGl0aWVzJywgLT5cbiAgcmVkcmF3KClcblxuaGFuZGxlICd1cGRhdGU6Y29udnNldHRpbmdzJywgLT4gcmVkcmF3KClcblxucmVkcmF3ID0gLT5cbiAgICBub3RpZmljYXRpb25zIG1vZGVsc1xuICAgIGNvbnRyb2xzIG1vZGVsc1xuICAgIGNvbnZsaXN0IG1vZGVsc1xuICAgIG1lc3NhZ2VzIG1vZGVsc1xuICAgIHR5cGluZ2luZm8gbW9kZWxzXG4gICAgaW5wdXQgbW9kZWxzXG4gICAgY29udmFkZCBtb2RlbHNcblxuaGFuZGxlICd1cGRhdGU6c3dpdGNoQ29udicsIC0+XG4gICAgbWVzc2FnZXMuc2Nyb2xsVG9Cb3R0b20oKVxuXG5oYW5kbGUgJ3VwZGF0ZTpiZWZvcmVIaXN0b3J5JywgLT5cbiAgICBhcHBsYXlvdXQucmVjb3JkTWFpblBvcygpXG5oYW5kbGUgJ3VwZGF0ZTphZnRlckhpc3RvcnknLCAtPlxuICAgIGFwcGxheW91dC5hZGp1c3RNYWluUG9zKClcblxuaGFuZGxlICd1cGRhdGU6YmVmb3JlSW1nJywgLT5cbiAgICBhcHBsYXlvdXQucmVjb3JkTWFpblBvcygpXG5oYW5kbGUgJ3VwZGF0ZTphZnRlckltZycsIC0+XG4gICAgaWYgdmlld3N0YXRlLmF0Ym90dG9tXG4gICAgICAgIG1lc3NhZ2VzLnNjcm9sbFRvQm90dG9tKClcbiAgICBlbHNlXG4gICAgICAgIGFwcGxheW91dC5hZGp1c3RNYWluUG9zKClcblxuaGFuZGxlICd1cGRhdGU6c3RhcnRUeXBpbmcnLCAtPlxuICAgIGlmIHZpZXdzdGF0ZS5hdGJvdHRvbVxuICAgICAgICBtZXNzYWdlcy5zY3JvbGxUb0JvdHRvbSgpXG4iXX0=