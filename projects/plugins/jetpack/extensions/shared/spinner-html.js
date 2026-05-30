/**
 * Returns an inline SVG spinner matching the WordPress Core Spinner visual:
 * a gray circle track with a rotating quarter-arc indicator.
 *
 * Uses animateTransform for CSS-free animation, safe for frontend contexts
 * where wp-admin styles and `@wordpress/components` are unavailable.
 *
 * For React/JS editor and admin contexts, prefer the Spinner
 * component from `@wordpress/components`.
 *
 * @param {number} size - Width and height in pixels. Default 24.
 * @return {string} SVG markup string.
 */
export function getSpinnerHtml( size = 24 ) {
	const s = parseInt( size, 10 ) || 24;
	return (
		`<svg class="jetpack-spinner" width="${ s }" height="${ s }" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">` +
		'<circle cx="50" cy="50" r="46" fill="none" stroke="#ddd" stroke-width="8"/>' +
		'<path d="M 50 4 A 46 46 0 0 1 96 50" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round">' +
		'<animateTransform attributeName="transform" type="rotate" dur="1.4s" from="0 50 50" to="360 50 50" repeatCount="indefinite"/>' +
		'</path>' +
		'</svg>'
	);
}
