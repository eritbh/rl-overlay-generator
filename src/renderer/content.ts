// The script running on the page in the renderer process.

console.log('Hello!');

// things exposed to the main world from preload script
import { Messaging } from './preload';
declare global {
	interface Window {
		messaging: Messaging;
	}
}

let svg = '';

async function requestInput () {
	let response = await window.messaging.requestSVGInput();
	if (response.error) {
		alert(response.message);
		console.error(response);
	} else {
		svg = response.svg;
		document.getElementById('svg-preview')!.setAttribute('src', `data:image/svg+xml;base64,${btoa(svg)}`);
	}
}

// need this so rollup doesn't yeet it as an unused function
console.log(requestInput);
