(function() {
  var Menu, remote, templateOsx, templateOthers;

  remote = require('remote');

  Menu = remote.require('menu');

  templateOsx = function(viewstate) {
    return [
      {
        label: 'Yakyak',
        submenu: [
          {
            label: 'About YakYak',
            selector: 'orderFrontStandardAboutPanel:'
          }, {
            type: 'separator'
          }, {
            type: 'separator'
          }, {
            label: 'Hide YakYak',
            accelerator: 'Command+H',
            selector: 'hide:'
          }, {
            label: 'Hide Others',
            accelerator: 'Command+Shift+H',
            selector: 'hideOtherApplications:'
          }, {
            label: 'Show All',
            selector: 'unhideAllApplications:'
          }, {
            type: 'separator'
          }, {
            label: 'Open Inspector',
            accelerator: 'Command+Alt+I',
            click: function() {
              return action('devtools');
            }
          }, {
            type: 'separator'
          }, {
            label: 'Logout',
            click: function() {
              return action('logout');
            }
          }, {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function() {
              return action('quit');
            }
          }
        ]
      }, {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'Command+Z',
            selector: 'undo:'
          }, {
            label: 'Redo',
            accelerator: 'Command+Shift+Z',
            selector: 'redo:'
          }, {
            type: 'separator'
          }, {
            label: 'Cut',
            accelerator: 'Command+X',
            selector: 'cut:'
          }, {
            label: 'Copy',
            accelerator: 'Command+C',
            selector: 'copy:'
          }, {
            label: 'Paste',
            accelerator: 'Command+V',
            selector: 'paste:'
          }, {
            label: 'Select All',
            accelerator: 'Command+A',
            selector: 'selectAll:'
          }
        ]
      }, {
        label: 'View',
        submenu: [
          {
            type: 'checkbox',
            label: 'Show Conversation Thumbnails',
            checked: viewstate.showConvThumbs,
            click: function(it) {
              return action('showconvthumbs', it.checked);
            }
          }, {
            label: 'Enter Full Screen',
            accelerator: 'Command+Control+F',
            click: function() {
              return action('togglefullscreen');
            }
          }, {
            label: 'Previous Conversation',
            click: function() {
              return action('selectNextConv', -1);
            }
          }, {
            label: 'Next Conversation',
            click: function() {
              return action('selectNextConv', +1);
            }
          }
        ]
      }, {
        label: 'Window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'Command+M',
            selector: 'performMiniaturize:'
          }, {
            label: 'Close',
            accelerator: 'Command+W',
            selector: 'performClose:'
          }, {
            type: 'separator'
          }, {
            label: 'Bring All to Front',
            selector: 'arrangeInFront:'
          }
        ]
      }
    ];
  };

  templateOthers = function(viewstate) {
    return [
      {
        label: 'Yakyak',
        submenu: [
          {
            label: 'Open Inspector',
            accelerator: 'Command+Alt+I',
            click: function() {
              return action('devtools');
            }
          }, {
            type: 'separator'
          }, {
            label: 'Logout',
            click: function() {
              return action('logout');
            }
          }, {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function() {
              return action('quit');
            }
          }
        ]
      }, {
        label: 'View',
        submenu: [
          {
            type: 'checkbox',
            label: 'Show Conversation Thumbnails',
            checked: viewstate.showConvThumbs,
            click: function(it) {
              return action('showconvthumbs', it.checked);
            }
          }, {
            label: 'Enter Full Screen',
            accelerator: 'Command+Control+F',
            click: function() {
              return action('togglefullscreen');
            }
          }, {
            label: 'Previous Conversation',
            click: function() {
              return action('selectNextConv', -1);
            }
          }, {
            label: 'Next Conversation',
            click: function() {
              return action('selectNextConv', +1);
            }
          }
        ]
      }
    ];
  };

  module.exports = function(viewstate) {
    if (require('os').platform() === 'darwin') {
      return Menu.setApplicationMenu(Menu.buildFromTemplate(templateOsx(viewstate)));
    } else {
      return Menu.setApplicationMenu(Menu.buildFromTemplate(templateOthers(viewstate)));
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInVpL3ZpZXdzL21lbnUuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxNQUFBLEdBQVMsT0FBQSxDQUFRLFFBQVI7O0VBQ1QsSUFBQSxHQUFPLE1BQU0sQ0FBQyxPQUFQLENBQWUsTUFBZjs7RUFFUCxXQUFBLEdBQWMsU0FBQyxTQUFEO1dBQWU7TUFBQztRQUMxQixLQUFBLEVBQU8sUUFEbUI7UUFFMUIsT0FBQSxFQUFTO1VBQ0w7WUFBRSxLQUFBLEVBQU8sY0FBVDtZQUF5QixRQUFBLEVBQVUsK0JBQW5DO1dBREssRUFFTDtZQUFFLElBQUEsRUFBTSxXQUFSO1dBRkssRUFJTDtZQUFFLElBQUEsRUFBTSxXQUFSO1dBSkssRUFLTDtZQUFFLEtBQUEsRUFBTyxhQUFUO1lBQXdCLFdBQUEsRUFBYSxXQUFyQztZQUFrRCxRQUFBLEVBQVUsT0FBNUQ7V0FMSyxFQU1MO1lBQUUsS0FBQSxFQUFPLGFBQVQ7WUFBd0IsV0FBQSxFQUFhLGlCQUFyQztZQUF3RCxRQUFBLEVBQVUsd0JBQWxFO1dBTkssRUFPTDtZQUFFLEtBQUEsRUFBTyxVQUFUO1lBQXFCLFFBQUEsRUFBVSx3QkFBL0I7V0FQSyxFQVFMO1lBQUUsSUFBQSxFQUFNLFdBQVI7V0FSSyxFQVNMO1lBQUUsS0FBQSxFQUFPLGdCQUFUO1lBQTJCLFdBQUEsRUFBYSxlQUF4QztZQUF5RCxLQUFBLEVBQU8sU0FBQTtxQkFBRyxNQUFBLENBQU8sVUFBUDtZQUFILENBQWhFO1dBVEssRUFVTDtZQUFFLElBQUEsRUFBTSxXQUFSO1dBVkssRUFXTDtZQUFFLEtBQUEsRUFBTyxRQUFUO1lBQW1CLEtBQUEsRUFBTyxTQUFBO3FCQUFHLE1BQUEsQ0FBTyxRQUFQO1lBQUgsQ0FBMUI7V0FYSyxFQVlMO1lBQUUsS0FBQSxFQUFPLE1BQVQ7WUFBaUIsV0FBQSxFQUFhLFdBQTlCO1lBQTJDLEtBQUEsRUFBTyxTQUFBO3FCQUFHLE1BQUEsQ0FBTyxNQUFQO1lBQUgsQ0FBbEQ7V0Fa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O1lBQ0ksSUFBQSxFQUFLLFVBRFQ7WUFFSSxLQUFBLEVBQU8sOEJBRlg7WUFHSSxPQUFBLEVBQVEsU0FBUyxDQUFDLGNBSHRCO1lBSUksS0FBQSxFQUFPLFNBQUMsRUFBRDtxQkFBUSxNQUFBLENBQU8sZ0JBQVAsRUFBeUIsRUFBRSxDQUFDLE9BQTVCO1lBQVIsQ0FKWDtXQURLLEVBTUY7WUFDQyxLQUFBLEVBQU8sbUJBRFI7WUFFQyxXQUFBLEVBQWEsbUJBRmQ7WUFHQyxLQUFBLEVBQU8sU0FBQTtxQkFBRyxNQUFBLENBQU8sa0JBQVA7WUFBSCxDQUhSO1dBTkUsRUFVRjtZQUNDLEtBQUEsRUFBTyx1QkFEUjtZQUVDLEtBQUEsRUFBTyxTQUFBO3FCQUFHLE1BQUEsQ0FBTyxnQkFBUCxFQUF5QixDQUFDLENBQTFCO1lBQUgsQ0FGUjtXQVZFLEVBYUY7WUFDQyxLQUFBLEVBQU8sbUJBRFI7WUFFQyxLQUFBLEVBQU8sU0FBQTtxQkFBRyxNQUFBLENBQU8sZ0JBQVAsRUFBeUIsQ0FBQyxDQUExQjtZQUFILENBRlI7V0FiRTtTQUZMO09BUHdCOztFQUFmOztFQTZCakIsTUFBTSxDQUFDLE9BQVAsR0FBaUIsU0FBQyxTQUFEO0lBQ2IsSUFBRyxPQUFBLENBQVEsSUFBUixDQUFhLENBQUMsUUFBZCxDQUFBLENBQUEsS0FBNEIsUUFBL0I7YUFDSSxJQUFJLENBQUMsa0JBQUwsQ0FBd0IsSUFBSSxDQUFDLGlCQUFMLENBQXVCLFdBQUEsQ0FBWSxTQUFaLENBQXZCLENBQXhCLEVBREo7S0FBQSxNQUFBO2FBR0ksSUFBSSxDQUFDLGtCQUFMLENBQXdCLElBQUksQ0FBQyxpQkFBTCxDQUF1QixjQUFBLENBQWUsU0FBZixDQUF2QixDQUF4QixFQUhKOztFQURhO0FBckdqQiIsImZpbGUiOiJ1aS92aWV3cy9tZW51LmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsicmVtb3RlID0gcmVxdWlyZSAncmVtb3RlJ1xuTWVudSA9IHJlbW90ZS5yZXF1aXJlICdtZW51J1xuXG50ZW1wbGF0ZU9zeCA9ICh2aWV3c3RhdGUpIC0+IFt7XG4gICAgbGFiZWw6ICdZYWt5YWsnXG4gICAgc3VibWVudTogW1xuICAgICAgICB7IGxhYmVsOiAnQWJvdXQgWWFrWWFrJywgc2VsZWN0b3I6ICdvcmRlckZyb250U3RhbmRhcmRBYm91dFBhbmVsOicgfVxuICAgICAgICB7IHR5cGU6ICdzZXBhcmF0b3InIH1cbiAgICAgICAgIyB7IGxhYmVsOiAnUHJlZmVyZW5jZXMuLi4nLCBhY2NlbGVyYXRvcjogJ0NvbW1hbmQrLCcsIGNsaWNrOiA9PiBkZWxlZ2F0ZS5vcGVuQ29uZmlnKCkgfVxuICAgICAgICB7IHR5cGU6ICdzZXBhcmF0b3InIH1cbiAgICAgICAgeyBsYWJlbDogJ0hpZGUgWWFrWWFrJywgYWNjZWxlcmF0b3I6ICdDb21tYW5kK0gnLCBzZWxlY3RvcjogJ2hpZGU6JyB9XG4gICAgICAgIHsgbGFiZWw6ICdIaWRlIE90aGVycycsIGFjY2VsZXJhdG9yOiAnQ29tbWFuZCtTaGlmdCtIJywgc2VsZWN0b3I6ICdoaWRlT3RoZXJBcHBsaWNhdGlvbnM6JyB9XG4gICAgICAgIHsgbGFiZWw6ICdTaG93IEFsbCcsIHNlbGVjdG9yOiAndW5oaWRlQWxsQXBwbGljYXRpb25zOicgfVxuICAgICAgICB7IHR5cGU6ICdzZXBhcmF0b3InIH1cbiAgICAgICAgeyBsYWJlbDogJ09wZW4gSW5zcGVjdG9yJywgYWNjZWxlcmF0b3I6ICdDb21tYW5kK0FsdCtJJywgY2xpY2s6IC0+IGFjdGlvbiAnZGV2dG9vbHMnIH1cbiAgICAgICAgeyB0eXBlOiAnc2VwYXJhdG9yJyB9XG4gICAgICAgIHsgbGFiZWw6ICdMb2dvdXQnLCBjbGljazogLT4gYWN0aW9uICdsb2dvdXQnIH1cbiAgICAgICAgeyBsYWJlbDogJ1F1aXQnLCBhY2NlbGVyYXRvcjogJ0NvbW1hbmQrUScsIGNsaWNrOiAtPiBhY3Rpb24gJ3F1aXQnIH1cbiAgICBdfSx7XG4gICAgbGFiZWw6ICdFZGl0J1xuICAgIHN1Ym1lbnU6IFtcbiAgICAgICAgeyBsYWJlbDogJ1VuZG8nLCBhY2NlbGVyYXRvcjogJ0NvbW1hbmQrWicsIHNlbGVjdG9yOiAndW5kbzonIH1cbiAgICAgICAgeyBsYWJlbDogJ1JlZG8nLCBhY2NlbGVyYXRvcjogJ0NvbW1hbmQrU2hpZnQrWicsIHNlbGVjdG9yOiAncmVkbzonIH1cbiAgICAgICAgeyB0eXBlOiAnc2VwYXJhdG9yJyB9XG4gICAgICAgIHsgbGFiZWw6ICdDdXQnLCBhY2NlbGVyYXRvcjogJ0NvbW1hbmQrWCcsIHNlbGVjdG9yOiAnY3V0OicgfVxuICAgICAgICB7IGxhYmVsOiAnQ29weScsIGFjY2VsZXJhdG9yOiAnQ29tbWFuZCtDJywgc2VsZWN0b3I6ICdjb3B5OicgfVxuICAgICAgICB7IGxhYmVsOiAnUGFzdGUnLCBhY2NlbGVyYXRvcjogJ0NvbW1hbmQrVicsIHNlbGVjdG9yOiAncGFzdGU6JyB9XG4gICAgICAgIHsgbGFiZWw6ICdTZWxlY3QgQWxsJywgYWNjZWxlcmF0b3I6ICdDb21tYW5kK0EnLCBzZWxlY3RvcjogJ3NlbGVjdEFsbDonIH1cbiAgICBdfSx7XG4gICAgbGFiZWw6ICdWaWV3J1xuICAgIHN1Ym1lbnU6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgdHlwZTonY2hlY2tib3gnXG4gICAgICAgICAgICBsYWJlbDogJ1Nob3cgQ29udmVyc2F0aW9uIFRodW1ibmFpbHMnXG4gICAgICAgICAgICBjaGVja2VkOnZpZXdzdGF0ZS5zaG93Q29udlRodW1ic1xuICAgICAgICAgICAgY2xpY2s6IChpdCkgLT4gYWN0aW9uICdzaG93Y29udnRodW1icycsIGl0LmNoZWNrZWRcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbGFiZWw6ICdFbnRlciBGdWxsIFNjcmVlbicsXG4gICAgICAgICAgICBhY2NlbGVyYXRvcjogJ0NvbW1hbmQrQ29udHJvbCtGJyxcbiAgICAgICAgICAgIGNsaWNrOiAtPiBhY3Rpb24gJ3RvZ2dsZWZ1bGxzY3JlZW4nXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGxhYmVsOiAnUHJldmlvdXMgQ29udmVyc2F0aW9uJyxcbiAgICAgICAgICAgIGNsaWNrOiAtPiBhY3Rpb24gJ3NlbGVjdE5leHRDb252JywgLTFcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbGFiZWw6ICdOZXh0IENvbnZlcnNhdGlvbicsXG4gICAgICAgICAgICBjbGljazogLT4gYWN0aW9uICdzZWxlY3ROZXh0Q29udicsICsxXG4gICAgICAgIH1cbiAgICBdfSx7XG4gICAgbGFiZWw6ICdXaW5kb3cnLFxuICAgIHN1Ym1lbnU6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdNaW5pbWl6ZScsXG4gICAgICAgICAgICBhY2NlbGVyYXRvcjogJ0NvbW1hbmQrTScsXG4gICAgICAgICAgICBzZWxlY3RvcjogJ3BlcmZvcm1NaW5pYXR1cml6ZTonXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnQ2xvc2UnLFxuICAgICAgICAgICAgYWNjZWxlcmF0b3I6ICdDb21tYW5kK1cnLFxuICAgICAgICAgICAgc2VsZWN0b3I6ICdwZXJmb3JtQ2xvc2U6J1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnc2VwYXJhdG9yJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgICBsYWJlbDogJ0JyaW5nIEFsbCB0byBGcm9udCcsXG4gICAgICAgICAgICBzZWxlY3RvcjogJ2FycmFuZ2VJbkZyb250OidcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH1cbl1cblxuIyBUT0RPOiBmaW5kIHByb3BlciB3aW5kb3dzL2xpbnV4IGFjY2VsZXJhdG9yc1xudGVtcGxhdGVPdGhlcnMgPSAodmlld3N0YXRlKSAtPiBbe1xuICAgIGxhYmVsOiAnWWFreWFrJ1xuICAgIHN1Ym1lbnU6IFtcbiAgICAgICAgeyBsYWJlbDogJ09wZW4gSW5zcGVjdG9yJywgYWNjZWxlcmF0b3I6ICdDb21tYW5kK0FsdCtJJywgY2xpY2s6IC0+IGFjdGlvbiAnZGV2dG9vbHMnIH1cbiAgICAgICAgeyB0eXBlOiAnc2VwYXJhdG9yJyB9XG4gICAgICAgIHsgbGFiZWw6ICdMb2dvdXQnLCBjbGljazogLT4gYWN0aW9uICdsb2dvdXQnIH1cbiAgICAgICAgeyBsYWJlbDogJ1F1aXQnLCBhY2NlbGVyYXRvcjogJ0NvbW1hbmQrUScsIGNsaWNrOiAtPiBhY3Rpb24gJ3F1aXQnIH1cbiAgICBdfSwge1xuICAgIGxhYmVsOiAnVmlldydcbiAgICBzdWJtZW51OiBbXG4gICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6J2NoZWNrYm94J1xuICAgICAgICAgICAgbGFiZWw6ICdTaG93IENvbnZlcnNhdGlvbiBUaHVtYm5haWxzJ1xuICAgICAgICAgICAgY2hlY2tlZDp2aWV3c3RhdGUuc2hvd0NvbnZUaHVtYnNcbiAgICAgICAgICAgIGNsaWNrOiAoaXQpIC0+IGFjdGlvbiAnc2hvd2NvbnZ0aHVtYnMnLCBpdC5jaGVja2VkXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGxhYmVsOiAnRW50ZXIgRnVsbCBTY3JlZW4nLFxuICAgICAgICAgICAgYWNjZWxlcmF0b3I6ICdDb21tYW5kK0NvbnRyb2wrRicsXG4gICAgICAgICAgICBjbGljazogLT4gYWN0aW9uICd0b2dnbGVmdWxsc2NyZWVuJ1xuICAgICAgICB9LCB7XG4gICAgICAgICAgICBsYWJlbDogJ1ByZXZpb3VzIENvbnZlcnNhdGlvbicsXG4gICAgICAgICAgICBjbGljazogLT4gYWN0aW9uICdzZWxlY3ROZXh0Q29udicsIC0xXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGxhYmVsOiAnTmV4dCBDb252ZXJzYXRpb24nLFxuICAgICAgICAgICAgY2xpY2s6IC0+IGFjdGlvbiAnc2VsZWN0TmV4dENvbnYnLCArMVxuICAgICAgICB9XG4gICAgXX1cbl1cblxubW9kdWxlLmV4cG9ydHMgPSAodmlld3N0YXRlKSAtPlxuICAgIGlmIHJlcXVpcmUoJ29zJykucGxhdGZvcm0oKSA9PSAnZGFyd2luJ1xuICAgICAgICBNZW51LnNldEFwcGxpY2F0aW9uTWVudSBNZW51LmJ1aWxkRnJvbVRlbXBsYXRlIHRlbXBsYXRlT3N4KHZpZXdzdGF0ZSlcbiAgICBlbHNlXG4gICAgICAgIE1lbnUuc2V0QXBwbGljYXRpb25NZW51IE1lbnUuYnVpbGRGcm9tVGVtcGxhdGUgdGVtcGxhdGVPdGhlcnModmlld3N0YXRlKVxuIl19