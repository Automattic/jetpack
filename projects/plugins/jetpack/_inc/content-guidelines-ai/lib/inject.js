import { createRoot, createElement } from '@wordpress/element';
import GenerateButton from '../components/generate-button';
import SuggestAllButton from '../components/suggest-all-button';
import { VALID_SECTIONS } from '../constants';

/**
 * Inject GenerateButton into each guideline accordion form.
 *
 * Uses form `id` attributes as primary selectors for stability.
 * Falls back to `.save-button` class to find the button row.
 *
 * @return {boolean} True if all expected sections have been injected.
 */
export function injectButtons() {
	let injectedCount = 0;

	for ( const slug of VALID_SECTIONS ) {
		const form = document.getElementById( `content-guidelines-${ slug }` );
		if ( ! form ) {
			continue;
		}

		// Already injected.
		if ( form.querySelector( '.jetpack-content-guidelines-ai__generate-button' ) ) {
			injectedCount++;
			continue;
		}

		// Find the HStack containing the save button.
		const saveButton = form.querySelector( '.save-button' );
		const hStack = saveButton?.parentElement;
		if ( ! hStack ) {
			continue;
		}

		// Create a container and render the button into it.
		const container = document.createElement( 'div' );
		container.className = 'jetpack-content-guidelines-ai__button-container';
		hStack.appendChild( container );
		createRoot( container ).render( createElement( GenerateButton, { slug } ) );

		injectedCount++;
	}

	return injectedCount === VALID_SECTIONS.length;
}

let headerInjected = false;

/**
 * Inject SuggestAllButton into the page header.
 *
 * @return {boolean} True if the header button has been injected.
 */
export function injectHeaderButton() {
	if ( headerInjected ) {
		return true;
	}

	const header = document.querySelector( '.admin-ui-page__header' );
	if ( ! header ) {
		return false;
	}

	const container = document.createElement( 'div' );
	container.className = 'jetpack-content-guidelines-ai__header-container';
	header.appendChild( container );
	createRoot( container ).render( createElement( SuggestAllButton ) );

	headerInjected = true;
	return true;
}

/**
 * Start observing DOM and inject all components.
 * Disconnects once everything has been injected.
 */
export function startInjection() {
	const allDone = () => injectButtons() && injectHeaderButton();

	if ( allDone() ) {
		return;
	}

	const observer = new MutationObserver( () => {
		if ( allDone() ) {
			observer.disconnect();
		}
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
}
