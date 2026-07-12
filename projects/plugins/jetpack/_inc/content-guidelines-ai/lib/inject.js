import { select } from '@wordpress/data';
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

// Block name the block-modal slots were last rendered with. Lets runAll()
// detect when the create-mode combobox switches to a different block while
// the slots are still mounted.
let lastBlockName = null;

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
 * Unmount a slot's React root and remove its container from the DOM.
 *
 * Unlike inject()'s cleanup path, the container may still be connected —
 * used when a slot must re-render with different props (e.g. the block
 * modal's combobox switching blocks).
 *
 * @param {string} key - Slot key in the slots map.
 */
function unmountSlot( key ) {
	const slot = slots[ key ];
	if ( slot.root ) {
		slot.root.unmount();
		slot.root = null;
	}
	if ( slot.container ) {
		slot.container.remove();
		slot.container = null;
	}
}

/**
 * Extract the block name from the block guideline modal.
 * In editing mode, reads the disabled TextControl and matches against block types.
 * In creating mode, reads the ComboboxControl's selected value.
 */
function getBlockNameFromModal( modal ) {
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
	// Header button — right-aligned in the wp-admin Page header, where the
	// native header actions would render. The gutenberg page passes no
	// `actions` to <Page>, so that slot is never created; instead we target the
	// header-content row (flex, justify: space-between) that holds the title and
	// append the button as its second child so space-between pushes it to the
	// right. All header classes are hashed CSS-module names, so we locate the
	// row structurally: the space-between flex row containing the page <h1>.
	inject(
		'header',
		() => {
			// Wait until the guidelines have loaded before mounting the button.
			// Gutenberg renders the list only after its async fetch resolves
			// (a spinner shows until then); mounting earlier reads the empty
			// default store and flickers the label "Generate" -> "Improve".
			if ( ! document.querySelector( '.guidelines__list' ) ) {
				return null;
			}

			const region = document.querySelector( '.admin-ui-navigable-region' );
			const heading = region?.querySelector( 'h1' );
			let row = heading?.parentElement;
			while ( row && row !== region ) {
				const style = window.getComputedStyle( row );
				if (
					style.display === 'flex' &&
					style.flexDirection === 'row' &&
					style.justifyContent.includes( 'between' )
				) {
					break;
				}
				row = row.parentElement;
			}
			return row && row !== region
				? {
						parent: row,
						className: 'jetpack-content-guidelines-ai__header-container',
				  }
				: null;
		},
		SuggestAllButton
	);

	// Upgrade notice — shown above the guideline list when AI is unavailable.
	inject(
		'upgrade-notice',
		() => {
			const list = document.querySelector( '.guidelines__list' );
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
			const list = document.querySelector( '.guidelines__list' );
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

	// Per-section injections. Sections are matched by the stable `data-slug`
	// attribute on each `.guidelines__list-item`. The per-section form is
	// always present in the DOM (the CollapsibleCard keeps its content mounted
	// while collapsed).
	for ( const slug of VALID_SECTIONS ) {
		// Steady-state fast path: once this section's three slots are injected
		// and still connected, there is nothing to do — skip the DOM queries so
		// the observer's per-frame work stays cheap. If the <Navigator> removes
		// the screen, the containers disconnect and we fall through to re-inject.
		if (
			slots[ `badge-${ slug }` ].container?.isConnected &&
			slots[ `actions-${ slug }` ].container?.isConnected &&
			slots[ `button-${ slug }` ].container?.isConnected
		) {
			continue;
		}

		const item = document.querySelector( `.guidelines__list-item[data-slug="${ slug }"]` );
		const form = item?.querySelector( 'form' );
		if ( ! form ) {
			continue;
		}

		// Badge in the accordion header, to the left of the chevron.
		//
		// CollapsibleCard.Header renders the heading wrapping a flex trigger row
		// whose children are the title/description block and, last, the chevron's
		// positioner. Appending to the row puts the badge to the right of the
		// chevron, which pushes the chevron leftward only on sections that have a
		// badge — so chevrons no longer line up across sections. Insert the badge
		// before the chevron instead: the chevron stays the last child (flush to
		// the right and aligned across every section) and the badge sits just to
		// its left.
		inject(
			`badge-${ slug }`,
			() => {
				const heading = item.querySelector( 'h1, h2, h3, h4, h5, h6' );
				const trigger = heading?.firstElementChild ?? heading;
				const chevron = trigger?.lastElementChild;
				return trigger
					? {
							parent: trigger,
							before: chevron,
							className: 'jetpack-content-guidelines-ai__badge-container',
							tag: 'span',
					  }
					: null;
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

		// Per-section generate button next to the Save button (the form's
		// primary submit button lives in an HStack with the Clear button).
		inject(
			`button-${ slug }`,
			() => {
				const saveButton = form.querySelector( 'button[type="submit"]' );
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

	// Resolve the block name on every pass while the modal is open — even when
	// the slots are already mounted. In create mode the user can switch the
	// combobox to a different block after our components rendered, and
	// blockName is bound as a prop at render time. When the resolved name
	// changes, tear the mounted slots down so they re-inject below with the
	// new name; otherwise a suggestion generated for the previous block would
	// be accepted into the newly selected one. Unmounting also runs
	// BlockSuggestionActions' cleanup, clearing the stale suggestion from the
	// store.
	const blockName = blockModal ? getBlockNameFromModal( blockModal ) : null;

	if ( blockName !== lastBlockName ) {
		unmountSlot( 'block-actions' );
		unmountSlot( 'block-suggestion-buttons' );
		lastBlockName = blockName;
	}

	// Always invoke inject so previously mounted roots get unmounted when
	// the modal closes — findParent() returns null for "no place to inject"
	// and inject()'s cleanup path handles the disconnected container.
	inject(
		'block-actions',
		() => {
			if ( ! blockName || ! blockModal ) {
				return null;
			}
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
		{ blockName, blockModal }
	);

	inject(
		'block-suggestion-buttons',
		() => {
			if ( ! blockName || ! blockModal ) {
				return null;
			}
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
		{ blockName, blockModal }
	);
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
let injectionStarted = false;

export function startInjection() {
	if ( injectionStarted ) {
		return;
	}
	injectionStarted = true;

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
