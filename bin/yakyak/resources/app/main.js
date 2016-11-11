(function() {
  var BrowserWindow, Client, Q, app, client, clipboard, fs, ipc, loadAppWindow, login, logout, mainWindow, path, paths, plug, seqreq, tmp, wait,
    slice = [].slice;

  Client = require('hangupsjs');

  Q = require('q');

  login = require('./login');

  ipc = require('ipc');

  fs = require('fs');

  path = require('path');

  tmp = require('tmp');

  clipboard = require('clipboard');

  tmp.setGracefulCleanup();

  app = require('app');

  BrowserWindow = require('browser-window');

  paths = {
    rtokenpath: path.normalize(path.join(app.getPath('userData'), 'refreshtoken.txt')),
    cookiespath: path.normalize(path.join(app.getPath('userData'), 'cookies.json')),
    chromecookie: path.normalize(path.join(app.getPath('userData'), 'Cookies'))
  };

  client = new Client({
    rtokenpath: paths.rtokenpath,
    cookiespath: paths.cookiespath
  });

  if (fs.existsSync(paths.chromecookie)) {
    fs.unlinkSync(paths.chromecookie);
  }

  plug = function(rs, rj) {
    return function(err, val) {
      if (err) {
        return rj(err);
      } else {
        return rs(val);
      }
    };
  };

  logout = function() {
    var promise;
    promise = client.logout();
    promise.then(function(res) {
      var argv, spawn;
      argv = process.argv;
      spawn = require('child_process').spawn;
      spawn(argv.shift(), argv, {
        cwd: process.cwd,
        env: process.env,
        stdio: 'inherit'
      });
      return app.quit();
    });
    return promise;
  };

  seqreq = require('./seqreq');

  mainWindow = null;

  app.on('window-all-closed', function() {
    return app.quit();
  });

  loadAppWindow = function() {
    return mainWindow.loadUrl('file://' + __dirname + '/ui/index.html');
  };

  wait = function(t) {
    return Q.Promise(function(rs) {
      return setTimeout(rs, t);
    });
  };

  app.on('ready', function() {
    var creds, ipcsend, proxycheck, reconnect, reconnectCount, sendInit, syncrecent;
    proxycheck = function() {
      var todo;
      todo = [
        {
          url: 'http://plus.google.com',
          env: 'HTTP_PROXY'
        }, {
          url: 'https://plus.google.com',
          env: 'HTTPS_PROXY'
        }
      ];
      return Q.all(todo.map(function(t) {
        return Q.Promise(function(rs) {
          return app.resolveProxy(t.url, function(proxyURL) {
            var _, base, name1, purl, ref;
            ref = proxyURL.split(' '), _ = ref[0], purl = ref[1];
            if ((base = process.env)[name1 = t.env] == null) {
              base[name1] = purl ? "http://" + purl : "";
            }
            return rs();
          });
        });
      }));
    };
    mainWindow = new BrowserWindow({
      width: 730,
      height: 590,
      "min-width": 620,
      "min-height": 420,
      icon: path.join(__dirname, 'icons', 'icon.png')
    });
    loadAppWindow();
    ipcsend = function() {
      var as, ref;
      as = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return (ref = mainWindow.webContents).send.apply(ref, as);
    };
    creds = function() {
      var prom;
      prom = login(mainWindow);
      prom.then(function() {
        return loadAppWindow();
      });
      return {
        auth: function() {
          return prom;
        }
      };
    };
    sendInit = function() {
      var ref;
      if (!(client != null ? (ref = client.init) != null ? ref.self_entity : void 0 : void 0)) {
        return false;
      }
      ipcsend('init', {
        init: client.init
      });
      return true;
    };
    reconnect = function() {
      return proxycheck().then(function() {
        return client.connect(creds);
      });
    };
    reconnectCount = 0;
    ipc.on('hangupsConnect', function() {
      console.log('hconnect');
      return reconnect().then(function() {
        console.log('connected', reconnectCount);
        if (reconnectCount === 0) {
          sendInit();
        } else {
          syncrecent();
        }
        return reconnectCount++;
      });
    });
    ipc.on('hangupsDisconnect', function() {
      console.log('hdisconnect');
      reconnectCount = 0;
      return client.disconnect();
    });
    mainWindow.on('resize', function(ev) {
      return ipcsend('resize', mainWindow.getSize());
    });
    mainWindow.on('moved', function(ev) {
      return ipcsend('moved', mainWindow.getPosition());
    });
    client.on('connect_failed', function() {
      console.log('connect_failed');
      return wait(3000).then(function() {
        return reconnect();
      });
    });
    ipc.on('reqinit', function() {
      if (sendInit()) {
        return syncrecent();
      }
    });
    ipc.on('sendchatmessage', seqreq(function(ev, msg) {
      var client_generated_id, conv_id, image_id, otr, segs;
      conv_id = msg.conv_id, segs = msg.segs, client_generated_id = msg.client_generated_id, image_id = msg.image_id, otr = msg.otr;
      return client.sendchatmessage(conv_id, segs, image_id, otr, client_generated_id).then(function(r) {
        return ipcsend('sendchatmessage:result', r);
      }, true);
    }));
    ipc.on('setpresence', seqreq(function() {
      return client.setpresence(true);
    }, false, function() {
      return 1;
    }));
    ipc.on('setactiveclient', seqreq(function(ev, active, secs) {
      return client.setactiveclient(active, secs);
    }, false, function() {
      return 1;
    }));
    ipc.on('updatewatermark', seqreq(function(ev, conv_id, time) {
      return client.updatewatermark(conv_id, time);
    }, true, function(ev, conv_id, time) {
      return conv_id;
    }));
    ipc.on('uploadimage', seqreq(function(ev, spec) {
      var client_generated_id, conv_id;
      path = spec.path, conv_id = spec.conv_id, client_generated_id = spec.client_generated_id;
      ipcsend('uploadingimage', {
        conv_id: conv_id,
        client_generated_id: client_generated_id,
        path: path
      });
      return client.uploadimage(path).then(function(image_id) {
        return client.sendchatmessage(conv_id, null, image_id, null, client_generated_id);
      });
    }, true));
    ipc.on('uploadclipboardimage', seqreq(function(ev, spec) {
      var client_generated_id, conv_id, file, pngData;
      conv_id = spec.conv_id, client_generated_id = spec.client_generated_id;
      file = tmp.fileSync({
        postfix: ".png"
      });
      pngData = clipboard.readImage().toPng();
      ipcsend('uploadingimage', {
        conv_id: conv_id,
        client_generated_id: client_generated_id,
        path: file.name
      });
      return Q.Promise(function(rs, rj) {
        return fs.writeFile(file.name, pngData, plug(rs, rj));
      }).then(function() {
        return client.uploadimage(file.name);
      }).then(function(image_id) {
        return client.sendchatmessage(conv_id, null, image_id, null, client_generated_id);
      }).then(function() {
        return file.removeCallback();
      });
    }, true));
    ipc.on('setconversationnotificationlevel', seqreq(function(ev, conv_id, level) {
      return client.setconversationnotificationlevel(conv_id, level);
    }, true, function(ev, conv_id, level) {
      return conv_id;
    }));
    ipc.on('deleteconversation', seqreq(function(ev, conv_id) {
      return client.deleteconversation(conv_id);
    }, true));
    ipc.on('removeuser', seqreq(function(ev, conv_id) {
      return client.removeuser(conv_id);
    }, true));
    ipc.on('setfocus', seqreq(function(ev, conv_id) {
      return client.setfocus(conv_id);
    }, false, function(ev, conv_id) {
      return conv_id;
    }));
    ipc.on('appfocus', function() {
      return app.focus();
    });
    ipc.on('settyping', seqreq(function(ev, conv_id, v) {
      return client.settyping(conv_id, v);
    }, false, function(ev, conv_id) {
      return conv_id;
    }));
    ipc.on('updatebadge', function(ev, value) {
      if (app.dock) {
        return app.dock.setBadge(value);
      }
    });
    ipc.on('searchentities', function(ev, query, max_results) {
      var promise;
      promise = client.searchentities(query, max_results);
      return promise.then(function(res) {
        return ipcsend('searchentities:result', res);
      });
    });
    ipc.on('createconversation', function(ev, ids, name, forcegroup) {
      var conv, promise;
      if (forcegroup == null) {
        forcegroup = false;
      }
      promise = client.createconversation(ids, forcegroup);
      conv = null;
      promise.then(function(res) {
        var conv_id;
        conv = res.conversation;
        conv_id = conv.id.id;
        if (name) {
          return client.renameconversation(conv_id, name);
        }
      });
      return promise = promise.then(function(res) {
        return ipcsend('createconversation:result', conv, name);
      });
    });
    ipc.on('adduser', function(ev, conv_id, toadd) {
      return client.adduser(conv_id, toadd);
    });
    ipc.on('renameconversation', function(ev, conv_id, newname) {
      return client.renameconversation(conv_id, newname);
    });
    ipc.on('getentity', seqreq(function(ev, ids, data) {
      return client.getentitybyid(ids).then(function(r) {
        return ipcsend('getentity:result', r, data);
      });
    }, false, function(ev, ids) {
      return ids.sort().join(',');
    }));
    ipc.on('syncallnewevents', seqreq(function(ev, time) {
      console.log('syncallnew');
      return client.syncallnewevents(time).then(function(r) {
        return ipcsend('syncallnewevents:response', r);
      });
    }, false, function(ev, time) {
      return 1;
    }));
    ipc.on('syncrecentconversations', syncrecent = seqreq(function(ev) {
      console.log('syncrecent');
      return client.syncrecentconversations().then(function(r) {
        ipcsend('syncrecentconversations:response', r);
        return ipcsend('connected');
      });
    }, false, function(ev, time) {
      return 1;
    }));
    ipc.on('getconversation', seqreq(function(ev, conv_id, timestamp, max) {
      return client.getconversation(conv_id, timestamp, max).then(function(r) {
        return ipcsend('getconversation:response', r);
      });
    }, false, function(ev, conv_id, timestamp, max) {
      return conv_id;
    }));
    ipc.on('togglefullscreen', function() {
      return mainWindow.setFullScreen(!mainWindow.isFullScreen());
    });
    ipc.on('logout', logout);
    require('./ui/events').forEach(function(n) {
      return client.on(n, function(e) {
        return ipcsend(n, e);
      });
    });
    return mainWindow.on('closed', function() {
      return mainWindow = null;
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,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LENBQVEsMEJBQVIsRUFBb0MsQ0FBcEM7TUFEaUQsQ0FBckQ7SUFENkIsQ0FBUCxFQUd4QixLQUh3QixFQUdqQixTQUFDLEVBQUQsRUFBSyxPQUFMLEVBQWMsU0FBZCxFQUF5QixHQUF6QjthQUFpQztJQUFqQyxDQUhpQixDQUExQjtJQUtBLEdBQUcsQ0FBQyxFQUFKLENBQU8sa0JBQVAsRUFBMkIsU0FBQTthQUN6QixVQUFVLENBQUMsYUFBWCxDQUF5QixDQUFJLFVBQVUsQ0FBQyxZQUFYLENBQUEsQ0FBN0I7SUFEeUIsQ0FBM0I7SUFJQSxHQUFHLENBQUMsRUFBSixDQUFPLFFBQVAsRUFBaUIsTUFBakI7SUFHQSxPQUFBLENBQVEsYUFBUixDQUFzQixDQUFDLE9BQXZCLENBQStCLFNBQUMsQ0FBRDthQUMzQixNQUFNLENBQUMsRUFBUCxDQUFVLENBQVYsRUFBYSxTQUFDLENBQUQ7ZUFDVCxPQUFBLENBQVEsQ0FBUixFQUFXLENBQVg7TUFEUyxDQUFiO0lBRDJCLENBQS9CO1dBTUEsVUFBVSxDQUFDLEVBQVgsQ0FBYyxRQUFkLEVBQXdCLFNBQUE7YUFDcEIsVUFBQSxHQUFhO0lBRE8sQ0FBeEI7RUFsT1ksQ0FBaEI7QUF2REEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIkNsaWVudCAgICA9IHJlcXVpcmUgJ2hhbmd1cHNqcydcblEgICAgICAgICA9IHJlcXVpcmUgJ3EnXG5sb2dpbiAgICAgPSByZXF1aXJlICcuL2xvZ2luJ1xuaXBjICAgICAgID0gcmVxdWlyZSAnaXBjJ1xuZnMgICAgICAgID0gcmVxdWlyZSAnZnMnXG5wYXRoICAgICAgPSByZXF1aXJlICdwYXRoJ1xudG1wICAgICAgID0gcmVxdWlyZSAndG1wJ1xuY2xpcGJvYXJkID0gcmVxdWlyZSAnY2xpcGJvYXJkJ1xuXG50bXAuc2V0R3JhY2VmdWxDbGVhbnVwKClcblxuYXBwID0gcmVxdWlyZSAnYXBwJ1xuXG5Ccm93c2VyV2luZG93ID0gcmVxdWlyZSAnYnJvd3Nlci13aW5kb3cnXG5cbnBhdGhzID1cbiAgICBydG9rZW5wYXRoOiAgcGF0aC5ub3JtYWxpemUgcGF0aC5qb2luIGFwcC5nZXRQYXRoKCd1c2VyRGF0YScpLCAncmVmcmVzaHRva2VuLnR4dCdcbiAgICBjb29raWVzcGF0aDogcGF0aC5ub3JtYWxpemUgcGF0aC5qb2luIGFwcC5nZXRQYXRoKCd1c2VyRGF0YScpLCAnY29va2llcy5qc29uJ1xuICAgIGNocm9tZWNvb2tpZTogcGF0aC5ub3JtYWxpemUgcGF0aC5qb2luIGFwcC5nZXRQYXRoKCd1c2VyRGF0YScpLCAnQ29va2llcydcblxuY2xpZW50ID0gbmV3IENsaWVudFxuICAgIHJ0b2tlbnBhdGg6ICBwYXRocy5ydG9rZW5wYXRoXG4gICAgY29va2llc3BhdGg6IHBhdGhzLmNvb2tpZXNwYXRoXG5cbmlmIGZzLmV4aXN0c1N5bmMgcGF0aHMuY2hyb21lY29va2llXG4gICAgZnMudW5saW5rU3luYyBwYXRocy5jaHJvbWVjb29raWVcblxucGx1ZyA9IChycywgcmopIC0+IChlcnIsIHZhbCkgLT4gaWYgZXJyIHRoZW4gcmooZXJyKSBlbHNlIHJzKHZhbClcblxubG9nb3V0ID0gLT5cbiAgICBwcm9taXNlID0gY2xpZW50LmxvZ291dCgpXG4gICAgcHJvbWlzZS50aGVuIChyZXMpIC0+XG4gICAgICBhcmd2ID0gcHJvY2Vzcy5hcmd2XG4gICAgICBzcGF3biA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKS5zcGF3blxuICAgICAgc3Bhd24gYXJndi5zaGlmdCgpLCBhcmd2LFxuICAgICAgICBjd2Q6IHByb2Nlc3MuY3dkXG4gICAgICAgIGVudjogcHJvY2Vzcy5lbnZcbiAgICAgICAgc3RkaW86ICdpbmhlcml0J1xuICAgICAgYXBwLnF1aXQoKVxuICAgIHJldHVybiBwcm9taXNlICMgbGlrZSBpdCBtYXR0ZXJzXG5cbnNlcXJlcSA9IHJlcXVpcmUgJy4vc2VxcmVxJ1xuXG5tYWluV2luZG93ID0gbnVsbFxuXG4jIFF1aXQgd2hlbiBhbGwgd2luZG93cyBhcmUgY2xvc2VkLlxuYXBwLm9uICd3aW5kb3ctYWxsLWNsb3NlZCcsIC0+XG4gICAgYXBwLnF1aXQoKSAjIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9ICdkYXJ3aW4nKVxuXG5sb2FkQXBwV2luZG93ID0gLT5cbiAgICBtYWluV2luZG93LmxvYWRVcmwgJ2ZpbGU6Ly8nICsgX19kaXJuYW1lICsgJy91aS9pbmRleC5odG1sJ1xuXG4jIGhlbHBlciB3YWl0IHByb21pc2VcbndhaXQgPSAodCkgLT4gUS5Qcm9taXNlIChycykgLT4gc2V0VGltZW91dCBycywgdFxuXG5hcHAub24gJ3JlYWR5JywgLT5cblxuICAgIHByb3h5Y2hlY2sgPSAtPlxuICAgICAgICB0b2RvID0gW1xuICAgICAgICAgICB7dXJsOidodHRwOi8vcGx1cy5nb29nbGUuY29tJywgIGVudjonSFRUUF9QUk9YWSd9XG4gICAgICAgICAgIHt1cmw6J2h0dHBzOi8vcGx1cy5nb29nbGUuY29tJywgZW52OidIVFRQU19QUk9YWSd9XG4gICAgICAgIF1cbiAgICAgICAgUS5hbGwgdG9kby5tYXAgKHQpIC0+IFEuUHJvbWlzZSAocnMpIC0+IGFwcC5yZXNvbHZlUHJveHkgdC51cmwsIChwcm94eVVSTCkgLT5cbiAgICAgICAgICAgICMgRm9ybWF0IG9mIHByb3h5VVJMIGlzIGVpdGhlciBcIkRJUkVDVFwiIG9yIFwiUFJPWFkgMTI3LjAuMC4xOjg4ODhcIlxuICAgICAgICAgICAgW18sIHB1cmxdID0gcHJveHlVUkwuc3BsaXQgJyAnXG4gICAgICAgICAgICBwcm9jZXNzLmVudlt0LmVudl0gPz0gaWYgcHVybCB0aGVuIFwiaHR0cDovLyN7cHVybH1cIiBlbHNlIFwiXCJcbiAgICAgICAgICAgIHJzKClcblxuICAgICMgQ3JlYXRlIHRoZSBicm93c2VyIHdpbmRvdy5cbiAgICBtYWluV2luZG93ID0gbmV3IEJyb3dzZXJXaW5kb3cge1xuICAgICAgICB3aWR0aDogNzMwXG4gICAgICAgIGhlaWdodDogNTkwXG4gICAgICAgIFwibWluLXdpZHRoXCI6IDYyMFxuICAgICAgICBcIm1pbi1oZWlnaHRcIjogNDIwXG4gICAgICAgIGljb246IHBhdGguam9pbiBfX2Rpcm5hbWUsICdpY29ucycsICdpY29uLnBuZydcbiAgICB9XG5cbiAgICAjIGFuZCBsb2FkIHRoZSBpbmRleC5odG1sIG9mIHRoZSBhcHAuIHRoaXMgbWF5IGhvd2V2ZXIgYmUgeWFua2VkXG4gICAgIyBhd2F5IGlmIHdlIG11c3QgZG8gYXV0aC5cbiAgICBsb2FkQXBwV2luZG93KClcblxuICAgICMgc2hvcnQgaGFuZFxuICAgIGlwY3NlbmQgPSAoYXMuLi4pIC0+ICBtYWluV2luZG93LndlYkNvbnRlbnRzLnNlbmQgYXMuLi5cblxuICAgICMgY2FsbGJhY2sgZm9yIGNyZWRlbnRpYWxzXG4gICAgY3JlZHMgPSAtPlxuICAgICAgICBwcm9tID0gbG9naW4obWFpbldpbmRvdylcbiAgICAgICAgIyByZWluc3RhdGUgYXBwIHdpbmRvdyB3aGVuIGxvZ2luIGZpbmlzaGVzXG4gICAgICAgIHByb20udGhlbiAtPiBsb2FkQXBwV2luZG93KClcbiAgICAgICAgYXV0aDogLT4gcHJvbVxuXG4gICAgIyBzZW5kcyB0aGUgaW5pdCBzdHJ1Y3R1cmVzIHRvIHRoZSBjbGllbnRcbiAgICBzZW5kSW5pdCA9IC0+XG4gICAgICAgICMgd2UgaGF2ZSBubyBpbml0IGRhdGEgYmVmb3JlIHRoZSBjbGllbnQgaGFzIGNvbm5lY3RlZCBmaXJzdFxuICAgICAgICAjIHRpbWUuXG4gICAgICAgIHJldHVybiBmYWxzZSB1bmxlc3MgY2xpZW50Py5pbml0Py5zZWxmX2VudGl0eVxuICAgICAgICBpcGNzZW5kICdpbml0JywgaW5pdDogY2xpZW50LmluaXRcbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICMga2VlcHMgdHJ5aW5nIHRvIGNvbm5lYyB0aGUgaGFuZ3Vwc2pzIGFuZCBjb21tdW5pY2F0ZXMgdGhvc2VcbiAgICAjIGF0dGVtcHRzIHRvIHRoZSBjbGllbnQuXG4gICAgcmVjb25uZWN0ID0gLT4gcHJveHljaGVjaygpLnRoZW4gLT4gY2xpZW50LmNvbm5lY3QoY3JlZHMpXG5cbiAgICAjIGNvdW50ZXIgZm9yIHJlY29ubmVjdHNcbiAgICByZWNvbm5lY3RDb3VudCA9IDBcblxuICAgICMgd2hldGhlciB0byBjb25uZWN0IGlzIGRpY3RhdGVkIGJ5IHRoZSBjbGllbnQuXG4gICAgaXBjLm9uICdoYW5ndXBzQ29ubmVjdCcsIC0+XG4gICAgICAgIGNvbnNvbGUubG9nICdoY29ubmVjdCdcbiAgICAgICAgIyBmaXJzdCBjb25uZWN0XG4gICAgICAgIHJlY29ubmVjdCgpLnRoZW4gLT5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nICdjb25uZWN0ZWQnLCByZWNvbm5lY3RDb3VudFxuICAgICAgICAgICAgIyBvbiBmaXJzdCBjb25uZWN0LCBzZW5kIGluaXQsIGFmdGVyIHRoYXQgb25seSByZXN5bmNcbiAgICAgICAgICAgIGlmIHJlY29ubmVjdENvdW50ID09IDBcbiAgICAgICAgICAgICAgICBzZW5kSW5pdCgpXG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc3luY3JlY2VudCgpXG4gICAgICAgICAgICByZWNvbm5lY3RDb3VudCsrXG5cbiAgICBpcGMub24gJ2hhbmd1cHNEaXNjb25uZWN0JywgLT5cbiAgICAgICAgY29uc29sZS5sb2cgJ2hkaXNjb25uZWN0J1xuICAgICAgICByZWNvbm5lY3RDb3VudCA9IDBcbiAgICAgICAgY2xpZW50LmRpc2Nvbm5lY3QoKVxuXG4gICAgIyBjbGllbnQgZGVhbHMgd2l0aCB3aW5kb3cgc2l6aW5nXG4gICAgbWFpbldpbmRvdy5vbiAncmVzaXplJywgKGV2KSAtPiBpcGNzZW5kICdyZXNpemUnLCBtYWluV2luZG93LmdldFNpemUoKVxuICAgIG1haW5XaW5kb3cub24gJ21vdmVkJywgIChldikgLT4gaXBjc2VuZCAnbW92ZWQnLCBtYWluV2luZG93LmdldFBvc2l0aW9uKClcblxuICAgICMgd2hlbmV2ZXIgaXQgZmFpbHMsIHdlIHRyeSBhZ2FpblxuICAgIGNsaWVudC5vbiAnY29ubmVjdF9mYWlsZWQnLCAtPlxuICAgICAgICBjb25zb2xlLmxvZyAnY29ubmVjdF9mYWlsZWQnXG4gICAgICAgIHdhaXQoMzAwMCkudGhlbiAtPiByZWNvbm5lY3QoKVxuXG4gICAgIyB3aGVuIGNsaWVudCByZXF1ZXN0cyAocmUtKWluaXQgc2luY2UgdGhlIGZpcnN0IGluaXRcbiAgICAjIG9iamVjdCBpcyBzZW50IGFzIHNvb24gYXMgcG9zc2libGUgb24gc3RhcnR1cFxuICAgIGlwYy5vbiAncmVxaW5pdCcsIC0+IHN5bmNyZWNlbnQoKSBpZiBzZW5kSW5pdCgpXG5cbiAgICAjIHNlbmRjaGF0bWVzc2FnZSwgZXhlY3V0ZWQgc2VxdWVudGlhbGx5IGFuZFxuICAgICMgcmV0cmllZCBpZiBub3Qgc2VudCBzdWNjZXNzZnVsbHlcbiAgICBpcGMub24gJ3NlbmRjaGF0bWVzc2FnZScsIHNlcXJlcSAoZXYsIG1zZykgLT5cbiAgICAgICAge2NvbnZfaWQsIHNlZ3MsIGNsaWVudF9nZW5lcmF0ZWRfaWQsIGltYWdlX2lkLCBvdHJ9ID0gbXNnXG4gICAgICAgIGNsaWVudC5zZW5kY2hhdG1lc3NhZ2UoY29udl9pZCwgc2VncywgaW1hZ2VfaWQsIG90ciwgY2xpZW50X2dlbmVyYXRlZF9pZCkudGhlbiAocikgLT5cbiAgICAgICAgICAgIGlwY3NlbmQgJ3NlbmRjaGF0bWVzc2FnZTpyZXN1bHQnLCByXG4gICAgICAgICwgdHJ1ZSAjIGRvIHJldHJ5XG5cbiAgICAjIG5vIHJldHJ5LCBvbmx5IG9uZSBvdXRzdGFuZGluZyBjYWxsXG4gICAgaXBjLm9uICdzZXRwcmVzZW5jZScsIHNlcXJlcSAtPlxuICAgICAgICBjbGllbnQuc2V0cHJlc2VuY2UodHJ1ZSlcbiAgICAsIGZhbHNlLCAtPiAxXG5cbiAgICAjIG5vIHJldHJ5LCBvbmx5IG9uZSBvdXRzdGFuZGluZyBjYWxsXG4gICAgaXBjLm9uICdzZXRhY3RpdmVjbGllbnQnLCBzZXFyZXEgKGV2LCBhY3RpdmUsIHNlY3MpIC0+XG4gICAgICAgIGNsaWVudC5zZXRhY3RpdmVjbGllbnQgYWN0aXZlLCBzZWNzXG4gICAgLCBmYWxzZSwgLT4gMVxuXG4gICAgIyB3YXRlcm1hcmtpbmcgaXMgb25seSBpbnRlcmVzdGluZyBmb3IgdGhlIGxhc3Qgb2YgZWFjaCBjb252X2lkXG4gICAgIyByZXRyeSBzZW5kIGFuZCBkZWR1cGUgZm9yIGVhY2ggY29udl9pZFxuICAgIGlwYy5vbiAndXBkYXRld2F0ZXJtYXJrJywgc2VxcmVxIChldiwgY29udl9pZCwgdGltZSkgLT5cbiAgICAgICAgY2xpZW50LnVwZGF0ZXdhdGVybWFyayBjb252X2lkLCB0aW1lXG4gICAgLCB0cnVlLCAoZXYsIGNvbnZfaWQsIHRpbWUpIC0+IGNvbnZfaWRcblxuICAgICMgZ2V0ZW50aXR5IGlzIG5vdCBzdXBlciBpbXBvcnRhbnQsIHRoZSBjbGllbnQgd2lsbCB0cnkgYWdhaW4gd2hlbiBlbmNvdW50ZXJpbmdcbiAgICAjIGVudGl0aWVzIHdpdGhvdXQgcGhvdG9fdXJsLiBzbyBubyByZXRyeSwgYnV0IGRvIGV4ZWN1dGUgYWxsIHN1Y2ggcmVxc1xuICAgICMgaXBjLm9uICdnZXRlbnRpdHknLCBzZXFyZXEgKGV2LCBpZHMpIC0+XG4gICAgIyAgICAgY2xpZW50LmdldGVudGl0eWJ5aWQoaWRzKS50aGVuIChyKSAtPiBpcGNzZW5kICdnZXRlbnRpdHk6cmVzdWx0JywgclxuICAgICMgLCBmYWxzZVxuXG4gICAgIyB3ZSB3YW50IHRvIHVwbG9hZC4gaW4gdGhlIG9yZGVyIHNwZWNpZmllZCwgd2l0aCByZXRyeVxuICAgIGlwYy5vbiAndXBsb2FkaW1hZ2UnLCBzZXFyZXEgKGV2LCBzcGVjKSAtPlxuICAgICAgICB7cGF0aCwgY29udl9pZCwgY2xpZW50X2dlbmVyYXRlZF9pZH0gPSBzcGVjXG4gICAgICAgIGlwY3NlbmQgJ3VwbG9hZGluZ2ltYWdlJywge2NvbnZfaWQsIGNsaWVudF9nZW5lcmF0ZWRfaWQsIHBhdGh9XG4gICAgICAgIGNsaWVudC51cGxvYWRpbWFnZShwYXRoKS50aGVuIChpbWFnZV9pZCkgLT5cbiAgICAgICAgICAgIGNsaWVudC5zZW5kY2hhdG1lc3NhZ2UgY29udl9pZCwgbnVsbCwgaW1hZ2VfaWQsIG51bGwsIGNsaWVudF9nZW5lcmF0ZWRfaWRcbiAgICAsIHRydWVcblxuICAgICMgd2Ugd2FudCB0byB1cGxvYWQuIGluIHRoZSBvcmRlciBzcGVjaWZpZWQsIHdpdGggcmV0cnlcbiAgICBpcGMub24gJ3VwbG9hZGNsaXBib2FyZGltYWdlJywgc2VxcmVxIChldiwgc3BlYykgLT5cbiAgICAgICAge2NvbnZfaWQsIGNsaWVudF9nZW5lcmF0ZWRfaWR9ID0gc3BlY1xuICAgICAgICBmaWxlID0gdG1wLmZpbGVTeW5jIHBvc3RmaXg6IFwiLnBuZ1wiXG4gICAgICAgIHBuZ0RhdGEgPSBjbGlwYm9hcmQucmVhZEltYWdlKCkudG9QbmcoKVxuICAgICAgICBpcGNzZW5kICd1cGxvYWRpbmdpbWFnZScsIHtjb252X2lkLCBjbGllbnRfZ2VuZXJhdGVkX2lkLCBwYXRoOmZpbGUubmFtZX1cbiAgICAgICAgUS5Qcm9taXNlIChycywgcmopIC0+XG4gICAgICAgICAgICBmcy53cml0ZUZpbGUgZmlsZS5uYW1lLCBwbmdEYXRhLCBwbHVnKHJzLCByailcbiAgICAgICAgLnRoZW4gLT5cbiAgICAgICAgICAgIGNsaWVudC51cGxvYWRpbWFnZShmaWxlLm5hbWUpXG4gICAgICAgIC50aGVuIChpbWFnZV9pZCkgLT5cbiAgICAgICAgICAgIGNsaWVudC5zZW5kY2hhdG1lc3NhZ2UgY29udl9pZCwgbnVsbCwgaW1hZ2VfaWQsIG51bGwsIGNsaWVudF9nZW5lcmF0ZWRfaWRcbiAgICAgICAgLnRoZW4gLT5cbiAgICAgICAgICAgIGZpbGUucmVtb3ZlQ2FsbGJhY2soKVxuICAgICwgdHJ1ZVxuXG4gICAgIyByZXRyeSBvbmx5IGxhc3QgcGVyIGNvbnZfaWRcbiAgICBpcGMub24gJ3NldGNvbnZlcnNhdGlvbm5vdGlmaWNhdGlvbmxldmVsJywgc2VxcmVxIChldiwgY29udl9pZCwgbGV2ZWwpIC0+XG4gICAgICAgIGNsaWVudC5zZXRjb252ZXJzYXRpb25ub3RpZmljYXRpb25sZXZlbCBjb252X2lkLCBsZXZlbFxuICAgICwgdHJ1ZSwgKGV2LCBjb252X2lkLCBsZXZlbCkgLT4gY29udl9pZFxuXG4gICAgIyByZXRyeVxuICAgIGlwYy5vbiAnZGVsZXRlY29udmVyc2F0aW9uJywgc2VxcmVxIChldiwgY29udl9pZCkgLT5cbiAgICAgICAgY2xpZW50LmRlbGV0ZWNvbnZlcnNhdGlvbiBjb252X2lkXG4gICAgLCB0cnVlXG5cbiAgICBpcGMub24gJ3JlbW92ZXVzZXInLCBzZXFyZXEgKGV2LCBjb252X2lkKSAtPlxuICAgICAgICBjbGllbnQucmVtb3ZldXNlciBjb252X2lkXG4gICAgLCB0cnVlXG5cbiAgICAjIG5vIHJldHJpZXMsIGRlZHVwZSBvbiBjb252X2lkXG4gICAgaXBjLm9uICdzZXRmb2N1cycsIHNlcXJlcSAoZXYsIGNvbnZfaWQpIC0+XG4gICAgICAgIGNsaWVudC5zZXRmb2N1cyBjb252X2lkXG4gICAgLCBmYWxzZSwgKGV2LCBjb252X2lkKSAtPiBjb252X2lkXG5cbiAgICBpcGMub24gJ2FwcGZvY3VzJywgLT4gYXBwLmZvY3VzKClcblxuICAgICMgbm8gcmV0cmllcywgZGVkdXBlIG9uIGNvbnZfaWRcbiAgICBpcGMub24gJ3NldHR5cGluZycsIHNlcXJlcSAoZXYsIGNvbnZfaWQsIHYpIC0+XG4gICAgICAgIGNsaWVudC5zZXR0eXBpbmcgY29udl9pZCwgdlxuICAgICwgZmFsc2UsIChldiwgY29udl9pZCkgLT4gY29udl9pZFxuXG4gICAgaXBjLm9uICd1cGRhdGViYWRnZScsIChldiwgdmFsdWUpIC0+XG4gICAgICAgIGFwcC5kb2NrLnNldEJhZGdlKHZhbHVlKSBpZiBhcHAuZG9ja1xuXG4gICAgaXBjLm9uICdzZWFyY2hlbnRpdGllcycsIChldiwgcXVlcnksIG1heF9yZXN1bHRzKSAtPlxuICAgICAgICBwcm9taXNlID0gY2xpZW50LnNlYXJjaGVudGl0aWVzIHF1ZXJ5LCBtYXhfcmVzdWx0c1xuICAgICAgICBwcm9taXNlLnRoZW4gKHJlcykgLT5cbiAgICAgICAgICAgIGlwY3NlbmQgJ3NlYXJjaGVudGl0aWVzOnJlc3VsdCcsIHJlc1xuICAgIGlwYy5vbiAnY3JlYXRlY29udmVyc2F0aW9uJywgKGV2LCBpZHMsIG5hbWUsIGZvcmNlZ3JvdXA9ZmFsc2UpIC0+XG4gICAgICAgIHByb21pc2UgPSBjbGllbnQuY3JlYXRlY29udmVyc2F0aW9uIGlkcywgZm9yY2Vncm91cFxuICAgICAgICBjb252ID0gbnVsbFxuICAgICAgICBwcm9taXNlLnRoZW4gKHJlcykgLT5cbiAgICAgICAgICAgIGNvbnYgPSByZXMuY29udmVyc2F0aW9uXG4gICAgICAgICAgICBjb252X2lkID0gY29udi5pZC5pZFxuICAgICAgICAgICAgY2xpZW50LnJlbmFtZWNvbnZlcnNhdGlvbiBjb252X2lkLCBuYW1lIGlmIG5hbWVcbiAgICAgICAgcHJvbWlzZSA9IHByb21pc2UudGhlbiAocmVzKSAtPlxuICAgICAgICAgICAgaXBjc2VuZCAnY3JlYXRlY29udmVyc2F0aW9uOnJlc3VsdCcsIGNvbnYsIG5hbWVcbiAgICBpcGMub24gJ2FkZHVzZXInLCAoZXYsIGNvbnZfaWQsIHRvYWRkKSAtPlxuICAgICAgICBjbGllbnQuYWRkdXNlciBjb252X2lkLCB0b2FkZCAjwqB3aWxsIGF1dG9tYXRpY2FsbHkgdHJpZ2dlciBtZW1iZXJzaGlwX2NoYW5nZVxuICAgIGlwYy5vbiAncmVuYW1lY29udmVyc2F0aW9uJywgKGV2LCBjb252X2lkLCBuZXduYW1lKSAtPlxuICAgICAgICBjbGllbnQucmVuYW1lY29udmVyc2F0aW9uIGNvbnZfaWQsIG5ld25hbWUgIyB3aWxsIHRyaWdnZXIgY29udmVyc2F0aW9uX3JlbmFtZVxuXG4gICAgIyBubyByZXRyaWVzLCBqdXN0IGRlZHVwZSBvbiB0aGUgaWRzXG4gICAgaXBjLm9uICdnZXRlbnRpdHknLCBzZXFyZXEgKGV2LCBpZHMsIGRhdGEpIC0+XG4gICAgICAgIGNsaWVudC5nZXRlbnRpdHlieWlkKGlkcykudGhlbiAocikgLT5cbiAgICAgICAgICAgIGlwY3NlbmQgJ2dldGVudGl0eTpyZXN1bHQnLCByLCBkYXRhXG4gICAgLCBmYWxzZSwgKGV2LCBpZHMpIC0+IGlkcy5zb3J0KCkuam9pbignLCcpXG5cbiAgICAjIG5vIHJldHJ5LCBqdXN0IG9uZSBzaW5nbGUgcmVxdWVzdFxuICAgIGlwYy5vbiAnc3luY2FsbG5ld2V2ZW50cycsIHNlcXJlcSAoZXYsIHRpbWUpIC0+XG4gICAgICAgIGNvbnNvbGUubG9nICdzeW5jYWxsbmV3J1xuICAgICAgICBjbGllbnQuc3luY2FsbG5ld2V2ZW50cyh0aW1lKS50aGVuIChyKSAtPlxuICAgICAgICAgICAgaXBjc2VuZCAnc3luY2FsbG5ld2V2ZW50czpyZXNwb25zZScsIHJcbiAgICAsIGZhbHNlLCAoZXYsIHRpbWUpIC0+IDFcblxuICAgICMgbm8gcmV0cnksIGp1c3Qgb25lIHNpbmdsZSByZXF1ZXN0XG4gICAgaXBjLm9uICdzeW5jcmVjZW50Y29udmVyc2F0aW9ucycsIHN5bmNyZWNlbnQgPSBzZXFyZXEgKGV2KSAtPlxuICAgICAgICBjb25zb2xlLmxvZyAnc3luY3JlY2VudCdcbiAgICAgICAgY2xpZW50LnN5bmNyZWNlbnRjb252ZXJzYXRpb25zKCkudGhlbiAocikgLT5cbiAgICAgICAgICAgIGlwY3NlbmQgJ3N5bmNyZWNlbnRjb252ZXJzYXRpb25zOnJlc3BvbnNlJywgclxuICAgICAgICAgICAgIyB0aGlzIGlzIGJlY2F1c2Ugd2UgdXNlIHN5bmNyZWNlbnQgb24gcmVxaW5pdCAoZGV2LW1vZGVcbiAgICAgICAgICAgICMgcmVmcmVzaCkuIGlmIHdlIHN1Y2NlZWRlZCBnZXR0aW5nIGEgcmVzcG9uc2UsIHdlIGNhbGwgaXRcbiAgICAgICAgICAgICMgY29ubmVjdGVkLlxuICAgICAgICAgICAgaXBjc2VuZCAnY29ubmVjdGVkJ1xuICAgICwgZmFsc2UsIChldiwgdGltZSkgLT4gMVxuXG4gICAgIyByZXRyeSwgb25lIHNpbmdsZSBwZXIgY29udl9pZFxuICAgIGlwYy5vbiAnZ2V0Y29udmVyc2F0aW9uJywgc2VxcmVxIChldiwgY29udl9pZCwgdGltZXN0YW1wLCBtYXgpIC0+XG4gICAgICAgIGNsaWVudC5nZXRjb252ZXJzYXRpb24oY29udl9pZCwgdGltZXN0YW1wLCBtYXgpLnRoZW4gKHIpIC0+XG4gICAgICAgICAgICBpcGNzZW5kICdnZXRjb252ZXJzYXRpb246cmVzcG9uc2UnLCByXG4gICAgLCBmYWxzZSwgKGV2LCBjb252X2lkLCB0aW1lc3RhbXAsIG1heCkgLT4gY29udl9pZFxuXG4gICAgaXBjLm9uICd0b2dnbGVmdWxsc2NyZWVuJywgLT5cbiAgICAgIG1haW5XaW5kb3cuc2V0RnVsbFNjcmVlbiBub3QgbWFpbldpbmRvdy5pc0Z1bGxTY3JlZW4oKVxuXG4gICAgIyBieWUgYnllXG4gICAgaXBjLm9uICdsb2dvdXQnLCBsb2dvdXRcblxuICAgICMgcHJvcGFnYXRlIHRoZXNlIGV2ZW50cyB0byB0aGUgcmVuZGVyZXJcbiAgICByZXF1aXJlKCcuL3VpL2V2ZW50cycpLmZvckVhY2ggKG4pIC0+XG4gICAgICAgIGNsaWVudC5vbiBuLCAoZSkgLT5cbiAgICAgICAgICAgIGlwY3NlbmQgbiwgZVxuXG5cbiAgICAjIEVtaXR0ZWQgd2hlbiB0aGUgd2luZG93IGlzIGNsb3NlZC5cbiAgICBtYWluV2luZG93Lm9uICdjbG9zZWQnLCAtPlxuICAgICAgICBtYWluV2luZG93ID0gbnVsbFxuIl19