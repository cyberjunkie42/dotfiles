(function() {
  var addClass, attachListeners, attached, closest, drag, exp, noInputKeydown, onActivity, onScroll, ref, removeClass, resize, resizers, throttle, topof;

  ref = require('../util'), throttle = ref.throttle, topof = ref.topof;

  attached = false;

  attachListeners = function() {
    if (attached) {
      return;
    }
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('click', onActivity);
    window.addEventListener('keydown', onActivity);
    return window.addEventListener('keydown', noInputKeydown);
  };

  onActivity = throttle(100, function(ev) {
    var ref1;
    return action('activity', (ref1 = ev.timeStamp) != null ? ref1 : Date.now());
  });

  noInputKeydown = function(ev) {
    if (ev.target.tagName !== 'TEXTAREA') {
      return action('noinputkeydown', ev);
    }
  };

  onScroll = throttle(20, function(ev) {
    var atbottom, attop, child, el;
    el = ev.target;
    child = el.children[0];
    atbottom = (el.scrollTop + el.offsetHeight) >= (child.offsetHeight - 10);
    action('atbottom', atbottom);
    attop = el.scrollTop <= (el.offsetHeight / 2);
    return action('attop', attop);
  });

  addClass = function(el, cl) {
    if (!el) {
      return;
    }
    if (RegExp("\\s*" + cl).exec(el.className)) {
      return;
    }
    el.className += el.className ? " " + cl : cl;
    return el;
  };

  removeClass = function(el, cl) {
    if (!el) {
      return;
    }
    el.className = el.className.replace(RegExp("\\s*" + cl), '');
    return el;
  };

  closest = function(el, cl) {
    if (!el) {
      return;
    }
    if (!(cl instanceof RegExp)) {
      cl = RegExp("\\s*" + cl);
    }
    if (el.className.match(cl)) {
      return el;
    } else {
      return closest(el.parentNode, cl);
    }
  };

  drag = (function() {
    var ondragenter, ondragleave, ondragover, ondrop;
    ondragover = ondragenter = function(ev) {
      ev.preventDefault();
      addClass(closest(ev.target, 'dragtarget'), 'dragover');
      ev.dataTransfer.dropEffect = 'copy';
      return false;
    };
    ondrop = function(ev) {
      ev.preventDefault();
      return action('uploadimage', ev.dataTransfer.files);
    };
    ondragleave = function(ev) {
      return removeClass(closest(ev.target, 'dragtarget'), 'dragover');
    };
    return {
      ondragover: ondragover,
      ondragenter: ondragenter,
      ondrop: ondrop,
      ondragleave: ondragleave
    };
  })();

  resize = (function() {
    var rz;
    rz = null;
    return {
      onmousemove: function(ev) {
        if (rz && ev.buttons & 1) {
          return rz(ev);
        } else {
          return rz = null;
        }
      },
      onmousedown: function(ev) {
        var ref1;
        return rz = resizers[(ref1 = ev.target.dataset) != null ? ref1.resize : void 0];
      },
      onmouseup: function(ev) {
        return rz = null;
      }
    };
  })();

  resizers = {
    leftResize: function(ev) {
      return action('leftresize', Math.max(90, ev.clientX));
    }
  };

  module.exports = exp = layout(function() {
    div({
      "class": 'applayout dragtarget'
    }, drag, resize, function() {
      div({
        "class": 'left'
      }, function() {
        div({
          "class": 'list'
        }, region('left'));
        return div({
          "class": 'lfoot'
        }, region('lfoot'));
      });
      div({
        "class": 'leftresize',
        'data-resize': 'leftResize'
      });
      return div({
        "class": 'right'
      }, function() {
        div({
          "class": 'main'
        }, region('main'), {
          onscroll: onScroll
        });
        div({
          "class": 'maininfo'
        }, region('maininfo'));
        return div({
          "class": 'foot'
        }, region('foot'));
      });
    });
    return attachListeners();
  });

  (function() {
    var id, lastVisibleMessage, ofs;
    id = ofs = null;
    lastVisibleMessage = function() {
      var bottom, i, last, len, m, ref1, screl;
      screl = document.querySelector('.main');
      bottom = screl.scrollTop + screl.offsetHeight;
      last = null;
      ref1 = document.querySelectorAll('.message');
      for (i = 0, len = ref1.length; i < len; i++) {
        m = ref1[i];
        if (topof(m) < bottom) {
          last = m;
        }
      }
      return last;
    };
    exp.recordMainPos = function() {
      var el;
      el = lastVisibleMessage();
      id = el != null ? el.id : void 0;
      if (!(el && id)) {
        return;
      }
      return ofs = topof(el);
    };
    return exp.adjustMainPos = function() {
      var el, inserted, nofs, screl;
      if (!(id && ofs)) {
        return;
      }
      el = document.getElementById(id);
      nofs = topof(el);
      inserted = nofs - ofs;
      screl = document.querySelector('.main');
      screl.scrollTop = screl.scrollTop + inserted;
      return id = ofs = null;
    };
  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVpL3ZpZXdzL2FwcGxheW91dC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0E7QUFBQSxNQUFBOztFQUFBLE1BQW9CLE9BQUEsQ0FBUSxTQUFSLENBQXBCLEVBQUMsZUFBQSxRQUFELEVBQVcsWUFBQTs7RUFFWCxRQUFBLEdBQVc7O0VBQ1gsZUFBQSxHQUFrQixTQUFBO0lBQ2QsSUFBVSxRQUFWO0FBQUEsYUFBQTs7SUFDQSxNQUFNLENBQUMsZ0JBQVAsQ0FBd0IsV0FBeEIsRUFBcUMsVUFBckM7SUFDQSxNQUFNLENBQUMsZ0JBQVAsQ0FBd0IsT0FBeEIsRUFBaUMsVUFBakM7SUFDQSxNQUFNLENBQUMsZ0JBQVAsQ0FBd0IsU0FBeEIsRUFBbUMsVUFBbkM7V0FDQSxNQUFNLENBQUMsZ0JBQVAsQ0FBd0IsU0FBeEIsRUFBbUMsY0FBbkM7RUFMYzs7RUFPbEIsVUFBQSxHQUFhLFFBQUEsQ0FBUyxHQUFULEVBQWMsU0FBQyxFQUFEO0FBQ3ZCLFFBQUE7V0FBQSxNQUFBLENBQU8sVUFBUCx5Q0FBa0MsSUFBSSxDQUFDLEdBQUwsQ0FBQSxDQUFsQztFQUR1QixDQUFkOztFQUdiLGNBQUEsR0FBaUIsU0FBQyxFQUFEO0lBQ2IsSUFBK0IsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFWLEtBQXFCLFVBQXBEO2FBQUEsTUFBQSxDQUFPLGdCQUFQLEVBQXlCLEVBQXpCLEVBQUE7O0VBRGE7O0VBR2pCLFFBQUEsR0FBVyxRQUFBLENBQVMsRUFBVCxFQUFhLFNBQUMsRUFBRDtBQUNwQixRQUFBO0lBQUEsRUFBQSxHQUFLLEVBQUUsQ0FBQztJQUNSLEtBQUEsR0FBUSxFQUFFLENBQUMsUUFBUyxDQUFBLENBQUE7SUFHcEIsUUFBQSxHQUFXLENBQUMsRUFBRSxDQUFDLFNBQUgsR0FBZSxFQUFFLENBQUMsWUFBbkIsQ0FBQSxJQUFvQyxDQUFDLEtBQUssQ0FBQyxZQUFOLEdBQXFCLEVBQXRCO0lBQy9DLE1BQUEsQ0FBTyxVQUFQLEVBQW1CLFFBQW5CO0lBR0Es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QUVqQyxJQUFBLEdBQU87QUFDUDtBQUFBLFdBQUEsc0NBQUE7O1lBQTZELEtBQUEsQ0FBTSxDQUFOLENBQUEsR0FBVztVQUF4RSxJQUFBLEdBQU87O0FBQVA7QUFDQSxhQUFPO0lBUlU7SUFVckIsR0FBRyxDQUFDLGFBQUosR0FBb0IsU0FBQTtBQUNoQixVQUFBO01BQUEsRUFBQSxHQUFLLGtCQUFBLENBQUE7TUFDTCxFQUFBLGdCQUFLLEVBQUUsQ0FBRTtNQUNULElBQUEsQ0FBQSxDQUFjLEVBQUEsSUFBTyxFQUFyQixDQUFBO0FBQUEsZUFBQTs7YUFDQSxHQUFBLEdBQU0sS0FBQSxDQUFNLEVBQU47SUFKVTtXQU1wQixHQUFHLENBQUMsYUFBSixHQUFvQixTQUFBO0FBQ2hCLFVBQUE7TUFBQSxJQUFBLENBQUEsQ0FBYyxFQUFBLElBQU8sR0FBckIsQ0FBQTtBQUFBLGVBQUE7O01BQ0EsRUFBQSxHQUFLLFFBQVEsQ0FBQyxjQUFULENBQXdCLEVBQXhCO01BQ0wsSUFBQSxHQUFPLEtBQUEsQ0FBTSxFQUFOO01BRVAsUUFBQSxHQUFXLElBQUEsR0FBTztNQUNsQixLQUFBLEdBQVEsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsT0FBdkI7TUFDUixLQUFLLENBQUMsU0FBTixHQUFrQixLQUFLLENBQUMsU0FBTixHQUFrQjthQUVwQyxFQUFBLEdBQUssR0FBQSxHQUFNO0lBVEs7RUFuQnJCLENBQUEsQ0FBSCxDQUFBO0FBOUZBIiwiZmlsZSI6InVpL3ZpZXdzL2FwcGxheW91dC5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIlxue3Rocm90dGxlLCB0b3BvZn0gPSByZXF1aXJlICcuLi91dGlsJ1xuXG5hdHRhY2hlZCA9IGZhbHNlXG5hdHRhY2hMaXN0ZW5lcnMgPSAtPlxuICAgIHJldHVybiBpZiBhdHRhY2hlZFxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICdtb3VzZW1vdmUnLCBvbkFjdGl2aXR5XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgJ2NsaWNrJywgb25BY3Rpdml0eVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJywgb25BY3Rpdml0eVxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICdrZXlkb3duJywgbm9JbnB1dEtleWRvd25cblxub25BY3Rpdml0eSA9IHRocm90dGxlIDEwMCwgKGV2KSAtPlxuICAgIGFjdGlvbiAnYWN0aXZpdHknLCBldi50aW1lU3RhbXAgPyBEYXRlLm5vdygpXG5cbm5vSW5wdXRLZXlkb3duID0gKGV2KSAtPlxuICAgIGFjdGlvbiAnbm9pbnB1dGtleWRvd24nLCBldiBpZiBldi50YXJnZXQudGFnTmFtZSAhPSAnVEVYVEFSRUEnXG5cbm9uU2Nyb2xsID0gdGhyb3R0bGUgMjAsIChldikgLT5cbiAgICBlbCA9IGV2LnRhcmdldFxuICAgIGNoaWxkID0gZWwuY2hpbGRyZW5bMF1cblxuICAgICMgY2FsY3VsYXRpb24gdG8gc2VlIHdoZXRoZXIgd2UgYXJlIGF0IHRoZSBib3R0b20gd2l0aCBhIHRvbGVyYW5jZSB2YWx1ZVxuICAgIGF0Ym90dG9tID0gKGVsLnNjcm9sbFRvcCArIGVsLm9mZnNldEhlaWdodCkgPj0gKGNoaWxkLm9mZnNldEhlaWdodCAtIDEwKVxuICAgIGFjdGlvbiAnYXRib3R0b20nLCBhdGJvdHRvbVxuXG4gICAgIyBjaGVjayB3aGV0aGVyIHdlIGFyZSBhdCB0aGUgdG9wIHdpdGggYSB0b2xlcmFuY2UgdmFsdWVcbiAgICBhdHRvcCA9IGVsLnNjcm9sbFRvcCA8PSAoZWwub2Zmc2V0SGVpZ2h0IC8gMilcbiAgICBhY3Rpb24gJ2F0dG9wJywgYXR0b3BcblxuYWRkQ2xhc3MgPSAoZWwsIGNsKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxcbiAgICByZXR1cm4gaWYgUmVnRXhwKFwiXFxcXHMqI3tjbH1cIikuZXhlYyBlbC5jbGFzc05hbWVcbiAgICBlbC5jbGFzc05hbWUgKz0gaWYgZWwuY2xhc3NOYW1lIHRoZW4gXCIgI3tjbH1cIiBlbHNlIGNsXG4gICAgZWxcblxucmVtb3ZlQ2xhc3MgPSAoZWwsIGNsKSAtPlxuICAgIHJldHVybiB1bmxlc3MgZWxcbiAgICBlbC5jbGFzc05hbWUgPSBlbC5jbGFzc05hbWUucmVwbGFjZSBSZWdFeHAoXCJcXFxccyoje2NsfVwiKSwgJydcbiAgICBlbFxuXG5jbG9zZXN0ID0gKGVsLCBjbCkgLT5cbiAgICByZXR1cm4gdW5sZXNzIGVsXG4gICAgY2wgPSBSZWdFeHAoXCJcXFxccyoje2NsfVwiKSB1bmxlc3MgY2wgaW5zdGFuY2VvZiBSZWdFeHBcbiAgICBpZiBlbC5jbGFzc05hbWUubWF0Y2goY2wpIHRoZW4gZWwgZWxzZSBjbG9zZXN0KGVsLnBhcmVudE5vZGUsIGNsKVxuXG5kcmFnID0gZG8gLT5cblxuICAgIG9uZHJhZ292ZXIgPSBvbmRyYWdlbnRlciA9IChldikgLT5cbiAgICAgICAgIyB0aGlzIGVuYWJsZXMgZHJhZ2dpbmcgYXQgYWxsXG4gICAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgYWRkQ2xhc3MgY2xvc2VzdChldi50YXJnZXQsICdkcmFndGFyZ2V0JyksICdkcmFnb3ZlcidcbiAgICAgICAgZXYuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnY29weSdcbiAgICAgICAgcmV0dXJuIGZhbHNlXG5cbiAgICBvbmRyb3AgPSAoZXYpIC0+XG4gICAgICAgIGV2LnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgYWN0aW9uICd1cGxvYWRpbWFnZScsIGV2LmRhdGFUcmFuc2Zlci5maWxlc1xuXG4gICAgb25kcmFnbGVhdmUgPSAoZXYpIC0+XG4gICAgICAgIHJlbW92ZUNsYXNzIGNsb3Nlc3QoZXYudGFyZ2V0LCAnZHJhZ3RhcmdldCcpLCAnZHJhZ292ZXInXG5cbiAgICB7b25kcmFnb3Zlciwgb25kcmFnZW50ZXIsIG9uZHJvcCwgb25kcmFnbGVhdmV9XG5cblxucmVzaXplID0gZG8gLT5cbiAgICByeiA9IG51bGxcbiAgICB7XG4gICAgICAgIG9ubW91c2Vtb3ZlOiAoZXYpIC0+XG4gICAgICAgICAgICBpZiByeiBhbmQgZXYuYnV0dG9ucyAmIDFcbiAgICAgICAgICAgICAgICByeihldilcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICByeiA9IG51bGxcbiAgICAgICAgb25tb3VzZWRvd246IChldikgLT5cbiAgICAgICAgICAgIHJ6ID0gcmVzaXplcnNbZXYudGFyZ2V0LmRhdGFzZXQ/LnJlc2l6ZV1cbiAgICAgICAgb25tb3VzZXVwOiAoZXYpIC0+XG4gICAgICAgICAgICByeiA9IG51bGxcbiAgICB9XG5cbnJlc2l6ZXJzID1cbiAgICBsZWZ0UmVzaXplOiAoZXYpIC0+IGFjdGlvbiAnbGVmdHJlc2l6ZScsIChNYXRoLm1heCA5MCwgZXYuY2xpZW50WClcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGV4cCA9IGxheW91dCAtPlxuICAgIGRpdiBjbGFzczonYXBwbGF5b3V0IGRyYWd0YXJnZXQnLCBkcmFnLCByZXNpemUsIC0+XG4gICAgICAgIGRpdiBjbGFzczonbGVmdCcsIC0+XG4gICAgICAgICAgICBkaXYgY2xhc3M6J2xpc3QnLCByZWdpb24oJ2xlZnQnKVxuICAgICAgICAgICAgZGl2IGNsYXNzOidsZm9vdCcsIHJlZ2lvbignbGZvb3QnKVxuICAgICAgICBkaXYgY2xhc3M6J2xlZnRyZXNpemUnLCAnZGF0YS1yZXNpemUnOidsZWZ0UmVzaXplJ1xuICAgICAgICBkaXYgY2xhc3M6J3JpZ2h0JywgLT5cbiAgICAgICAgICAgIGRpdiBjbGFzczonbWFpbicsIHJlZ2lvbignbWFpbicpLCBvbnNjcm9sbDogb25TY3JvbGxcbiAgICAgICAgICAgIGRpdiBjbGFzczonbWFpbmluZm8nLCByZWdpb24oJ21haW5pbmZvJylcbiAgICAgICAgICAgIGRpdiBjbGFzczonZm9vdCcsIHJlZ2lvbignZm9vdCcpXG4gICAgYXR0YWNoTGlzdGVuZXJzKClcblxuXG5kbyAtPlxuICAgIGlkID0gb2ZzID0gbnVsbFxuXG4gICAgbGFzdFZpc2libGVNZXNzYWdlID0gLT5cbiAgICAgICAgIyB0aGUgdmlld3BvcnRcbiAgICAgICAgc2NyZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubWFpbicpXG4gICAgICAgICMgdGhlIHBpeGVsIG9mZnNldCBmb3IgdGhlIGJvdHRvbSBvZiB0aGUgdmlld3BvcnRcbiAgICAgICAgYm90dG9tID0gc2NyZWwuc2Nyb2xsVG9wICsgc2NyZWwub2Zmc2V0SGVpZ2h0XG4gICAgICAgICMgYWxsIG1lc3NhZ2VzXG4gICAgICAgIGxhc3QgPSBudWxsXG4gICAgICAgIGxhc3QgPSBtIGZvciBtIGluIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tZXNzYWdlJykgd2hlbiB0b3BvZihtKSA8IGJvdHRvbVxuICAgICAgICByZXR1cm4gbGFzdFxuXG4gICAgZXhwLnJlY29yZE1haW5Qb3MgPSAtPlxuICAgICAgICBlbCA9IGxhc3RWaXNpYmxlTWVzc2FnZSgpXG4gICAgICAgIGlkID0gZWw/LmlkXG4gICAgICAgIHJldHVybiB1bmxlc3MgZWwgYW5kIGlkXG4gICAgICAgIG9mcyA9IHRvcG9mIGVsXG5cbiAgICBleHAuYWRqdXN0TWFpblBvcyA9IC0+XG4gICAgICAgIHJldHVybiB1bmxlc3MgaWQgYW5kIG9mc1xuICAgICAgICBlbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkIGlkXG4gICAgICAgIG5vZnMgPSB0b3BvZiBlbFxuICAgICAgICAjIHRoZSBzaXplIG9mIHRoZSBpbnNlcnRlZCBlbGVtZW50c1xuICAgICAgICBpbnNlcnRlZCA9IG5vZnMgLSBvZnNcbiAgICAgICAgc2NyZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubWFpbicpXG4gICAgICAgIHNjcmVsLnNjcm9sbFRvcCA9IHNjcmVsLnNjcm9sbFRvcCArIGluc2VydGVkXG4gICAgICAgICMgcmVzZXRcbiAgICAgICAgaWQgPSBvZnMgPSBudWxsXG4iXX0=