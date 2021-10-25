// The entry point for the main Electron process.

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

// #region Main window lifecycle

let mainWindow: BrowserWindow | null = null;

app.on('ready', () => {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "./preload.js"),
		},
	});
	mainWindow.loadFile(path.join(__dirname, "../index.html"));
	mainWindow.webContents.openDevTools();
});

app.on("window-all-closed", () => {
	app.quit();
});

// #endregion

// #region IPC stuff

ipcMain.handle('logHello', () => {
	console.log('Hello!');
});

// #endregion
