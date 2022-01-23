// Utilities for SVG conversion

import * as fs from 'fs';
import * as childProcess from 'child_process';

/**
 * Given the contents of an SVG document, rewrites SVG <font> elements in the
 * document as CSS @font-face rules with embedded base64 font data.
 */
export function convertSVGFonts (svg: string) {
	let preamble = svg.match(/^[\s\S]*?<svg[^>]*?>/)?.[0];
	if (!preamble) throw new Error('malformed SVG');

	// Separate out <font>s and process them individually
	let fonts = svg.match(/<font[\s\S]*?<\/font>/g) ?? [];
	for (let fontSource of fonts) {
		// Get the name of the font family so we know what to call it
		let fontFamily = fontSource.match(/font-family="([^"]*)"/)?.[1];
		if (!fontFamily) throw new Error('<font> element with no family name');

		// Add the parts of the glyph outlines that Illustrator didn't generate, and
		// wrap the whole thing in <svg> so FontForge recognizes it
		const fixedFontSource = `${preamble}${fontSource.replace(/M(-?\d+,-?\d+)([^z]*?)(?=M|")/g, 'M$1$2L$1')}</svg>`;

		// Write the output to a temporary file because fontforge only opens files
		fs.writeFileSync(`out-${fontFamily}.svg`, fixedFontSource, {
			encoding: 'utf-8'
		});

		// Do some FontForge magic to convert the font from SVG to TTF
		// this is incredibly unsafe lmao
		// tried this at first with WOFF2 but ended up getting browser errors, TTF seems more stable
		childProcess.execSync(`fontforge -c "open('out-${fontFamily}.svg').generate('out-${fontFamily}.ttf')"`, {stdio: 'pipe'});

		// Read the TTF file, shove it in a data: URI, wrap it in a @font-face
		const woffSourceBuffer = fs.readFileSync(`out-${fontFamily}.ttf`);
		let fontDataURI = `data:font/ttf;base64,${woffSourceBuffer.toString('base64')}`;
		let fontFaceCSS = `
			@font-face {
				font-family: "${fontFamily}";
				src: url(${fontDataURI});
			}
		`;

		// Replace the original font data with a <style> that implements the font
		svg = svg.replace(fontSource, `<style>${fontFaceCSS}</style>`);
	}

	return svg;
}

const outputHTMLTemplate = fs.readFileSync('template.html', 'utf-8');
const outputRuntimeScript = fs.readFileSync('dist/overlay-runtime.js', 'utf-8');

/** Inserts the given SVG into the overlay template. */
export function createHTMLOverlayFromSVG (svg: string) {
	return outputHTMLTemplate
		// insert the runtime JS into the wrapper
		// TODO: we need a much better way to inject this source
		.replace(
			'OVERLAY_RUNTIME_JS_GOES_HERE',
			`<script>${outputRuntimeScript}</script>`
		)
		// insert the SVG into the wrapper
		.replace('OVERLAY_SVG_GOES_HERE', svg);
}
