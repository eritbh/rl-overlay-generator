import * as fs from 'fs';
import * as childProcess from 'child_process';

let overlaySVG = fs.readFileSync(process.argv[2], 'utf-8');

let preamble = overlaySVG.match(/^[\s\S]*?<svg[^>]*?>/)[0];

// Separate out <font>s and process them individually
let fonts = overlaySVG.match(/<font[\s\S]*?<\/font>/g);
for (let fontSource of fonts) {
	// Get the name of the font family so we know what to call it
	let fontFamily = fontSource.match(/font-family="([^"]*)"/)[1];

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
	childProcess.execSync(`"C:\\Program Files (x86)\\FontForgeBuilds\\bin\\fontforge.exe" -c "open('out-${fontFamily}.svg').generate('out-${fontFamily}.ttf')"`, {stdio: 'pipe'});

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
	overlaySVG = overlaySVG.replace(fontSource, `<style>${fontFaceCSS}</style>`);
}

// Wrap the SVG in an HTML document
let overlayHTML = fs.readFileSync('template.html', 'utf-8')
	.replace('OVERLAY_SVG_GOES_HERE', overlaySVG);

fs.writeFileSync(process.argv[3], overlayHTML, 'utf-8');

console.log(`Written HTML to ${process.argv[3]}`);
