(function() {
  var applayout, conv, dispatcher, ipc, ref, ref1, trifl, viewstate,
    slice = [].slice;

  ipc = require('ipc');

  trifl = require('trifl');

  trifl.expose(window);

  window.notr = require('notr');

  notr.defineStack('def', 'body', {
    top: '3px',
    right: '15px'
  });

  dispatcher = require('./dispatcher');

  (ref = trifl.tagg).expose.apply(ref, [window].concat(slice.call('ul li div span a i b u s button p label input table thead tbody tr td th textarea br pass img h1 h2 h3 h4 hr'.split(' '))));

  applayout = require('./views').applayout;

  ref1 = require('./models'), viewstate = ref1.viewstate, conv = ref1.conv;

  require('./views/menu')(viewstate);

  document.body.appendChild(applayout.el);

  (function() {
    var ipcon;
    ipcon = ipc.on.bind(ipc);
    return ipc.on = function(n, fn) {
      return ipcon(n, function() {
        var as;
        as = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        action('alive', Date.now());
        return fn.apply(null, as);
      });
    };
  })();

  ipc.on('init', function(e) {
    return dispatcher.init(e);
  });

  require('./events').forEach(function(n) {
    return ipc.on(n, function(e) {
      return action(n, e);
    });
  });

  ipc.on('getentity:result', function(r, data) {
    return action('addentities', r.entities, data != null ? data.add_to_conv : void 0);
  });

  ipc.on('resize', function(dim) {
    return action('resize', dim);
  });

  ipc.on('moved', function(pos) {
    return action('moved', pos);
  });

  ipc.on('searchentities:result', function(r) {
    return action('setsearchedentities', r.entity);
  });

  ipc.on('createconversation:result', function(c, name) {
    c.conversation_id = c.id;
    if (name) {
      c.name = name;
    }
    action('createconversationdone', c);
    return action('setstate', viewstate.STATE_NORMAL);
  });

  ipc.on('syncallnewevents:response', function(r) {
    return action('handlesyncedevents', r);
  });

  ipc.on('syncrecentconversations:response', function(r) {
    return action('handlerecentconversations', r);
  });

  ipc.on('getconversation:response', function(r) {
    return action('handlehistory', r);
  });

  ipc.on('uploadingimage', function(spec) {
    return action('uploadingimage', spec);
  });

  require('./dispatcher');

  require('./views/controller');

  action('reqinit');

  window.addEventListener('online', function() {
    return action('wonline', true);
  });

  window.addEventListener('offline', function() {
    return action('wonline', false);
  });

  action('wonline', window.navigator.onLine);

}).call(this);

//# sourceMappingURL=data:application/json;base64,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RUFKZ0MsQ0FBcEM7O0VBS0EsR0FBRyxDQUFDLEVBQUosQ0FBTywyQkFBUCxFQUFvQyxTQUFDLENBQUQ7V0FBTyxNQUFBLENBQU8sb0JBQVAsRUFBNkIsQ0FBN0I7RUFBUCxDQUFwQzs7RUFDQSxHQUFHLENBQUMsRUFBSixDQUFPLGtDQUFQLEVBQTJDLFNBQUMsQ0FBRDtXQUFPLE1BQUEsQ0FBTywyQkFBUCxFQUFvQyxDQUFwQztFQUFQLENBQTNDOztFQUNBLEdBQUcsQ0FBQyxFQUFKLENBQU8sMEJBQVAsRUFBbUMsU0FBQyxDQUFEO1dBQU8sTUFBQSxDQUFPLGVBQVAsRUFBd0IsQ0FBeEI7RUFBUCxDQUFuQzs7RUFDQSxHQUFHLENBQUMsRUFBSixDQUFPLGdCQUFQLEVBQXlCLFNBQUMsSUFBRDtXQUFVLE1BQUEsQ0FBTyxnQkFBUCxFQUF5QixJQUF6QjtFQUFWLENBQXpCOztFQUdBLE9BQUEsQ0FBUSxjQUFSOztFQUNBLE9BQUEsQ0FBUSxvQkFBUjs7RUFLQSxNQUFBLENBQU8sU0FBUDs7RUFHQSxNQUFNLENBQUMsZ0JBQVAsQ0FBd0IsUUFBeEIsRUFBbUMsU0FBQTtXQUFHLE1BQUEsQ0FBTyxTQUFQLEVBQWtCLElBQWxCO0VBQUgsQ0FBbkM7O0VBQ0EsTUFBTSxDQUFDLGdCQUFQLENBQXdCLFNBQXhCLEVBQW1DLFNBQUE7V0FBRyxNQUFBLENBQU8sU0FBUCxFQUFrQixLQUFsQjtFQUFILENBQW5DOztFQUVBLE1BQUEsQ0FBTyxTQUFQLEVBQWtCLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBbkM7QUF4RUEiLCJmaWxlIjoidWkvYXBwLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiaXBjID0gcmVxdWlyZSAnaXBjJ1xuXG4jIGV4cG9zZSB0cmlmbCBpbiBnbG9iYWwgc2NvcGVcbnRyaWZsID0gcmVxdWlyZSAndHJpZmwnXG50cmlmbC5leHBvc2Ugd2luZG93XG5cbiMgaW4gYXBwIG5vdGlmaWNhdGlvbiBzeXN0ZW1cbndpbmRvdy5ub3RyID0gcmVxdWlyZSAnbm90cidcbm5vdHIuZGVmaW5lU3RhY2sgJ2RlZicsICdib2R5Jywge3RvcDonM3B4JywgcmlnaHQ6JzE1cHgnfVxuXG4jIGluaXQgdHJpZmwgZGlzcGF0Y2hlclxuZGlzcGF0Y2hlciA9IHJlcXVpcmUgJy4vZGlzcGF0Y2hlcidcblxuIyBleHBvc2Ugc29tZSBzZWxlY3RlZCB0YWdnIGZ1bmN0aW9uc1xudHJpZmwudGFnZy5leHBvc2Ugd2luZG93LCAoJ3VsIGxpIGRpdiBzcGFuIGEgaSBiIHUgcyBidXR0b24gcCBsYWJlbFxuaW5wdXQgdGFibGUgdGhlYWQgdGJvZHkgdHIgdGQgdGggdGV4dGFyZWEgYnIgcGFzcyBpbWcgaDEgaDIgaDMgaDRcbmhyJy5zcGxpdCgnICcpKS4uLlxuXG57YXBwbGF5b3V0fSAgICAgICA9IHJlcXVpcmUgJy4vdmlld3MnXG57dmlld3N0YXRlLCBjb252fSA9IHJlcXVpcmUgJy4vbW9kZWxzJ1xuXG4jIGluc3RhbGwgbWVudVxucmVxdWlyZSgnLi92aWV3cy9tZW51Jykodmlld3N0YXRlKVxuXG4jIHRpZSBsYXlvdXQgdG8gRE9NXG5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkIGFwcGxheW91dC5lbFxuXG4jIGludGVyY2VwdCBldmVyeSBldmVudCB3ZSBsaXN0ZW4gdG9cbiMgdG8gbWFrZSBhbiAnYWxpdmUnIGFjdGlvbiB0byBrbm93XG4jIHRoZSBzZXJ2ZXIgaXMgYWxpdmVcbmRvIC0+XG4gICAgaXBjb24gPSBpcGMub24uYmluZChpcGMpXG4gICAgaXBjLm9uID0gKG4sIGZuKSAtPlxuICAgICAgICBpcGNvbiBuLCAoYXMuLi4pIC0+XG4gICAgICAgICAgICBhY3Rpb24gJ2FsaXZlJywgRGF0ZS5ub3coKVxuICAgICAgICAgICAgZm4gYXMuLi5cblxuIyB3aXJlIHVwIHN0dWZmIGZyb20gc2VydmVyXG5pcGMub24gJ2luaXQnLCAoZSkgLT4gZGlzcGF0Y2hlci5pbml0IGVcbiMgZXZlbnRzIGZyb20gaGFuZ3Vwc2pzXG5yZXF1aXJlKCcuL2V2ZW50cycpLmZvckVhY2ggKG4pIC0+IGlwYy5vbiBuLCAoZSkgLT4gYWN0aW9uIG4sIGVcbiMgcmVzcG9uc2UgZnJvbSBnZXRlbnRpdHlcbmlwYy5vbiAnZ2V0ZW50aXR5OnJlc3VsdCcsIChyLCBkYXRhKSAtPlxuICAgIGFjdGlvbiAnYWRkZW50aXRpZXMnLCByLmVudGl0aWVzLCBkYXRhPy5hZGRfdG9fY29udlxuXG5pcGMub24gJ3Jlc2l6ZScsIChkaW0pIC0+IGFjdGlvbiAncmVzaXplJywgZGltXG5pcGMub24gJ21vdmVkJywgKHBvcykgIC0+IGFjdGlvbiAnbW92ZWQnLCBwb3NcbmlwYy5vbiAnc2VhcmNoZW50aXRpZXM6cmVzdWx0JywgKHIpIC0+XG4gIGFjdGlvbiAnc2V0c2VhcmNoZWRlbnRpdGllcycsIHIuZW50aXR5XG5pcGMub24gJ2NyZWF0ZWNvbnZlcnNhdGlvbjpyZXN1bHQnLCAoYywgbmFtZSkgLT5cbiAgICBjLmNvbnZlcnNhdGlvbl9pZCA9IGMuaWQgI8KgZml4IGNvbnZlcnNhdGlvbiBwYXlsb2FkXG4gICAgYy5uYW1lID0gbmFtZSBpZiBuYW1lXG4gICAgYWN0aW9uICdjcmVhdGVjb252ZXJzYXRpb25kb25lJywgY1xuICAgIGFjdGlvbiAnc2V0c3RhdGUnLCB2aWV3c3RhdGUuU1RBVEVfTk9STUFMXG5pcGMub24gJ3N5bmNhbGxuZXdldmVudHM6cmVzcG9uc2UnLCAocikgLT4gYWN0aW9uICdoYW5kbGVzeW5jZWRldmVudHMnLCByXG5pcGMub24gJ3N5bmNyZWNlbnRjb252ZXJzYXRpb25zOnJlc3BvbnNlJywgKHIpIC0+IGFjdGlvbiAnaGFuZGxlcmVjZW50Y29udmVyc2F0aW9ucycsIHJcbmlwYy5vbiAnZ2V0Y29udmVyc2F0aW9uOnJlc3BvbnNlJywgKHIpIC0+IGFjdGlvbiAnaGFuZGxlaGlzdG9yeScsIHJcbmlwYy5vbiAndXBsb2FkaW5naW1hZ2UnLCAoc3BlYykgLT4gYWN0aW9uICd1cGxvYWRpbmdpbWFnZScsIHNwZWNcblxuIyBpbml0IGRpc3BhdGNoZXIvY29udHJvbGxlclxucmVxdWlyZSAnLi9kaXNwYXRjaGVyJ1xucmVxdWlyZSAnLi92aWV3cy9jb250cm9sbGVyJ1xuXG4jIHJlcXVlc3QgaW5pdCB0aGlzIGlzIG5vdCBoYXBwZW5pbmcgd2hlblxuIyB0aGUgc2VydmVyIGlzIGp1c3QgY29ubmVjdGluZywgYnV0IGZvclxuIyBkZXYgbW9kZSB3aGVuIHdlIHJlbG9hZCB0aGUgcGFnZVxuYWN0aW9uICdyZXFpbml0J1xuXG4jIHJlZ2lzdGVyIGV2ZW50IGxpc3RlbmVycyBmb3Igb24vb2ZmbGluZVxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIgJ29ubGluZScsICAtPiBhY3Rpb24gJ3dvbmxpbmUnLCB0cnVlXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciAnb2ZmbGluZScsIC0+IGFjdGlvbiAnd29ubGluZScsIGZhbHNlXG4jIHRlbGwgdGhlIHN0YXJ0dXAgc3RhdGVcbmFjdGlvbiAnd29ubGluZScsIHdpbmRvdy5uYXZpZ2F0b3Iub25MaW5lXG4iXX0=