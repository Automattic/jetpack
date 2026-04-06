import { createRoot, createElement } from '@wordpress/element';
import EmptyStateBanner from '../components/empty-state-banner';
import SuggestAllButton from '../components/suggest-all-button';

let headerInjected = false;

/**
 * Inject SuggestAllButton into the page header.
 *
 * @return {boolean} True if the header button has been injected.
 */
function injectHeaderButton() {
	if ( headerInjected ) {
		return true;
	}

	// Target the actions slot inside the header row, not the outer header column.
	const actionsSlot = document.querySelector( '.admin-ui-page__header-actions' );
	if ( ! actionsSlot ) {
		return false;
	}

	const container = document.createElement( 'div' );
	container.className = 'jetpack-content-guidelines-ai__header-container';
	actionsSlot.appendChild( container );
	createRoot( container ).render( createElement( SuggestAllButton ) );

	headerInjected = true;
	return true;
}

let bannerInjected = false;

/**
 * Inject EmptyStateBanner before the guideline list.
 *
 * @return {boolean} True if the banner has been injected.
 */
function injectBanner() {
	if ( bannerInjected ) {
		return true;
	}

	const list = document.querySelector( '.content-guidelines__list' );
	if ( ! list ) {
		return false;
	}

	const container = document.createElement( 'div' );
	container.className = 'jetpack-content-guidelines-ai__banner-container';
	list.parentElement.insertBefore( container, list );
	createRoot( container ).render( createElement( EmptyStateBanner ) );

	bannerInjected = true;
	return true;
}

/**
 * Start observing DOM and inject all components.
 * Disconnects once everything has been injected.
 */
export function startInjection() {
	const allDone = () => injectHeaderButton() && injectBanner();

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
