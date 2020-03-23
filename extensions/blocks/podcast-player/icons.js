/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';

function createSVGs() {
	// Prevent repeated initialization.
	if ( document.getElementById( 'jetpack-player-podcast-icons' ) ) {
		return;
	}

	const svgTemplate = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
	svgTemplate.id = 'jetpack-player-podcast-icons';
	svgTemplate.setAttribute( 'style', 'position: absolute; width: 0; height: 0; overflow: hidden;' );
	svgTemplate.setAttribute( 'version', '1.1' );
	svgTemplate.setAttribute( 'xmlns', 'http://www.w3.org/2000/svg' );
	svgTemplate.setAttribute( 'xmlns:xlink', 'http://www.w3.org/1999/xlink' );

	const soundIcon = `<symbol id="podcast-player-icon__sound" viewBox="0 0 24 24"><title id="podcast-player-icon__sound-title">${ __(
		'Playing',
		'jetpack'
	) }</title><path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/></symbol>`;
	const errorIcon = `<symbol id="podcast-player-icon__error" viewBox="0 0 24 24"><title id="podcast-player-icon__error-title">${ __(
		'Error',
		'jetpack'
	) }</title><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></symbol>`;
	svgTemplate.innerHTML = `<defs>${ soundIcon }${ errorIcon }</defs>`;
	// put it in the body
	document.body.appendChild( svgTemplate );
}

// Initialize SVGs.
createSVGs();

// Export individual icon references.
export const soundIcon =
	'<svg aria-labelledby="podcast-player-icon__sound-title"><use xlink:href="#podcast-player-icon__sound" /></svg>';
export const errorIcon =
	'<svg aria-labelledby="podcast-player-icon__error-title"><use xlink:href="#podcast-player-icon__error" /></svg>';
