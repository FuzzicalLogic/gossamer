"use strict";
var ELECTRON = require('electron');
// Bind main application to electron.app
require('./gossamer').call(ELECTRON.app, ELECTRON);
