import { createRoot, createElement } from '@wordpress/element';
import BlockSuggestionActions from '../components/block-suggestion-actions';
import BlockSuggestionButtons from '../components/block-suggestion-buttons';
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

slots[ 'block-actions' ] = { container: null, root: null };
slots[ 'block-suggestion-buttons' ] = { container: null, root: null };

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

/**
 * Extract the block name from the block guideline modal.
 * In editing mode, reads the disabled TextControl and matches against block types.
 * In creating mode, reads the ComboboxControl's selected value.
 */
function getBlockNameFromModal( modal ) {
	const { select } = wp.data;
	const blockTypes = select( 'core/blocks' ).getBlockTypes();

	// Editing mode: disabled input shows block title.
	const disabledInput = modal.querySelector( 'input[disabled]' );
	if ( disabledInput?.value ) {
		return blockTypes.find( b => b.title === disabledInput.value )?.name;
	}

	// Creating mode: combobox with selected value.
	const combobox = modal.querySelector( 'input[role="combobox"]' );
	if ( combobox?.value ) {
		return blockTypes.find( b => b.title === combobox.value )?.name;
	}

	return null;
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

	// Block guideline modal injections.
	const blockModal = document.querySelector( '.block-guideline-modal' );
	const blockName = blockModal ? getBlockNameFromModal( blockModal ) : null;

	if ( blockName ) {
		// Suggestion actions (diff + accept/dismiss) inside textarea wrapper,
		// after the label but before the <textarea> input.
		inject(
			'block-actions',
			() => {
				const textareaInput = blockModal.querySelector( '.components-textarea-control__input' );
				const field = textareaInput?.parentElement;
				return field
					? {
							parent: field,
							before: textareaInput,
							className: 'jetpack-content-guidelines-ai__block-actions-container',
					  }
					: null;
			},
			BlockSuggestionActions,
			{ blockName }
		);

		// Improve/Accept/Dismiss buttons — row above the action bar.
		inject(
			'block-suggestion-buttons',
			() => {
				const actionsBar = blockModal.querySelector( '.block-guideline-modal__actions' );
				const vStack = actionsBar?.parentElement;
				return vStack
					? {
							parent: vStack,
							before: actionsBar,
							className: 'jetpack-content-guidelines-ai__block-suggestion-buttons-container',
					  }
					: null;
			},
			BlockSuggestionButtons,
			{ blockName }
		);
	}
}

/**
 * Start observing DOM and inject all components.
 *
 * We observe document.body (not a narrower container) for two reasons:
 * 1. WordPress Modal portals render directly on document.body — the block
 *    guideline modal lives outside any Gutenberg container, so a narrower
 *    root would miss it appearing.
 * 2. Gutenberg's Navigator can remove and re-add the main screen DOM
 *    (e.g. revision history navigation), so we can't rely on a specific
 *    container staying connected.
 *
 * The observer never disconnects for the same reasons. Callbacks are
 * debounced via requestAnimationFrame so runAll() fires at most once
 * per frame, and each inject() call is a no-op when its container is
 * still connected.
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
