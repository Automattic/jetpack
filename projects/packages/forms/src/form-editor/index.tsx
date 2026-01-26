/**
 * Jetpack Form Editor - Keeps the form block selected and enforces block nesting.
 *
 * This script ensures that the jetpack/contact-form block remains selected
 * in the jetpack-form custom post type editor when no other block is selected,
 * and ensures that blocks can only be added inside the form block, not as siblings to it.
 * It also locks the form block to prevent it from being moved or removed.
 */

import { subscribe, select, dispatch } from '@wordpress/data';
import { getPlugin, registerPlugin, unregisterPlugin } from '@wordpress/plugins';
import { FORM_POST_TYPE } from '../blocks/shared/util/constants.js';
import {
	activateBlockCategoryOverrides,
	deactivateBlockCategoryOverrides,
} from './utils/block-category-override';
import {
	BlockLock,
	findFormBlock,
	getInsertionIndex,
	shouldLockBlock,
	getBlocksToMove,
} from './utils/block-utils';
import {
	moveContactFormCategoryToFront as moveCategoryToFront,
	moveContactFormCategoryToBack as moveCategoryToBack,
	registerFormCategories,
	unregisterFormCategories,
} from './utils/category-utils';
import { getAllowedBlocks } from './utils/get-allowed-blocks';
import type { PluginSettings } from '@wordpress/plugins';

import './style.scss';

/**
 * Set up form editor categories and block category overrides.
 *
 * This function:
 * 1. Registers granular form categories (basic, contact-info, choice, advanced)
 * 2. Activates block category overrides to move blocks to the new categories
 * 3. Moves the contact-form category to the front (as a fallback for non-field blocks)
 *
 * @return Previous categories array for restoration.
 */
const setupFormEditorCategories = (): unknown[] => {
	const { getCategories } = select( 'core/blocks' );
	const { setCategories } = dispatch( 'core/blocks' ) as {
		setCategories: ( categories: unknown[] ) => void;
	};

	// Store original categories for later restoration
	const originalCategories = getCategories();

	// Register form categories first so they exist when blocks are reassigned
	let categories = getCategories();
	categories = registerFormCategories( categories );
	categories = moveCategoryToFront( categories );
	setCategories( categories );

	// Now activate block category overrides (moves blocks to the new categories)
	activateBlockCategoryOverrides();

	return originalCategories;
};

/**
 * Restore categories to their original state when leaving the form editor.
 *
 * This function:
 * 1. Deactivates block category overrides (restores blocks to contact-form category)
 * 2. Removes form categories from the category list
 * 3. Restores the original category order
 *
 * @param previousCategories - The previous categories array to restore
 */
const restoreOriginalCategories = ( previousCategories: unknown[] ) => {
	const { setCategories } = dispatch( 'core/blocks' ) as {
		setCategories: ( categories: unknown[] ) => void;
	};

	// Deactivate block category overrides first
	deactivateBlockCategoryOverrides();

	// If we have stored categories, restore them directly
	if ( previousCategories.length !== 0 ) {
		setCategories( previousCategories );
		return;
	}

	// Otherwise, remove form categories and restore order
	const { getCategories } = select( 'core/blocks' );
	let categories = getCategories();
	categories = unregisterFormCategories( categories );
	categories = moveCategoryToBack( categories );
	setCategories( categories );
};

/**
 * Subscription state — tracks editor state across ticks to detect changes.
 */
const state = {
	isFormEditor: null as boolean | null,
	formBlockClientId: null as string | null,
	categoriesSetUp: false,
	previousCategories: null as unknown[] | null,
	blockDirectoryPlugin: null as Record< string, unknown > | null,
	previousAllowedBlockTypes: null as string[] | boolean | null,
	lastRootBlockIds: '',
	lastSelectedBlockId: null as string | null | undefined,
	isFormBlockLocked: false,
};

/**
 * Disable the block directory plugin while in the form editor.
 * Stores the plugin settings so it can be re-enabled when leaving.
 */
const disableBlockDirectory = () => {
	const plugin = getPlugin( 'block-directory' );
	if ( ! plugin ) {
		return;
	}
	state.blockDirectoryPlugin = plugin as unknown as Record< string, unknown >;
	unregisterPlugin( 'block-directory' );
};

/**
 * Re-enable the block directory plugin when leaving the form editor.
 */
const restoreBlockDirectory = () => {
	if ( ! state.blockDirectoryPlugin ) {
		return;
	}
	registerPlugin( 'block-directory', state.blockDirectoryPlugin as unknown as PluginSettings );
	state.blockDirectoryPlugin = null;
};

/**
 * Restrict the editor to only allow form-related blocks.
 * Stores the previous setting so it can be restored when leaving.
 */
const restrictAllowedBlocks = () => {
	const { getSettings } = select( 'core/block-editor' );
	const { updateSettings } = dispatch( 'core/block-editor' ) as {
		updateSettings: ( settings: Record< string, unknown > ) => void;
	};

	const settings = getSettings() as { allowedBlockTypes?: string[] | boolean };
	const currentAllowed = settings.allowedBlockTypes ?? true;
	const newAllowed = getAllowedBlocks();

	state.previousAllowedBlockTypes = currentAllowed;
	updateSettings( { allowedBlockTypes: newAllowed } );
};

/**
 * Restore the original allowed block types when leaving the form editor.
 */
const restoreAllowedBlocks = () => {
	if ( state.previousAllowedBlockTypes === null ) {
		return;
	}
	const { updateSettings } = dispatch( 'core/block-editor' ) as {
		updateSettings: ( settings: Record< string, unknown > ) => void;
	};

	const restoring = state.previousAllowedBlockTypes;
	updateSettings( { allowedBlockTypes: restoring } );
	state.previousAllowedBlockTypes = null;
};

/**
 * Lock the contact-form block to prevent moving and removing the block.
 */
const lockFormBlock = () => {
	if ( ! state.formBlockClientId ) {
		return;
	}

	const { getBlock } = select( 'core/block-editor' );
	const { updateBlockAttributes } = dispatch( 'core/block-editor' ) as {
		updateBlockAttributes: ( clientId: string, attributes: Record< string, unknown > ) => void;
	};

	const formBlock = getBlock( state.formBlockClientId );
	if ( ! formBlock ) {
		return;
	}

	if ( shouldLockBlock( formBlock ) ) {
		updateBlockAttributes( state.formBlockClientId, {
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
	if ( ! state.formBlockClientId ) {
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
		selectBlock( state.formBlockClientId );
	}
};

/**
 * Monitor for blocks added at the root level and move them inside the form.
 * Uses pure utility functions for easier testing.
 */
const enforceBlockNesting = () => {
	if ( ! state.formBlockClientId ) {
		return;
	}

	const { getBlocks } = select( 'core/block-editor' );

	const rootBlocks = getBlocks();
	if ( rootBlocks.length === 0 ) {
		return;
	}

	// Find any blocks that aren't the form block
	const blocksToMove = getBlocksToMove( rootBlocks, state.formBlockClientId );

	if ( blocksToMove.length === 0 ) {
		return;
	}

	// Get the form block to determine where to insert the blocks
	const formBlock = rootBlocks.find( b => b.clientId === state.formBlockClientId );
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
		state.formBlockClientId, // To form block
		targetIndex
	);
};

let unsubscribe: ( () => void ) | null = null;

/**
 * Sets up a subscription to monitor editor state changes and enforce form editor behavior.
 */
const setupFormEditorSubscription = () => {
	if ( unsubscribe ) {
		return;
	}

	let isProcessing = false;
	unsubscribe = subscribe( () => {
		if ( isProcessing ) {
			return;
		}
		isProcessing = true;
		try {
			const { getCurrentPostType } = select( 'core/editor' );
			const isFormEditor = getCurrentPostType() === FORM_POST_TYPE;

			// 1. Handle form editor enter/leave transitions
			if ( isFormEditor !== state.isFormEditor ) {
				state.isFormEditor = isFormEditor;

				if ( isFormEditor ) {
					document.body.classList.add( 'post-type-jetpack_form' );
				} else {
					document.body.classList.remove( 'post-type-jetpack_form' );

					if ( state.categoriesSetUp ) {
						state.categoriesSetUp = false;
						restoreOriginalCategories( state.previousCategories || [] );
					}
					restoreBlockDirectory();
					restoreAllowedBlocks();

					state.formBlockClientId = null;
					state.lastRootBlockIds = '';
					state.lastSelectedBlockId = null;
					state.isFormBlockLocked = false;
				}
			}

			// 2. Early return if not in form editor
			if ( ! isFormEditor ) {
				return;
			}

			// 3. One-time category setup and block directory disable
			if ( ! state.categoriesSetUp ) {
				state.categoriesSetUp = true;
				state.previousCategories = setupFormEditorCategories();

				disableBlockDirectory();
			}

			// 4. React to root block changes (locate, select, nest)
			const { getBlocks } = select( 'core/block-editor' );
			const rootBlocks = getBlocks();
			const currentRootBlockIds = JSON.stringify( rootBlocks.map( b => b.clientId ) );

			if ( currentRootBlockIds !== state.lastRootBlockIds ) {
				state.lastRootBlockIds = currentRootBlockIds;

				// Re-locate the form block — it may have a new clientId after
				// block replacement (e.g. when Gutenberg parses the post content).
				const previousFormBlockClientId = state.formBlockClientId;
				const formBlock = findFormBlock( rootBlocks );
				state.formBlockClientId = formBlock ? formBlock.clientId : null;

				if ( state.formBlockClientId && state.formBlockClientId !== previousFormBlockClientId ) {
					state.isFormBlockLocked = false;
				}

				// DEBUG: Track when form block first appears
				if ( state.formBlockClientId && ! previousFormBlockClientId ) {
					// Defer restrictAllowedBlocks to break out of the synchronous dispatch chain.
					// This ensures ExperimentalBlockEditorProvider finishes its re-renders
					// before we update settings.
					if ( state.previousAllowedBlockTypes === null ) {
						requestAnimationFrame( () => {
							restrictAllowedBlocks();
						} );
					}
				}

				if ( state.formBlockClientId ) {
					enforceBlockSelection();
				}

				enforceBlockNesting();
			}

			// 5. React to selection changes
			const { getSelectedBlockClientId } = select( 'core/block-editor' );
			const currentSelectedBlockId = getSelectedBlockClientId();
			if ( currentSelectedBlockId !== state.lastSelectedBlockId ) {
				state.lastSelectedBlockId = currentSelectedBlockId;
				enforceBlockSelection();
			}

			// 6. Ensure form block is locked
			if ( ! state.isFormBlockLocked && state.formBlockClientId ) {
				lockFormBlock();
				const { getBlock } = select( 'core/block-editor' );
				const formBlock = getBlock( state.formBlockClientId );
				const lock = formBlock?.attributes?.lock as BlockLock | undefined;
				if ( formBlock && lock?.remove && lock?.move ) {
					state.isFormBlockLocked = true;
				}
			}
		} finally {
			isProcessing = false;
		}
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
