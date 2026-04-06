import { createRoot, createElement } from '@wordpress/element';
import EmptyStateBanner from '../components/empty-state-banner';
import SectionGenerateButton from '../components/section-generate-button';
import SuggestionActions from '../components/suggestion-actions';
import SuggestionBadge from '../components/suggestion-badge';
import SuggestAllButton from '../components/suggest-all-button';
import { VALID_SECTIONS } from '../constants';

// Injection containers are tracked by reference. Before considering a slot "injected",
// we verify the container is still in the DOM — Gutenberg's <Navigator> removes and
// re-adds the main screen when navigating to/from revision history, which destroys
// our injected elements while JS module state persists.

let headerContainer = null;
let bannerContainer = null;
const badgeContainers = {};
const actionContainers = {};
const sectionButtonContainers = {};

/**
 * Check if an element is still attached to the document.
 *
 * @param {Element|null} el - The element to check.
 * @return {boolean} True if the element is connected to the DOM.
 */
function isInDOM( el ) {
	return el?.isConnected ?? false;
}

function injectHeaderButton() {
	if ( isInDOM( headerContainer ) ) {
		return;
	}

	const actionsSlot = document.querySelector( '.admin-ui-page__header-actions' );
	if ( ! actionsSlot ) {
		return;
	}

	headerContainer = document.createElement( 'div' );
	headerContainer.className = 'jetpack-content-guidelines-ai__header-container';
	actionsSlot.appendChild( headerContainer );
	createRoot( headerContainer ).render( createElement( SuggestAllButton ) );
}

function injectBanner() {
	if ( isInDOM( bannerContainer ) ) {
		return;
	}

	const list = document.querySelector( '.content-guidelines__list' );
	if ( ! list ) {
		return;
	}

	bannerContainer = document.createElement( 'div' );
	bannerContainer.className = 'jetpack-content-guidelines-ai__banner-container';
	list.parentElement.insertBefore( bannerContainer, list );
	createRoot( bannerContainer ).render( createElement( EmptyStateBanner ) );
}

function injectBadges() {
	for ( const slug of VALID_SECTIONS ) {
		if ( isInDOM( badgeContainers[ slug ] ) ) {
			continue;
		}

		const form = document.getElementById( `content-guidelines-${ slug }` );
		if ( ! form ) {
			continue;
		}

		const accordion = form.closest( '.content-guidelines__accordion' );
		if ( ! accordion ) {
			continue;
		}

		const trigger = accordion.querySelector( '.content-guidelines__accordion-trigger' );
		if ( ! trigger ) {
			continue;
		}

		const hStack = trigger.firstElementChild;
		if ( ! hStack ) {
			continue;
		}

		const container = document.createElement( 'span' );
		container.className = 'jetpack-content-guidelines-ai__badge-container';
		const chevron = hStack.lastElementChild;
		if ( chevron ) {
			hStack.insertBefore( container, chevron );
		} else {
			hStack.appendChild( container );
		}

		createRoot( container ).render( createElement( SuggestionBadge, { slug } ) );
		badgeContainers[ slug ] = container;
	}
}

function injectSuggestionActions() {
	for ( const slug of VALID_SECTIONS ) {
		if ( isInDOM( actionContainers[ slug ] ) ) {
			continue;
		}

		const form = document.getElementById( `content-guidelines-${ slug }` );
		if ( ! form ) {
			continue;
		}

		const vStack = form.firstElementChild;
		if ( ! vStack ) {
			continue;
		}

		const container = document.createElement( 'div' );
		container.className = 'jetpack-content-guidelines-ai__actions-container';
		vStack.insertBefore( container, vStack.firstChild );

		createRoot( container ).render( createElement( SuggestionActions, { slug } ) );
		actionContainers[ slug ] = container;
	}
}

function injectSectionButtons() {
	for ( const slug of VALID_SECTIONS ) {
		if ( isInDOM( sectionButtonContainers[ slug ] ) ) {
			continue;
		}

		const form = document.getElementById( `content-guidelines-${ slug }` );
		if ( ! form ) {
			continue;
		}

		const saveButton = form.querySelector( '.save-button' );
		const hStack = saveButton?.parentElement;
		if ( ! hStack ) {
			continue;
		}

		const container = document.createElement( 'div' );
		container.className = 'jetpack-content-guidelines-ai__section-button-container';
		hStack.appendChild( container );

		createRoot( container ).render( createElement( SectionGenerateButton, { slug } ) );
		sectionButtonContainers[ slug ] = container;
	}
}

function runAll() {
	injectHeaderButton();
	injectBanner();
	injectBadges();
	injectSuggestionActions();
	injectSectionButtons();
}

/**
 * Start observing DOM and inject all components.
 * The observer never disconnects because Gutenberg's Navigator can
 * remove and re-add the main screen (e.g. revision history navigation).
 */
export function startInjection() {
	runAll();

	const observer = new MutationObserver( () => runAll() );
	observer.observe( document.body, { childList: true, subtree: true } );
}
