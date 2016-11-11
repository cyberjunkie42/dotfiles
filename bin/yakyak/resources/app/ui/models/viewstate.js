(function() {
  var Client, STATES, exp, later, merge, ref, ref1, ref2, ref3, throttle, tryparse,
    slice = [].slice;

  Client = require('hangupsjs');

  merge = function() {
    var j, k, len, o, os, t, v;
    t = arguments[0], os = 2 <= arguments.length ? slice.call(arguments, 1) : [];
    for (j = 0, len = os.length; j < len; j++) {
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

  ref = require('../util'), throttle = ref.throttle, later = ref.later, tryparse = ref.tryparse;

  STATES = {
    STATE_STARTUP: 'startup',
    STATE_NORMAL: 'normal',
    STATE_ADD_CONVERSATION: 'add_conversation'
  };

  module.exports = exp = {
    state: null,
    attop: false,
    atbottom: true,
    selectedConv: localStorage.selectedConv,
    lastActivity: null,
    leftSize: (ref1 = tryparse(localStorage.leftSize)) != null ? ref1 : 200,
    size: tryparse((ref2 = localStorage.size) != null ? ref2 : "[940, 600]"),
    pos: tryparse((ref3 = localStorage.pos) != null ? ref3 : "[100, 100]"),
    showConvThumbs: tryparse(localStorage.showConvThumbs),
    setState: function(state) {
      if (this.state === state) {
        return;
      }
      this.state = state;
      if (state === STATES.STATE_STARTUP) {
        require('./connection').setLastActive(Date.now(), true);
      }
      return updated('viewstate');
    },
    setSelectedConv: function(c) {
      var conv, conv_id, ref4, ref5, ref6, ref7, ref8, ref9;
      conv = require('./conv');
      conv_id = (ref4 = (ref5 = c != null ? (ref6 = c.conversation_id) != null ? ref6.id : void 0 : void 0) != null ? ref5 : c != null ? c.id : void 0) != null ? ref4 : c;
      if (!conv_id) {
        conv_id = (ref7 = conv.list()) != null ? (ref8 = ref7[0]) != null ? (ref9 = ref8.conversation_id) != null ? ref9.id : void 0 : void 0 : void 0;
      }
      if (this.selectedConv === conv_id) {
        return;
      }
      this.selectedConv = localStorage.selectedConv = conv_id;
      this.setLastKeyDown(0);
      updated('viewstate');
      return updated('switchConv');
    },
    selectNextConv: function(offset) {
      var c, candidate, conv, i, id, index, j, len, list, results;
      if (offset == null) {
        offset = 1;
      }
      conv = require('./conv');
      id = this.selectedConv;
      c = conv[id];
      list = (function() {
        var j, len, ref4, results;
        ref4 = conv.list();
        results = [];
        for (j = 0, len = ref4.length; j < len; j++) {
          i = ref4[j];
          if (!conv.isPureHangout(i)) {
            results.push(i);
          }
        }
        return results;
      })();
      results = [];
      for (index = j = 0, len = list.length; j < len; index = ++j) {
        c = list[index];
        if (id === c.conversation_id.id) {
          candidate = index + offset;
          if (list[candidate]) {
            results.push(this.setSelectedConv(list[candidate]));
          } else {
            results.push(void 0);
          }
        } else {
          results.push(void 0);
        }
      }
      return results;
    },
    updateAtTop: function(attop) {
      if (this.attop === attop) {
        return;
      }
      this.attop = attop;
      return updated('viewstate');
    },
    updateAtBottom: function(atbottom) {
      if (this.atbottom === atbottom) {
        return;
      }
      this.atbottom = atbottom;
      return this.updateActivity(Date.now());
    },
    updateActivity: function(time) {
      var c, conv, ur;
      conv = require('./conv');
      this.lastActivity = time;
      later(function() {
        return action('lastActivity');
      });
      if (!(document.hasFocus() && this.atbottom && this.state === STATES.STATE_NORMAL)) {
        return;
      }
      c = conv[this.selectedConv];
      if (!c) {
        return;
      }
      ur = conv.unread(c);
      if (ur > 0) {
        return later(function() {
          return action('updatewatermark');
        });
      }
    },
    setSize: function(size) {
      localStorage.size = JSON.stringify(size);
      this.size = size;
      return updated('viewstate');
    },
    setPosition: function(pos) {
      localStorage.pos = JSON.stringify(pos);
      this.pos = pos;
      return updated('viewstate');
    },
    setLeftSize: function(size) {
      if (this.leftSize === size) {
        return;
      }
      this.leftSize = localStorage.leftSize = size;
      return updated('viewstate');
    },
    setLastKeyDown: (function() {
      var PAUSED, STOPPED, TYPING, lastEmitted, ref4, timeout, update;
      ref4 = Client.TypingStatus, TYPING = ref4.TYPING, PAUSED = ref4.PAUSED, STOPPED = ref4.STOPPED;
      lastEmitted = 0;
      timeout = 0;
      return update = throttle(500, function(time) {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = null;
        if (!time) {
          return lastEmitted = 0;
        } else {
          if (time - lastEmitted > 5000) {
            later(function() {
              return action('settyping', TYPING);
            });
            lastEmitted = time;
          }
          return timeout = setTimeout(function() {
            lastEmitted = 0;
            action('settyping', PAUSED);
            return timeout = setTimeout(function() {
              return action('settyping', STOPPED);
            }, 6000);
          }, 6000);
        }
      });
    })(),
    setShowConvThumbs: function(doshow) {
      if (this.showConvThumbs === doshow) {
        return;
      }
      this.showConvThumbs = localStorage.showConvThumbs = doshow;
      return updated('viewstate');
    }
  };

  merge(exp, STATES);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVpL21vZGVscy92aWV3c3RhdGUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSw0RUFBQTtJQUFBOztFQUFBLE1BQUEsR0FBUyxPQUFBLENBQVEsV0FBUjs7RUFFVCxLQUFBLEdBQVUsU0FBQTtBQUFjLFFBQUE7SUFBYixrQkFBRztBQUFVLFNBQUEsb0NBQUE7O0FBQUEsV0FBQSxNQUFBOztZQUEyQixDQUFBLEtBQVUsSUFBVixJQUFBLENBQUEsS0FBZ0I7VUFBM0MsQ0FBRSxDQUFBLENBQUEsQ0FBRixHQUFPOztBQUFQO0FBQUE7V0FBbUU7RUFBakY7O0VBRVYsTUFBOEIsT0FBQSxDQUFRLFNBQVIsQ0FBOUIsRUFBQyxlQUFBLFFBQUQsRUFBVyxZQUFBLEtBQVgsRUFBa0IsZUFBQTs7RUFFbEIsTUFBQSxHQUNJO0lBQUEsYUFBQSxFQUFlLFNBQWY7SUFDQSxZQUFBLEVBQWMsUUFEZDtJQUVBLHNCQUFBLEVBQXdCLGtCQUZ4Qjs7O0VBSUosTUFBTSxDQUFDLE9BQVAsR0FBaUIsR0FBQSxHQUFNO0lBQ25CLEtBQUEsRUFBTyxJQURZO0lBRW5CLEtBQUEsRUFBTyxLQUZZO0lBR25CLFFBQUEsRUFBVSxJQUhTO0lBSW5CLFlBQUEsRUFBYyxZQUFZLENBQUMsWUFKUjtJQUtuQixZQUFBLEVBQWMsSUFMSztJQU1uQixRQUFBLDREQUE0QyxHQU56QjtJQU9uQixJQUFBLEVBQU0sUUFBQSw2Q0FBNkIsWUFBN0IsQ0FQYTtJQVFuQixHQUFBLEVBQUssUUFBQSw0Q0FBNEIsWUFBNUIsQ0FSYztJQVNuQixjQUFBLEVBQWdCLFFBQUEsQ0FBUyxZQUFZLENBQUMsY0FBdEIsQ0FURztJQVduQixRQUFBLEVBQVUsU0FBQyxLQUFEO01BQ04sSUFBVSxJQUFDLENBQUEsS0FBRCxLQUFVLEtBQXBCO0FBQUEsZUFBQTs7TUFDQSxJQUFDLENBQUEsS0FBRCxHQUFTO01BQ1QsSUFBRyxLQUFBLEtBQVMsTUFBTSxDQUFDLGFBQW5CO1FBR0ksT0FB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QSxDQTdFRztJQXNHbkIsaUJBQUEsRUFBbUIsU0FBQyxNQUFEO01BQ2YsSUFBVSxJQUFDLENBQUEsY0FBRCxLQUFtQixNQUE3QjtBQUFBLGVBQUE7O01BQ0EsSUFBQyxDQUFBLGNBQUQsR0FBa0IsWUFBWSxDQUFDLGNBQWIsR0FBOEI7YUFDaEQsT0FBQSxDQUFRLFdBQVI7SUFIZSxDQXRHQTs7O0VBNkd2QixLQUFBLENBQU0sR0FBTixFQUFXLE1BQVg7QUF4SEEiLCJmaWxlIjoidWkvbW9kZWxzL3ZpZXdzdGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIkNsaWVudCA9IHJlcXVpcmUgJ2hhbmd1cHNqcydcblxubWVyZ2UgICA9ICh0LCBvcy4uLikgLT4gdFtrXSA9IHYgZm9yIGssdiBvZiBvIHdoZW4gdiBub3QgaW4gW251bGwsIHVuZGVmaW5lZF0gZm9yIG8gaW4gb3M7IHRcblxue3Rocm90dGxlLCBsYXRlciwgdHJ5cGFyc2V9ID0gcmVxdWlyZSAnLi4vdXRpbCdcblxuU1RBVEVTID1cbiAgICBTVEFURV9TVEFSVFVQOiAnc3RhcnR1cCdcbiAgICBTVEFURV9OT1JNQUw6ICdub3JtYWwnXG4gICAgU1RBVEVfQUREX0NPTlZFUlNBVElPTjogJ2FkZF9jb252ZXJzYXRpb24nXG5cbm1vZHVsZS5leHBvcnRzID0gZXhwID0ge1xuICAgIHN0YXRlOiBudWxsXG4gICAgYXR0b3A6IGZhbHNlICAgIyB0ZWxscyB3aGV0aGVyIG1lc3NhZ2UgbGlzdCBpcyBzY3JvbGxlIHRvIHRvcFxuICAgIGF0Ym90dG9tOiB0cnVlICMgdGVsbHMgd2hldGhlciBtZXNzYWdlIGxpc3QgaXMgc2Nyb2xsZWQgdG8gYm90dG9tXG4gICAgc2VsZWN0ZWRDb252OiBsb2NhbFN0b3JhZ2Uuc2VsZWN0ZWRDb252XG4gICAgbGFzdEFjdGl2aXR5OiBudWxsXG4gICAgbGVmdFNpemU6IHRyeXBhcnNlKGxvY2FsU3RvcmFnZS5sZWZ0U2l6ZSkgPyAyMDBcbiAgICBzaXplOiB0cnlwYXJzZShsb2NhbFN0b3JhZ2Uuc2l6ZSA/IFwiWzk0MCwgNjAwXVwiKVxuICAgIHBvczogdHJ5cGFyc2UobG9jYWxTdG9yYWdlLnBvcyA/IFwiWzEwMCwgMTAwXVwiKVxuICAgIHNob3dDb252VGh1bWJzOiB0cnlwYXJzZShsb2NhbFN0b3JhZ2Uuc2hvd0NvbnZUaHVtYnMpXG5cbiAgICBzZXRTdGF0ZTogKHN0YXRlKSAtPlxuICAgICAgICByZXR1cm4gaWYgQHN0YXRlID09IHN0YXRlXG4gICAgICAgIEBzdGF0ZSA9IHN0YXRlXG4gICAgICAgIGlmIHN0YXRlID09IFNUQVRFUy5TVEFURV9TVEFSVFVQXG4gICAgICAgICAgICAjIHNldCBhIGZpcnN0IGFjdGl2ZSB0aW1lc3RhbXAgdG8gYXZvaWQgcmVxdWVzdGluZ1xuICAgICAgICAgICAgIyBzeW5jYWxsbmV3ZXZlbnRzIG9uIHN0YXJ0dXBcbiAgICAgICAgICAgIHJlcXVpcmUoJy4vY29ubmVjdGlvbicpLnNldExhc3RBY3RpdmUoRGF0ZS5ub3coKSwgdHJ1ZSlcbiAgICAgICAgdXBkYXRlZCAndmlld3N0YXRlJ1xuXG4gICAgc2V0U2VsZWN0ZWRDb252OiAoYykgLT5cbiAgICAgICAgY29udiA9IHJlcXVpcmUgJy4vY29udicgIyBjaXJjdWxhclxuICAgICAgICBjb252X2lkID0gYz8uY29udmVyc2F0aW9uX2lkPy5pZCA/IGM/LmlkID8gY1xuICAgICAgICB1bmxlc3MgY29udl9pZFxuICAgICAgICAgICAgY29udl9pZCA9IGNvbnYubGlzdCgpP1swXT8uY29udmVyc2F0aW9uX2lkPy5pZFxuICAgICAgICByZXR1cm4gaWYgQHNlbGVjdGVkQ29udiA9PSBjb252X2lkXG4gICAgICAgIEBzZWxlY3RlZENvbnYgPSBsb2NhbFN0b3JhZ2Uuc2VsZWN0ZWRDb252ID0gY29udl9pZFxuICAgICAgICBAc2V0TGFzdEtleURvd24gMFxuICAgICAgICB1cGRhdGVkICd2aWV3c3RhdGUnXG4gICAgICAgIHVwZGF0ZWQgJ3N3aXRjaENvbnYnXG5cbiAgICBzZWxlY3ROZXh0Q29udjogKG9mZnNldCA9IDEpIC0+XG4gICAgICAgIGNvbnYgPSByZXF1aXJlICcuL2NvbnYnXG4gICAgICAgIGlkID0gQHNlbGVjdGVkQ29udlxuICAgICAgICBjID0gY29udltpZF1cbiAgICAgICAgbGlzdCA9IChpIGZvciBpIGluIGNvbnYubGlzdCgpIHdoZW4gbm90IGNvbnYuaXNQdXJlSGFuZ291dChpKSlcbiAgICAgICAgZm9yIGMsIGluZGV4IGluIGxpc3RcbiAgICAgICAgICAgIGlmIGlkID09IGMuY29udmVyc2F0aW9uX2lkLmlkXG4gICAgICAgICAgICAgICAgY2FuZGlkYXRlID0gaW5kZXggKyBvZmZzZXRcbiAgICAgICAgICAgICAgICBAc2V0U2VsZWN0ZWRDb252IGxpc3RbY2FuZGlkYXRlXSBpZiBsaXN0W2NhbmRpZGF0ZV1cblxuICAgIHVwZGF0ZUF0VG9wOiAoYXR0b3ApIC0+XG4gICAgICAgIHJldHVybiBpZiBAYXR0b3AgPT0gYXR0b3BcbiAgICAgICAgQGF0dG9wID0gYXR0b3BcbiAgICAgICAgdXBkYXRlZCAndmlld3N0YXRlJ1xuXG4gICAgdXBkYXRlQXRCb3R0b206IChhdGJvdHRvbSkgLT5cbiAgICAgICAgcmV0dXJuIGlmIEBhdGJvdHRvbSA9PSBhdGJvdHRvbVxuICAgICAgICBAYXRib3R0b20gPSBhdGJvdHRvbVxuICAgICAgICBAdXBkYXRlQWN0aXZpdHkgRGF0ZS5ub3coKVxuXG4gICAgdXBkYXRlQWN0aXZpdHk6ICh0aW1lKSAtPlxuICAgICAgICBjb252ID0gcmVxdWlyZSAnLi9jb252JyAjIGNpcmN1bGFyXG4gICAgICAgIEBsYXN0QWN0aXZpdHkgPSB0aW1lXG4gICAgICAgIGxhdGVyIC0+IGFjdGlvbiAnbGFzdEFjdGl2aXR5J1xuICAgICAgICByZXR1cm4gdW5sZXNzIGRvY3VtZW50Lmhhc0ZvY3VzKCkgYW5kIEBhdGJvdHRvbSBhbmQgQHN0YXRlID09IFNUQVRFUy5TVEFURV9OT1JNQUxcbiAgICAgICAgYyA9IGNvbnZbQHNlbGVjdGVkQ29udl1cbiAgICAgICAgcmV0dXJuIHVubGVzcyBjXG4gICAgICAgIHVyID0gY29udi51bnJlYWQgY1xuICAgICAgICBpZiB1ciA+IDBcbiAgICAgICAgICAgIGxhdGVyIC0+IGFjdGlvbiAndXBkYXRld2F0ZXJtYXJrJ1xuXG4gICAgc2V0U2l6ZTogKHNpemUpIC0+XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zaXplID0gSlNPTi5zdHJpbmdpZnkoc2l6ZSlcbiAgICAgICAgQHNpemUgPSBzaXplXG4gICAgICAgIHVwZGF0ZWQgJ3ZpZXdzdGF0ZSdcblxuICAgIHNldFBvc2l0aW9uOiAocG9zKSAtPlxuICAgICAgICBsb2NhbFN0b3JhZ2UucG9zID0gSlNPTi5zdHJpbmdpZnkocG9zKVxuICAgICAgICBAcG9zID0gcG9zXG4gICAgICAgIHVwZGF0ZWQgJ3ZpZXdzdGF0ZSdcblxuICAgIHNldExlZnRTaXplOiAoc2l6ZSkgLT5cbiAgICAgICAgcmV0dXJuIGlmIEBsZWZ0U2l6ZSA9PSBzaXplXG4gICAgICAgIEBsZWZ0U2l6ZSA9IGxvY2FsU3RvcmFnZS5sZWZ0U2l6ZSA9IHNpemVcbiAgICAgICAgdXBkYXRlZCAndmlld3N0YXRlJ1xuXG4gICAgc2V0TGFzdEtleURvd246IGRvIC0+XG4gICAgICAgIHtUWVBJTkcsIFBBVVNFRCwgU1RPUFBFRH0gPSBDbGllbnQuVHlwaW5nU3RhdHVzXG4gICAgICAgIGxhc3RFbWl0dGVkID0gMFxuICAgICAgICB0aW1lb3V0ID0gMFxuICAgICAgICB1cGRhdGUgPSB0aHJvdHRsZSA1MDAsICh0aW1lKSAtPlxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0IHRpbWVvdXQgaWYgdGltZW91dFxuICAgICAgICAgICAgdGltZW91dCA9IG51bGxcbiAgICAgICAgICAgIHVubGVzcyB0aW1lXG4gICAgICAgICAgICAgICAgbGFzdEVtaXR0ZWQgPSAwXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgaWYgdGltZSAtIGxhc3RFbWl0dGVkID4gNTAwMFxuICAgICAgICAgICAgICAgICAgICBsYXRlciAtPiBhY3Rpb24gJ3NldHR5cGluZycsIFRZUElOR1xuICAgICAgICAgICAgICAgICAgICBsYXN0RW1pdHRlZCA9IHRpbWVcbiAgICAgICAgICAgICAgICB0aW1lb3V0ID0gc2V0VGltZW91dCAtPlxuICAgICAgICAgICAgICAgICAgICAjIGFmdGVyIDYgc2Vjb2RzIG9mIG5vIGtleWJvYXJkLCB3ZSBjb25zaWRlciB0aGVcbiAgICAgICAgICAgICAgICAgICAgIyB1c2VyIHRvb2sgYSBicmVhay5cbiAgICAgICAgICAgICAgICAgICAgbGFzdEVtaXR0ZWQgPSAwXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiAnc2V0dHlwaW5nJywgUEFVU0VEXG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0IC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAjIGFuZCBhZnRlciBhbm90aGVyIDYgc2Vjb25kcyAoMTIgdG90YWwpLCB3ZVxuICAgICAgICAgICAgICAgICAgICAgICAgIyBjb25zaWRlciB0aGUgdHlwaW5nIHN0b3BwZWQgYWx0b2dldGhlci5cbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbiAnc2V0dHlwaW5nJywgU1RPUFBFRFxuICAgICAgICAgICAgICAgICAgICAsIDYwMDBcbiAgICAgICAgICAgICAgICAsIDYwMDBcblxuICAgIHNldFNob3dDb252VGh1bWJzOiAoZG9zaG93KSAtPlxuICAgICAgICByZXR1cm4gaWYgQHNob3dDb252VGh1bWJzID09IGRvc2hvd1xuICAgICAgICBAc2hvd0NvbnZUaHVtYnMgPSBsb2NhbFN0b3JhZ2Uuc2hvd0NvbnZUaHVtYnMgPSBkb3Nob3dcbiAgICAgICAgdXBkYXRlZCAndmlld3N0YXRlJ1xuXG59XG5cbm1lcmdlIGV4cCwgU1RBVEVTXG4iXX0=