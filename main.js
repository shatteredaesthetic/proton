var app = require('app'); // Module to control application life.
var BrowserWindow = require('browser-window'); // Module to create native browser window.
var Menu = require('menu');
var MenuItem = require('menu-item');
var ipc = require('ipc');
var dialog = require('dialog');
var fs = require('fs');

var menu = new Menu();

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
  });

  // Make the window fill the screen
  mainWindow.maximize();

  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  // Open the DevTools.
  mainWindow.openDevTools();

  // Global filename
  var filename;

  var appmenu_template = [{
    label: 'Proton',
    submenu: [{
      label: 'About Proton',
      click: function() {
        ipc.send('open-url-in-external', 'http://github/steventhanna/proton/')
      }
    }, {
      type: 'separator'
    }, {
      label: 'Preferences',
      accelerator: 'CmdOrCtrl+,',
      click: function() {
        console.log("Preferences");
      }
    }, {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: function() {
        app.quit();
      }
    }]
  }, {
    label: 'File',
    submenu: [{
      label: 'Open File',
      accelerator: 'CmdOrCtrl+O',
      click: function() {
        // ipc.send('open-file-dialog')
        filename = dialog.showOpenDialog({
          properties: ['openFile'],
          // restrict to markdown files only
          filters: [{
            name: 'Markdown',
            extensions: ['md']
          }],
        });
        console.log(filename);
        if (filename[0] == undefined) {
          dialog.showErrorBox("Uh-Oh!", "The file could not be opened. -1");
        } else {
          try {
            filename = filename[0];
            var string = filename[0];
            var data = fs.readFile(string, 'utf8', function(err, data) {
              if (err) throw err;
              mainWindow.send('fileContent', data);
            });
          } catch (err) {
            dialog.showErrorBox("Uh-Oh!", "The file could not be opened. -2");
            console.log(err);
          }
        }
      }
    }, {
      label: 'New File',
      accelerator: 'CmdOrCtrl+N',
      click: function() {
        console.log("NEW FILE CLICKED");
      }
    }, {
      label: 'Save',
      accelerator: 'CmdOrCtrl+S',
      click: function() {
        console.log("Starting file save");
        var string = filename[0];
        mainWindow.send('getSave');

        ipc.on('fileSave', function(event, arg) {
          fs.writeFile(string, arg, 'utf8', function(err) {
            if (err) {
              console.log(err);
              throw err;
            }
            console.log("FILE SAVED");
          });
        });
      },
    }, {
      label: 'Save As',
      accelerator: 'CmdOrCtrl+Shift+S',
      click: function() {
        var file;
        dialog.showSaveDialog(mainWindow, function(fileName) {
          console.log("DIALOG");
          file = fileName;
          filename = file;
          mainWindow.send('getSaveAs');
        });
        ipc.on('fileSaveAs', function(event, arg) {
          console.log("FILETRIGGER");
          fs.writeFile(file, arg, 'utf8', function(err) {
            console.log("WRITEFILE");
            if (err) {
              console.log(err);
              throw err;
            }
            console.log("NEW FILE SAVED");
            // open the file now
            var data = fs.readFile(file, 'utf8', function(err, data) {
              if (err) throw err;
              mainWindow.send('fileContent', data);
            });
          });
        });
      }
    }]
  }, {
    label: 'Edit',
    submenu: [{
      label: 'Undo',
      accelerator: 'CmdOrCtrl+Z',
      role: 'undo'
    }, {
      label: 'Redo',
      accelerator: 'Shift+CmdOrCtrl+Z',
      role: 'redo'
    }, {
      type: 'separator'
    }, {
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    }, {
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    }, {
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste'
    }, {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectall'
    }, ]
  }, {
    label: 'Window',
    submenu: [{
      label: 'Minimize',
      accelerator: 'Command+M',
      click: function() {
        ipc.send('minimize')
      }
    }, {
      label: 'Toggle Full Screen',
      accelerator: 'Command+Enter',
      // click: onfullscreentoggle
    }]
  }, {
    label: 'Help',
    submenu: [{
      label: 'Report Issue',
      click: function() {
        ipc.send('open-url-in-external', 'https://github.com/mafintosh/playback/issues')
      }
    }, {
      label: 'View Source Code on GitHub',
      click: function() {
        ipc.send('open-url-in-external', 'https://github.com/mafintosh/playback')
      }
    }, {
      type: 'separator'
    }, {
      label: 'Releases',
      click: function() {
        ipc.send('open-url-in-external', 'https://github.com/mafintosh/playback/releases')
      }
    }]
  }]
  var appmenu = Menu.buildFromTemplate(appmenu_template)
  Menu.setApplicationMenu(appmenu)

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});