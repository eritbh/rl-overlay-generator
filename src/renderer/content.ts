// The script running on the page in the renderer process.

console.log('Hello!');

import { updateText } from '../util/frontend';
// things exposed to the main world from preload script
import { Messaging } from './preload';
declare global {
	interface Window {
		messaging: Messaging;
	}
}

const domParser = new DOMParser();
let xmlSerializer = new XMLSerializer();
let svgDocument: XMLDocument | null = null;
let svgPreview = document.getElementById('svg-preview') as HTMLIFrameElement;

const placeholderRegex = /

async function requestInput () {
	let response = await window.messaging.requestSVGInput();
	if (response.error) {
		alert(response.message);
		console.error(response);
		return;
	}

	svgDocument = domParser.parseFromString(response.svg, 'image/svg+xml');

	function updatePreview () {
		let svgContent = xmlSerializer.serializeToString(svgDocument!);
		svgPreview.setAttribute('src', `data:image/svg+xml;utf-8,${encodeURIComponent(svgContent)}`);
	}
	updatePreview();

	// get placeholders from SVG document
	let texts = svgDocument.querySelectorAll('text');
	let placeholders = [];

	// Reset the placeholders div - we're about to rewrite it
	let placeholdersDiv = document.getElementById('placeholders')!;
	placeholdersDiv.innerHTML = '';

	for (let i = 0; i < texts.length; i += 1) {
		const text = texts[i];

		if (!text.textContent?.match(/^[#\s]+$/)) {
			continue;
		}

		placeholders.push(text);
		text.classList.add('overlay-placeholder', `overlay-placeholder-${i}`);

		let input = document.createElement('input');
		input.type = "text";
		input.addEventListener('input', () => {
			updateText(text, input.value, {
				horizontalAlign: 'center',
				verticalAlign: 'center',
			});
			updatePreview();
		});
		placeholdersDiv.appendChild(input);
	}
}

async function saveOutput () {
	if (!svgDocument) {
		alert('No SVG file loaded!');
		return;
	}

	let svg = xmlSerializer.serializeToString(svgDocument);

	let response = await window.messaging.saveOverlay(svg);
	if (response.error) {
		alert(response.message);
		console.error(response);
	} else {
		alert('Saved.');
	}
}

// need this so rollup doesn't yeet it as an unused function
console.log(requestInput, saveOutput);
