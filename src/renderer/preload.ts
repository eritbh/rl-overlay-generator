// Defines `window.messaging` for use in the main renderer script to enable IPC
// between main and renderer processes.

import { contextBridge, ipcRenderer } from "electron";

let messaging = {
	logHello () {
		ipcRenderer.invoke('logHello');
	},
};

export type Messaging = typeof messaging;
contextBridge.exposeInMainWorld('messaging', messaging);
