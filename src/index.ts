// The entry point for the main Electron process.

import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as path from 'path';
import { promises as fs } from 'fs';
import { convertSVGFonts, createHTMLOverlayFromSVG } from './util/fixup-svg';

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

ipcMain.handle('requestSVGInput', async () => {
	const result = await dialog.showOpenDialog(mainWindow!, {
		buttonLabel: 'Load',
		properties: ['openFile'],
		filters: [
			{name: 'SVG Files', extensions: ['svg']},
			{name: 'All Files', extensions: ['*']},
		],
	});

	if (result.canceled) {
		return {
			error: true,
			message: 'User cancelled',
		};
	}

	let contents;
	try {
		contents = await fs.readFile(result.filePaths[0], 'utf-8');
	} catch (error) {
		return {
			error: true,
			message: (error as Error).message,
		};
	}

	let fixedContents = convertSVGFonts(contents);

	return {
		error: false,
		svg: fixedContents,
	};
});

ipcMain.handle('saveOverlay', async (event, svg) => {
	const result = await dialog.showSaveDialog(mainWindow!, {
		filters: [
			{name: 'HTML Files', extensions: ['html']},
			{name: 'All Files', extensions: ['*']},
		],
	});

	if (result.canceled) {
		return {
			error: true,
			message: 'User cancelled',
		};
	}

	let html = createHTMLOverlayFromSVG(svg);
	try {
		await fs.writeFile(result.filePath!, html, 'utf-8');
		return {
			error: false,
			path: result.filePath,
		}
	} catch (error) {
		return {
			error: true,
			message: (error as Error).message
		};
	}
});

// #endregion
