/**
 * Jetpack Form Editor - Keeps the form block selected and enforces block nesting.
 *
 * This script ensures that the jetpack/contact-form block remains selected
 * in the jetpack-form custom post type editor when no other block is selected,
 * and ensures that blocks can only be added inside the form block, not as siblings to it.
 * It also locks the form block to prevent it from being moved or removed.
 */

import { subscribe, select, dispatch } from '@wordpress/data';
import { unregisterPlugin, registerPlugin } from '@wordpress/plugins';
import { FORM_POST_TYPE } from '../blocks/shared/util/constants.js';
import { useFormRenameCommand } from './use-form-rename-command.tsx';
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
 * Form Rename Command Component
 * Renders the rename modal and registers the command
 *
 * @return {JSX.Element|null} The rename modal component or null
 */
function FormRenameCommand() {
	return useFormRenameCommand();
}

// Register the rename command plugin
registerPlugin( 'jetpack-form-rename-command', {
	render: FormRenameCommand,
} );

/**
 * Move the Jetpack contact form block category to the front in the editor.
 */
const moveFormsCategoryToFront = () => {
	const { getCategories } = select( 'core/blocks' );
	const { setCategories } = dispatch( 'core/blocks' ) as {
		setCategories: ( categories: unknown[] ) => void;
	};

	const categories = getCategories();
	const newCategories = moveCategoryToFront( categories );
	setCategories( newCategories );
};

/**
 * Move the Jetpack contact form block category back to its original position.
 */
const moveFormsCategoryToBack = () => {
	const { getCategories } = select( 'core/blocks' );
	const { setCategories } = dispatch( 'core/blocks' ) as {
		setCategories: ( categories: unknown[] ) => void;
	};

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
 * Lock the contact-form block to moving and removing the block.
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
		// Lock the block to prevent removal and moving
		updateBlockAttributes( formBlockClientId, {
			lock: {
				remove: true,
				move: true,
			},
		} );
	}
};

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

// State tracking for performance optimization
let lastBlockCount = 0;
let lastRootBlockIds = '';
let lastSelectedBlockId: string | null | undefined = null;
let isFormBlockLocked = false;

let unsubscribe: ( () => void ) | null = null;

// Subscribe to editor changes to lock the form block when ready.
const setupFormEditorSubscription = () => {
	if ( unsubscribe ) {
		return;
	}
	unsubscribe = subscribe( () => {
		const { getCurrentPostType } = select( 'core/editor' );
		const isCurrentPostTypeJetpackForm = getCurrentPostType() === FORM_POST_TYPE;
		if ( isCurrentPostTypeJetpackForm ) {
			if ( ! formBlockClientId ) {
				locateFormBlock(); // Locate the form block if we haven't
			}

			const { getBlocks, getSelectedBlockClientId, getBlockCount } = select( 'core/block-editor' );

			// Quick check: only get block list if count changed
			const currentBlockCount = getBlockCount();
			if ( currentBlockCount !== lastBlockCount ) {
				lastBlockCount = currentBlockCount;
				const rootBlocks = getBlocks();
				const currentRootBlockIds = rootBlocks.map( b => b.clientId ).join( ',' );
				
				// Only enforce nesting if root block structure changed
				if ( currentRootBlockIds !== lastRootBlockIds ) {
					lastRootBlockIds = currentRootBlockIds;
					enforceBlockNesting();
				}
			}

			// Only check selection when it changes
			const currentSelectedBlockId = getSelectedBlockClientId();
			if ( currentSelectedBlockId !== lastSelectedBlockId ) {
				lastSelectedBlockId = currentSelectedBlockId;
				enforceBlockSelection();
			}

			// Only lock the form block once - lockFormBlock handles its own guards
			if ( ! isFormBlockLocked && formBlockClientId ) {
				lockFormBlock();
				isFormBlockLocked = true;
			}

			if ( ! categoriesFiltered ) {
				categoriesFiltered = true;
				moveFormsCategoryToFront();
				unregisterPlugin( 'block-directory' );
			}
		} else if ( categoriesFiltered ) {
			categoriesFiltered = false;
			moveFormsCategoryToBack();
		}

		if ( isCurrentPostTypeJetpackForm === isJetpackFormEditor ) {
			return;
		}

		if ( isCurrentPostTypeJetpackForm ) {
			document.body.classList.add( 'post-type-jetpack_form' );
		} else {
			document.body.classList.remove( 'post-type-jetpack_form' );
			formBlockClientId = null; // Reset the form block client ID if we are not in the Form editor anymore.
			categoriesFiltered = false; // Reset the flag
			// Reset performance tracking state
			lastBlockCount = 0;
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
