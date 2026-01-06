/**
 * Jetpack Form Editor - Keeps the form block selected and enforces block nesting.
 *
 * This script ensures that the jetpack/contact-form block remains selected
 * in the jetpack-form custom post type editor when no other block is selected,
 * and ensures that blocks can only be added inside the form block, not as siblings to it.
 * It also locks the form block to prevent it from being moved or removed.
 */

import { subscribe, select, dispatch } from '@wordpress/data';
import { unregisterPlugin } from '@wordpress/plugins';
import { FORM_POST_TYPE } from '../blocks/shared/util/constants.js';
import {
	findFormBlock,
	getInsertionIndex,
	shouldLockBlock,
	getBlocksToMove,
} from './utils/block-utils';
import {
	moveContactFormCategoryToFront as moveCategoryToFront,
	moveContactFormCategoryToBack as moveCategoryToBack,
} from './utils/category-utils';

import './style.scss';

/**
 * Move the Jetpack contact form block category to the front in the editor.
 * @return previous categories array
 */
const moveFormsCategoryToFront = () => {
	const { getCategories } = select( 'core/blocks' );
	const { setCategories } = dispatch( 'core/blocks' ) as {
		setCategories: ( categories: unknown[] ) => void;
	};

	const categories = getCategories();
	const newCategories = moveCategoryToFront( categories );
	setCategories( newCategories );
	return categories;
};

/**
 * Move the Jetpack contact form block category back to its original position.
 * @param previousCategories - The previous categories array to restore
 */
const moveFormsCategoryBackToOriginalOrder = ( previousCategories: unknown[] ) => {
	const { setCategories } = dispatch( 'core/blocks' ) as {
		setCategories: ( categories: unknown[] ) => void;
	};
	if ( previousCategories.length !== 0 ) {
		setCategories( previousCategories );
		return;
	}

	const { getCategories } = select( 'core/blocks' );
	const categories = getCategories();
	const newCategories = moveCategoryToBack( categories );
	setCategories( newCategories );
};

let formBlockClientId = null;
/**
 * Locate the contact-form block in the editor and store its client ID.
 */
const locateFormBlock = () => {
	const { getBlocks } = select( 'core/block-editor' );
	const blocks = getBlocks();

	const formBlock = findFormBlock( blocks );

	if ( formBlock ) {
		formBlockClientId = formBlock.clientId;
	}
};

/**
 * Lock the contact-form block to prevent moving and removing the block.
 */
const lockFormBlock = () => {
	if ( ! formBlockClientId ) {
		return;
	}

	const { getBlock } = select( 'core/block-editor' );
	const { updateBlockAttributes } = dispatch( 'core/block-editor' ) as {
		updateBlockAttributes: ( clientId: string, attributes: Record< string, unknown > ) => void;
	};

	const formBlock = getBlock( formBlockClientId );
	if ( ! formBlock ) {
		return;
	}

	if ( shouldLockBlock( formBlock ) ) {
		updateBlockAttributes( formBlockClientId, {
			lock: {
				remove: true,
				move: true,
			},
		} );
	}
};

/**
 * Ensure the contact-form block is always selected when no other block is selected.
 */
const enforceBlockSelection = () => {
	if ( ! formBlockClientId ) {
		return;
	}
	const { getSelectedBlockClientId, hasMultiSelection } = select( 'core/block-editor' );

	if ( hasMultiSelection() ) {
		return;
	}
	const selectedBlockId = getSelectedBlockClientId();
	if ( ! selectedBlockId ) {
		const { selectBlock } = dispatch( 'core/block-editor' ) as {
			selectBlock: ( clientId: string ) => void;
		};
		selectBlock( formBlockClientId );
	}
};

/**
 * Monitor for blocks added at the root level and move them inside the form.
 * Uses pure utility functions for easier testing.
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

	// Find any blocks that aren't the form block
	const blocksToMove = getBlocksToMove( rootBlocks, formBlockClientId );

	if ( blocksToMove.length === 0 ) {
		return;
	}

	// Get the form block to determine where to insert the blocks
	const formBlock = rootBlocks.find( b => b.clientId === formBlockClientId );
	const targetIndex = formBlock ? getInsertionIndex( formBlock ) : 0;

	// Collect all client IDs to move
	const clientIdsToMove = blocksToMove.map( block => block.clientId );

	const { moveBlocksToPosition } = dispatch( 'core/block-editor' ) as {
		moveBlocksToPosition: (
			clientIds: string[],
			source: string,
			destination: string,
			index: number
		) => void;
	};
	// Move all blocks at once to avoid state conflicts
	moveBlocksToPosition(
		clientIdsToMove,
		'', // From root
		formBlockClientId, // To form block
		targetIndex
	);
};

let isJetpackFormEditor: boolean | null = null;
let categoriesFiltered = false;

let lastRootBlockIds = '';
let lastSelectedBlockId: string | null | undefined = null;
let isFormBlockLocked = false;
let previousCategories: unknown[] | null = null;

let unsubscribe: ( () => void ) | null = null;

/**
 * Sets up a subscription to monitor editor state changes and enforce form editor behavior.
 */
const setupFormEditorSubscription = () => {
	if ( unsubscribe ) {
		return;
	}
	unsubscribe = subscribe( () => {
		const { getCurrentPostType } = select( 'core/editor' );
		const isCurrentPostTypeJetpackForm = getCurrentPostType() === FORM_POST_TYPE;
		if ( isCurrentPostTypeJetpackForm ) {
			// Check if root blocks changed by comparing their IDs
			// This detects when blocks are added, removed, or reordered at the root level
			const { getBlocks } = select( 'core/block-editor' );
			const rootBlocks = getBlocks();
			const currentRootBlockIds = JSON.stringify( rootBlocks.map( b => b.clientId ) );

			if ( currentRootBlockIds !== lastRootBlockIds ) {
				lastRootBlockIds = currentRootBlockIds;
				enforceBlockNesting();
			}

			// Only check selection when it changes
			const { getSelectedBlockClientId } = select( 'core/block-editor' );
			const currentSelectedBlockId = getSelectedBlockClientId();
			if ( currentSelectedBlockId !== lastSelectedBlockId ) {
				lastSelectedBlockId = currentSelectedBlockId;
				enforceBlockSelection();
			}

			// Only try to lock the form block once
			if ( ! isFormBlockLocked && formBlockClientId ) {
				lockFormBlock();
				// Verify the block is now locked by checking the attributes
				const { getBlock } = select( 'core/block-editor' );
				const formBlock = getBlock( formBlockClientId );
				const lock = formBlock?.attributes?.lock as
					| { remove?: boolean; move?: boolean }
					| undefined;
				if ( formBlock && lock?.remove && lock?.move ) {
					isFormBlockLocked = true;
				}
			}

			if ( ! formBlockClientId ) {
				locateFormBlock();
			}

			if ( ! categoriesFiltered ) {
				categoriesFiltered = true;
				previousCategories = moveFormsCategoryToFront();
				try {
					unregisterPlugin( 'block-directory' );
				} catch {
					// Plugin may not be registered, ignore.
				}
			}
		} else if ( categoriesFiltered ) {
			categoriesFiltered = false;
			moveFormsCategoryBackToOriginalOrder( previousCategories || [] );
		}

		if ( isCurrentPostTypeJetpackForm === isJetpackFormEditor ) {
			return;
		}

		if ( isCurrentPostTypeJetpackForm ) {
			document.body.classList.add( 'post-type-jetpack_form' );
		} else {
			document.body.classList.remove( 'post-type-jetpack_form' );
			formBlockClientId = null; // Reset the form block client ID if we are not in the Form editor anymore.

			// Reset performance tracking state
			lastRootBlockIds = '';
			lastSelectedBlockId = null;
			isFormBlockLocked = false;
		}
		// Update the flag.
		isJetpackFormEditor = isCurrentPostTypeJetpackForm;
	} );

	// Ensure we clean up the subscription when the editor/page unloads to avoid leaks.
	const handleUnload = () => {
		if ( unsubscribe ) {
			try {
				unsubscribe();
			} finally {
				unsubscribe = null;
			}
		}
		window.removeEventListener( 'beforeunload', handleUnload );
	};
	window.addEventListener( 'beforeunload', handleUnload );
};

setupFormEditorSubscription();
