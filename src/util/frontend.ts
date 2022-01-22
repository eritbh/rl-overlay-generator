export interface PlaceholderOptions {
	horizontalAlign?: 'left' | 'center' | 'right';
	verticalAlign?: 'top' | 'center' | 'bottom';
}

/**
 * Updates the text of the given text element, respecting its
 * configured text alignment.
 */
export function updateText(el: SVGTextElement, newText: string, {
	horizontalAlign = 'center',
	verticalAlign = 'center',
}: PlaceholderOptions = {}) {
	let oldRect = el.getBBox();

	el.textContent = newText;
	let newRect = el.getBBox();

	let horizontalOffset: number;
	if (horizontalAlign == 'center') {
		horizontalOffset = (oldRect.width - newRect.width) / 2;
	} else if (horizontalAlign == 'right') {
		horizontalOffset = oldRect.width - newRect.width;
	} else { // left or unknown
		horizontalOffset = 0;
	}

	let verticalOffset: number;
	if (verticalAlign == 'center') {
		verticalOffset = (oldRect.width - newRect.width) / 2;
	} else if (verticalAlign == 'bottom') {
		verticalOffset = oldRect.width - newRect.width;
	} else { // top or unknown
		verticalOffset = 0;
	}

	// TODO: update to handle other positioning methods? how universal is this?
	let currentTransform = el.getAttribute('transform') || 'matrix(1 0 0 1 0 0)';
	let newTransform = currentTransform.replace(/matrix\(1 0 0 1 ([\d\.]+) ([\d\.]+)\)/, (_, x, y) => `matrix(1 0 0 1 ${parseFloat(x) + horizontalOffset} ${parseFloat(y) + verticalOffset})`);
	el.setAttribute('transform', newTransform)
}
