// The script running on the page in the renderer process.

console.log('Hello!');

// things exposed to the main world from preload script
import { Messaging } from './preload';
declare global {
	interface Window {
		messaging: Messaging;
	}
}

window.messaging.logHello();
