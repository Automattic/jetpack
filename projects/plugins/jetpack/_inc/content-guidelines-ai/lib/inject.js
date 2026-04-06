import { createRoot, createElement } from '@wordpress/element';
import EmptyStateBanner from '../components/empty-state-banner';
import SectionGenerateButton from '../components/section-generate-button';
import SuggestionActions from '../components/suggestion-actions';
import SuggestionBadge from '../components/suggestion-badge';
import SuggestAllButton from '../components/suggest-all-button';
import { VALID_SECTIONS } from '../constants';

let headerInjected = false;

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

function injectBadges() {
	for ( const slug of VALID_SECTIONS ) {
		if ( badgeRoots[ slug ] ) {
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

		// The trigger has an HStack > [VStack(title+desc), chevron_or_HStack].
		// We want to insert the badge before the chevron.
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

		const root = createRoot( container );
		root.render( createElement( SuggestionBadge, { slug } ) );
		badgeRoots[ slug ] = root;
	}
}

const actionRoots = {};

function injectSuggestionActions() {
	for ( const slug of VALID_SECTIONS ) {
		if ( actionRoots[ slug ] ) {
			continue;
		}

		const form = document.getElementById( `content-guidelines-${ slug }` );
		if ( ! form ) {
			continue;
		}

		// Insert suggestion actions at the top of the form's VStack.
		const vStack = form.firstElementChild;
		if ( ! vStack ) {
			continue;
		}

		const container = document.createElement( 'div' );
		container.className = 'jetpack-content-guidelines-ai__actions-container';
		vStack.insertBefore( container, vStack.firstChild );

		const root = createRoot( container );
		root.render( createElement( SuggestionActions, { slug } ) );
		actionRoots[ slug ] = root;
	}
}

const sectionButtonRoots = {};

function injectSectionButtons() {
	for ( const slug of VALID_SECTIONS ) {
		if ( sectionButtonRoots[ slug ] ) {
			continue;
		}

		const form = document.getElementById( `content-guidelines-${ slug }` );
		if ( ! form ) {
			continue;
		}

		// Find the HStack containing the save button.
		const saveButton = form.querySelector( '.save-button' );
		const hStack = saveButton?.parentElement;
		if ( ! hStack ) {
			continue;
		}

		const container = document.createElement( 'div' );
		container.className = 'jetpack-content-guidelines-ai__section-button-container';
		hStack.appendChild( container );

		const root = createRoot( container );
		root.render( createElement( SectionGenerateButton, { slug } ) );
		sectionButtonRoots[ slug ] = root;
	}
}

/**
 * Start observing DOM and inject all components.
 */
export function startInjection() {
	injectHeaderButton();
	injectBanner();
	injectBadges();
	injectSuggestionActions();
	injectSectionButtons();

	const observer = new MutationObserver( () => {
		injectHeaderButton();
		injectBanner();
		injectBadges();
		injectSuggestionActions();
		injectSectionButtons();
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
}
