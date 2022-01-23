// The script running on the page in the renderer process.

console.log('Hello!');

import { PlaceholderOptions, updateText } from '../util/frontend';
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

const placeholderRegex = /^#+(\s*(a|b|time|team_a|team_b|player|boost)\s*#+)?$/;

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

	// parse style tag for predefined colors
	// TODO: proof of concept only, flesh this out more
	for (const style of svgDocument.querySelectorAll('style')) {
		style.textContent = (style.textContent ?? '')
			.replace(/#FF0000/gi, 'var(--teamcolor0primary)')
			.replace(/#00FF00/gi, 'var(--teamcolor1primary)');
	}
	let teamColorStyle = svgDocument.createElement('style');
	teamColorStyle.id = 'teamcolorstyle';
	teamColorStyle.textContent = `
		:root {
			--teamcolor0primary: #1873FF;
			--teamcolor1primary: #C26418;
		}
	`;
	svgDocument.documentElement.append(teamColorStyle);

	// get placeholders from SVG document
	let texts = svgDocument.querySelectorAll('text');
	let placeholders = [];

	// Reset the placeholders div - we're about to rewrite it
	let placeholdersDiv = document.getElementById('placeholders')!;
	placeholdersDiv.innerHTML = '';

	for (let i = 0; i < texts.length; i += 1) {
		const text = texts[i];

		let match = text.textContent?.match(placeholderRegex);
		if (!match) {
			continue;
		}

		placeholders.push(text);
		text.classList.add('overlay-placeholder');
		if (match[2]) {
			text.classList.add(`overlay-value-${match[2]}`);
		} else {
			text.classList.add(`overlay-value-unknown`);
		}
		text.classList.add('overlay-align-left'); // default

		let input = document.createElement('input');
		input.type = "text";
		input.value = match[0];

		function getHorizontalAlign (): PlaceholderOptions['horizontalAlign'] {
			if (text.classList.contains('overlay-align-left')) {
				return 'left';
			} else if (text.classList.contains('overlay-align-center')) {
				return 'center';
			} else {
				return 'right';
			}
		}

		const inputOnUpdate = () => {
			updateText(text, input.value, {
				horizontalAlign: getHorizontalAlign(),
				verticalAlign: 'center',
			});
			updatePreview();
		}
		input.addEventListener('input', inputOnUpdate);
		inputOnUpdate();

		placeholdersDiv.appendChild(input);

		let alignSelect = document.createElement('select');
		let optionLeft = document.createElement('option');
		optionLeft.textContent = 'Left';
		optionLeft.value = 'left';
		alignSelect.append(optionLeft);
		let optionCenter = document.createElement('option');
		optionCenter.textContent = 'Center';
		optionCenter.value = 'center';
		alignSelect.append(optionCenter);
		let optionRight = document.createElement('option');
		optionRight.textContent = 'Right';
		optionRight.value = 'right';
		alignSelect.append(optionRight);

		alignSelect.value = 'center';

		const alignSelectOnUpdate = () => {
			text.classList.remove('overlay-align-left');
			text.classList.remove('overlay-align-center');
			text.classList.remove('overlay-align-right');
			text.classList.add(`overlay-align-${alignSelect.value}`);
		}
		alignSelect.addEventListener('input', alignSelectOnUpdate);
		alignSelectOnUpdate();

		placeholdersDiv.append(alignSelect);
		placeholdersDiv.append(document.createElement('br'));
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
