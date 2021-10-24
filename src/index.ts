import {app, BrowserWindow} from 'electron';
import * as path from 'path';

// #region Main window lifecycle

let mainWindow: BrowserWindow | null = null;

app.on('ready', () => {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			// preload: path.join(__dirname, "../renderer/preload.js"),
		},
	});
	mainWindow.loadFile(path.join(__dirname, "../index.html"));
	mainWindow.webContents.openDevTools();
});

app.on("window-all-closed", () => {
	app.quit();
});

// #endregion
