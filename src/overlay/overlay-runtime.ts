// File executed in the context of the emitted overlay file when running in OBS.

import {PlaceholderOptions, updateText} from '../util/frontend';

// Find all the placeholders on the page
let texts = document.querySelectorAll('text');

/** A list of <text> elements whose text can be modified. */
let placeholders: SVGTextElement[] = [];

/** A set storing text alignment options for each placeholder. */
let placeholderOptions = new Map<SVGTextElement, PlaceholderOptions>();


/**
 * A map of state fields to placeholder <text> elements whose text
 * content should reflect the value of that field.
 */
const valuePlaceholderMap: Record<string, SVGTextElement[]> = {}

/** Updates the displayed value of a state field. */
function set(field: string, value: string) {
	for (const el of valuePlaceholderMap[field]) {
		updateText(el, value, placeholderOptions.get(el)!);
	}
}

/** Takes a number of seconds and formats it into a nice string. */
function formatGameTime (seconds: number, isOT: boolean) {
	let minutesText = Math.floor(seconds / 60);
	let secondsText = `${seconds % 60}`;
	if (secondsText.length < 2) {
		secondsText = `0${secondsText}`;
	}
	return `${isOT ? '+' : ''}${minutesText}:${secondsText}`;
}

// Wait for document to load - we need fonts and stuff to be ready
// before we can do bounding box calculations on the text elements
document.addEventListener('readystatechange', () => {
	if (document.readyState !== 'complete') {
		return;
	}

	// Set up all the text placeholders
	for (const text of texts) {
		if (!text.textContent?.match(/^[#\s]+$/)) {
			continue;
		}

		placeholders.push(text);
		let options: PlaceholderOptions = {
			horizontalAlign: 'center',
			verticalAlign: 'top',
		};
		placeholderOptions.set(text, options);

		updateText(text, '', options);
	}

	// Set up connections between game state and placeholders
	valuePlaceholderMap.score0 = [placeholders[2]];
	valuePlaceholderMap.score1 = [placeholders[1]];
	valuePlaceholderMap.clock = [placeholders[0]];

	// Connect to SOS plugin to receive game state updates
	let sosConnection = new WebSocket(`ws://localhost:49122`);
	sosConnection.addEventListener('close', event => {
		console.error('SOS connection closed:', event.code);
	});
	sosConnection.addEventListener('message', e => {
		const {event, data} = JSON.parse(e.data);
		if (event === 'sos:version') {
			console.log('SOS version:', data);
			return;
		}

		// Listen for game state updates and display values
		if (event === 'game:update_state') {
			console.log('received game state')
			set('score0', data.game.teams[0].score);
			set('score1', data.game.teams[1].score);
			set('clock', formatGameTime(data.game.time_seconds, data.game.isOT));
		}
	});
});
