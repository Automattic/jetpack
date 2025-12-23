/**
 * Jetpack Form Editor - Makes the form block unselectable and enforces block nesting.
 *
 * This script prevents the jetpack/contact-form block from being selected
 * in the jetpack-form custom post type editor, and ensures that blocks can
 * only be added inside the form block, not as siblings to it.
 *
 * It also registers the Form Document Settings plugin to display form settings
 * in the Document Settings sidebar.
 */

import { subscribe, select, dispatch } from '@wordpress/data';
import { registerPlugin } from '@wordpress/plugins';
import { FORM_POST_TYPE } from '../blocks/shared/util/constants.js';
import { FormDocumentSettings } from './form-document-settings.tsx';

import './style.scss';

let formBlockClientId = null;

/**
 * Lock the contact-form block to prevent selection.
 */
const lockFormBlock = () => {
	const { getBlocks, getSelectedBlockClientId } = select( 'core/block-editor' );

	const { updateBlockAttributes, clearSelectedBlock } = dispatch( 'core/block-editor' ) as {
		updateBlockAttributes: ( clientId: string, attributes: Record< string, unknown > ) => void;
		clearSelectedBlock: () => void;
	};

	const blocks = getBlocks();
	if ( blocks.length === 0 ) {
		return;
	}
	// Find the jetpack/contact-form block (should be the first and only root block).
	const formBlock = blocks.find( block => block.name === 'jetpack/contact-form' );
	if ( ! formBlock ) {
		return;
	}

	// Store the form block client ID for later use.
	formBlockClientId = formBlock.clientId;
	// Set the flag BEFORE making any changes to prevent recursion.
	// hasLocked = true;

	if ( ! formBlock.attributes?.lock?.remove ) {
		// Lock the block to prevent removal, moving, and selection.
		updateBlockAttributes( formBlockClientId, {
			lock: {
				remove: true,
				move: true,
			},
		} );
	}

	// If the form block is currently selected, clear the selection.
	const selectedBlockId = getSelectedBlockClientId();
	if ( selectedBlockId === formBlock.clientId ) {
		clearSelectedBlock();
	}

	// // Add CSS to hide the form block's selection outline and controls.
	if ( ! document.getElementById( 'jetpack-form-block-lock-styles' ) ) {
		const style = document.createElement( 'style' );
		style.id = 'jetpack-form-block-lock-styles';
		style.textContent = `
			/* Hide selection outline and controls for the form block */
			.wp-block[data-type="jetpack/contact-form"] > .block-editor-block-list__block-edit::before {
				display: none !important;
			}
			.wp-block[data-type="jetpack/contact-form"] > .block-editor-block-contextual-toolbar,
			.wp-block[data-type="jetpack/contact-form"] > .block-list-appender {
				display: none !important;
			}

			/* Hide the root-level block appender to prevent adding blocks outside the form */
			.editor-styles-wrapper > .block-editor-block-list__layout > .block-list-appender,
			.editor-styles-wrapper > .block-editor-block-list__layout > .wp-block > .block-list-appender {
				display: none !important;
			}
		`;
		document.head.appendChild( style );
	}
};

/**
 * Monitor for blocks added at the root level and move them inside the form.
 */
const enforceBlockNesting = () => {
	if ( ! formBlockClientId ) {
		return;
	}

	const { getBlocks } = select( 'core/block-editor' );

	const rootBlocks = getBlocks();
	if ( rootBlocks.length === 0 ) {
		return;
	}

	// Find any blocks that aren't the form block.
	const blocksToMove = rootBlocks.filter( block => block.clientId !== formBlockClientId );

	if ( blocksToMove.length === 0 ) {
		return;
	}

	const { moveBlocksToPosition } = dispatch( 'core/block-editor' ) as {
		moveBlocksToPosition: (
			clientIds: string[],
			source: string,
			destination: string,
			index: number
		) => void;
	};
	// Move each block inside the form block.
	blocksToMove.forEach( block => {
		// Get the current number of inner blocks to append at the end.
		const formBlock = rootBlocks.find( b => b.clientId === formBlockClientId );
		const targetIndex = formBlock ? formBlock.innerBlocks.length : 0;

		// Move the block from root to inside the form.
		moveBlocksToPosition(
			[ block.clientId ],
			'', // From root
			formBlockClientId, // To form block
			targetIndex
		);
	} );
};

/**
 * Remove default WordPress document panels for jetpack-form post type.
 * This makes the sidebar show only form-specific settings.
 */
const removeDefaultPanels = () => {
	const { getCurrentPostType } = select( 'core/editor' );
	if ( getCurrentPostType() !== FORM_POST_TYPE ) {
		return;
	}

	const { removeEditorPanel } = dispatch( 'core/edit-post' ) as {
		removeEditorPanel: ( panelName: string ) => void;
	};

	// Remove default WordPress panels that aren't relevant for forms
	const panelsToRemove = [
		'post-status', // Status & visibility
		'post-link', // Permalink
		'featured-image', // Featured image
		'post-excerpt', // Excerpt
		'discussion-panel', // Discussion
		'page-attributes', // Page attributes
	];

	panelsToRemove.forEach( panel => {
		removeEditorPanel( panel );
	} );
};

// Subscribe to editor changes to lock the form block when ready.
subscribe( () => {
	const { getCurrentPostType } = select( 'core/editor' );
	if ( getCurrentPostType() === FORM_POST_TYPE ) {
		lockFormBlock();
		enforceBlockNesting();
		removeDefaultPanels();
	}
} );

// Register Form Document Settings plugin
registerPlugin( 'jetpack-form-document-settings', {
	render: FormDocumentSettings,
	icon: null,
} );
