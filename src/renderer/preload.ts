// Defines `window.messaging` for use in the main renderer script to enable IPC
// between main and renderer processes.

import { contextBridge, ipcRenderer } from "electron";

let messaging = {
	requestSVGInput () {
		return ipcRenderer.invoke('requestSVGInput');
	},
	saveOverlay (svg: string) {
		return ipcRenderer.invoke('saveOverlay', svg);
	}
};

export type Messaging = typeof messaging;
contextBridge.exposeInMainWorld('messaging', messaging);
