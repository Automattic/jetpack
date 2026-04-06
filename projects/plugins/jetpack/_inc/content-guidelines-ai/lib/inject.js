import { createRoot, createElement } from '@wordpress/element';
import EmptyStateBanner from '../components/empty-state-banner';
import SuggestionActions from '../components/suggestion-actions';
import SuggestionBadge from '../components/suggestion-badge';
import SuggestAllButton from '../components/suggest-all-button';
import { VALID_SECTIONS } from '../constants';

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

const badgeRoots = {};

/**
 * Inject SuggestionBadge into each accordion header.
 * Badges show a "Suggestion" label or spinner next to the chevron.
 *
 * @return {boolean} True if all badges have been injected.
 */
function injectBadges() {
	let count = 0;

	for ( const slug of VALID_SECTIONS ) {
		if ( badgeRoots[ slug ] ) {
			count++;
			continue;
		}

		// Find the accordion trigger button via the form id.
		const form = document.getElementById( `content-guidelines-${ slug }` );
		if ( ! form ) {
			continue;
		}

		// The accordion card is the form's grandparent: card > div[hidden] > form
		const accordion = form.closest( '.content-guidelines__accordion' );
		if ( ! accordion ) {
			continue;
		}

		const trigger = accordion.querySelector( '.content-guidelines__accordion-trigger' );
		if ( ! trigger ) {
			continue;
		}

		// Insert badge before the chevron icon (last child of the HStack inside trigger).
		const hStack = trigger.firstElementChild;
		if ( ! hStack ) {
			continue;
		}

		const container = document.createElement( 'span' );
		container.className = 'jetpack-content-guidelines-ai__badge-container';
		// Insert before the chevron (last child).
		const chevron = hStack.lastElementChild;
		if ( chevron ) {
			hStack.insertBefore( container, chevron );
		} else {
			hStack.appendChild( container );
		}

		const root = createRoot( container );
		root.render( createElement( SuggestionBadge, { slug } ) );
		badgeRoots[ slug ] = root;

		count++;
	}

	return count === VALID_SECTIONS.length;
}

const actionRoots = {};

/**
 * Inject SuggestionActions into each accordion form.
 * Shows suggestion text with Accept/Dismiss when a suggestion exists.
 *
 * @return {boolean} True if all action containers have been injected.
 */
function injectSuggestionActions() {
	let count = 0;

	for ( const slug of VALID_SECTIONS ) {
		if ( actionRoots[ slug ] ) {
			count++;
			continue;
		}

		const form = document.getElementById( `content-guidelines-${ slug }` );
		if ( ! form ) {
			continue;
		}

		// Insert suggestion actions at the top of the form (before the DataForm).
		const container = document.createElement( 'div' );
		container.className = 'jetpack-content-guidelines-ai__actions-container';
		form.insertBefore( container, form.firstChild );

		const root = createRoot( container );
		root.render( createElement( SuggestionActions, { slug } ) );
		actionRoots[ slug ] = root;

		count++;
	}

	return count === VALID_SECTIONS.length;
}

/**
 * Start observing DOM and inject all components.
 * Does NOT disconnect — badges and actions need re-injection as accordions expand.
 */
export function startInjection() {
	// Inject what's available now.
	injectHeaderButton();
	injectBanner();
	injectBadges();
	injectSuggestionActions();

	// Keep observing for accordion expansions.
	const observer = new MutationObserver( () => {
		injectHeaderButton();
		injectBanner();
		injectBadges();
		injectSuggestionActions();
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
}
