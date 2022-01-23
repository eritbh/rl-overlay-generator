// File executed in the context of the emitted overlay file when running in OBS.

import {PlaceholderOptions, updateText} from '../util/frontend';

// Find all the placeholders on the page
let texts = document.querySelectorAll('text');

/** A list of <text> elements whose text can be modified. */
let placeholders: SVGTextElement[] = [];

/** A set storing text alignment options for each placeholder. */
let placeholderOptions = new Map<SVGTextElement, PlaceholderOptions>();

/** Updates the displayed value of a state field. */
function set(field: string, value: string) {
	for (const el of placeholders) {
		if (el.classList.contains(`overlay-value-${field}`)) {
			updateText(el, value, placeholderOptions.get(el)!);
		}
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
		if (!text.classList.contains('overlay-placeholder')) {
			continue;
		}

		placeholders.push(text);
		let options: PlaceholderOptions = {
			horizontalAlign: text.classList.contains('overlay-align-left') ? 'left' : text.classList.contains('overlay-align-center') ? 'center' : 'right',
			verticalAlign: 'top',
		};
		placeholderOptions.set(text, options);

		updateText(text, '', options);
	}

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
			set('a', data.game.teams[0].score);
			set('b', data.game.teams[1].score);
			set('team_a', data.game.teams[0].name);
			set('team_b', data.game.teams[1].name);
			set('time', formatGameTime(data.game.time_seconds, data.game.isOT));

			const currentPlayer = data.players[data.game.target];
			if (currentPlayer) {
				set('player', currentPlayer.name);
				set('boost', currentPlayer.boost);
			} else {
				set('player', '');
				set('boost', '');
			}
		}
	});
});
