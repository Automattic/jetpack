import { createRoot, createElement } from '@wordpress/element';
import EmptyStateBanner from '../components/empty-state-banner';
import SectionGenerateButton from '../components/section-generate-button';
import SuggestAllButton from '../components/suggest-all-button';
import SuggestionActions from '../components/suggestion-actions';
import SuggestionBadge from '../components/suggestion-badge';
import UpgradeNotice from '../components/upgrade-notice';
import { VALID_SECTIONS } from '../constants';

// Each injection point tracks both the DOM container and its React root.
// Before re-injecting, we unmount the old root to ensure proper cleanup
// of effects and subscriptions. We verify containers via isConnected since
// Gutenberg's <Navigator> removes/re-adds the main screen DOM when
// navigating to revision history and back.

const slots = {
	header: { container: null, root: null },
	'upgrade-notice': { container: null, root: null },
	banner: { container: null, root: null },
};

for ( const slug of VALID_SECTIONS ) {
	slots[ `badge-${ slug }` ] = { container: null, root: null };
	slots[ `actions-${ slug }` ] = { container: null, root: null };
	slots[ `button-${ slug }` ] = { container: null, root: null };
}

/**
 * Inject a React component into the DOM, reusing or replacing the slot.
 *
 * @param {string}   key        - Slot key in the slots map.
 * @param {Function} findParent - Returns { parent, before, className } or null.
 * @param {Function} Component  - React component to render.
 * @param {Object}   [props]    - Props to pass to the component.
 */
function inject( key, findParent, Component, props ) {
	const slot = slots[ key ];

	// Already injected and still in DOM — nothing to do.
	if ( slot.container?.isConnected ) {
		return;
	}

	// Container was removed — unmount the old root to clean up effects.
	if ( slot.root ) {
		slot.root.unmount();
		slot.root = null;
		slot.container = null;
	}

	const target = findParent();
	if ( ! target ) {
		return;
	}

	const { parent, before, className, tag } = target;
	const container = document.createElement( tag || 'div' );
	container.className = className;

	if ( before ) {
		parent.insertBefore( container, before );
	} else {
		parent.appendChild( container );
	}

	const root = createRoot( container );
	root.render( createElement( Component, props ) );

	slot.container = container;
	slot.root = root;
}

function runAll() {
	// Header button.
	inject(
		'header',
		() => {
			const actionsSlot = document.querySelector( '.admin-ui-page__header-actions' );
			return actionsSlot
				? { parent: actionsSlot, className: 'jetpack-content-guidelines-ai__header-container' }
				: null;
		},
		SuggestAllButton
	);

	// Upgrade notice — shown above the guideline list when AI is unavailable.
	inject(
		'upgrade-notice',
		() => {
			const list = document.querySelector( '.content-guidelines__list' );
			return list
				? {
						parent: list.parentElement,
						before: list,
						className: 'jetpack-content-guidelines-ai__upgrade-notice-container',
				  }
				: null;
		},
		UpgradeNotice
	);

	// Empty state banner.
	inject(
		'banner',
		() => {
			const list = document.querySelector( '.content-guidelines__list' );
			return list
				? {
						parent: list.parentElement,
						before: list,
						className: 'jetpack-content-guidelines-ai__banner-container',
				  }
				: null;
		},
		EmptyStateBanner
	);

	// Per-section injections.
	for ( const slug of VALID_SECTIONS ) {
		const form = document.getElementById( `content-guidelines-${ slug }` );
		if ( ! form ) {
			continue;
		}

		// Badge in accordion header.
		inject(
			`badge-${ slug }`,
			() => {
				const accordion = form.closest( '.content-guidelines__accordion' );
				const trigger = accordion?.querySelector( '.content-guidelines__accordion-trigger' );
				const hStack = trigger?.firstElementChild;
				if ( ! hStack ) {
					return null;
				}
				return {
					parent: hStack,
					before: hStack.lastElementChild,
					className: 'jetpack-content-guidelines-ai__badge-container',
					tag: 'span',
				};
			},
			SuggestionBadge,
			{ slug }
		);

		// Suggestion actions (diff + accept/dismiss) at top of form.
		inject(
			`actions-${ slug }`,
			() => {
				const vStack = form.firstElementChild;
				return vStack
					? {
							parent: vStack,
							before: vStack.firstChild,
							className: 'jetpack-content-guidelines-ai__actions-container',
					  }
					: null;
			},
			SuggestionActions,
			{ slug }
		);

		// Per-section generate button next to save.
		inject(
			`button-${ slug }`,
			() => {
				const saveButton = form.querySelector( '.save-button' );
				const hStack = saveButton?.parentElement;
				return hStack
					? {
							parent: hStack,
							className: 'jetpack-content-guidelines-ai__section-button-container',
					  }
					: null;
			},
			SectionGenerateButton,
			{ slug }
		);
	}
}

/**
 * Start observing DOM and inject all components.
 * The observer never disconnects because Gutenberg's Navigator can
 * remove and re-add the main screen (e.g. revision history navigation).
 * Callbacks are debounced via requestAnimationFrame to avoid running
 * on every individual DOM mutation.
 */
export function startInjection() {
	runAll();

	let scheduled = false;
	const observer = new MutationObserver( () => {
		if ( ! scheduled ) {
			scheduled = true;
			requestAnimationFrame( () => {
				scheduled = false;
				runAll();
			} );
		}
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
}
