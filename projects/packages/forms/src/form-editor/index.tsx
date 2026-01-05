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
import { unregisterPlugin, registerPlugin } from '@wordpress/plugins';
import { FORM_POST_TYPE } from '../blocks/shared/util/constants.js';
import { useFormRenameCommand } from './use-form-rename-command.tsx';

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
 * Remove Jetpack block categories from the editor.
 */
const moveFormsCategoryToFront = () => {
	const { getCategories } = select( 'core/blocks' );
	const { setCategories } = dispatch( 'core/blocks' ) as {
		setCategories: ( categories: unknown[] ) => void;
	};

	const categories = getCategories();

	// move the category with the slug 'contact-form' to the beginning of the list
	const contactFormIndex = categories.findIndex( cat => cat.slug === 'contact-form' );
	if ( contactFormIndex > -1 ) {
		const contactFormCategory = categories[ contactFormIndex ];
		// Build a new array without mutating the original
		const newCategories = [
			contactFormCategory,
			...categories.slice( 0, contactFormIndex ),
			...categories.slice( contactFormIndex + 1 ),
		];
		setCategories( newCategories );
		return;
	}
	setCategories( categories );
};

const moveFormsCategoryToBack = () => {
	const { getCategories } = select( 'core/blocks' );
	const { setCategories } = dispatch( 'core/blocks' ) as {
		setCategories: ( categories: unknown[] ) => void;
	};

	const categories = getCategories();

	const contactFormIndex = categories.findIndex( cat => cat.slug === 'contact-form' );
	if ( contactFormIndex > -1 ) {
		const contactFormCategory = categories[ contactFormIndex ];
		// Build an array without the contact form category
		const withoutContact = categories.filter( cat => cat.slug !== 'contact-form' );

		const growIndex = withoutContact.findIndex( cat => cat.slug === 'grow' );
		if ( growIndex > -1 ) {
			const newCategories = [
				...withoutContact.slice( 0, growIndex + 1 ),
				contactFormCategory,
				...withoutContact.slice( growIndex + 1 ),
			];
			setCategories( newCategories );
			return;
		}
		setCategories( [ ...withoutContact, contactFormCategory ] );
	}
};

let formBlockClientId = null;
/**
 * Locate the contact-form block in the editor and store its client ID.
 */
const locateFormBlock = () => {
	const { getBlocks } = select( 'core/block-editor' );
	const blocks = getBlocks();
	if ( blocks.length === 0 ) {
		return;
	}
	const formBlock = blocks.find( block => block.name === 'jetpack/contact-form' );

	if ( ! formBlock ) {
		return;
	}
	formBlockClientId = formBlock.clientId;
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
	if ( ! formBlock.attributes?.lock?.remove ) {
		// Lock the block to prevent removal, moving, and selection.
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

	// Get the form block to determine where to insert the blocks
	const formBlock = rootBlocks.find( b => b.clientId === formBlockClientId );

	// the targetIndex should be before the last button block if one exists
	const buttonBlockIndex = formBlock?.innerBlocks.findIndex(
		block => block.name === 'jetpack/button' || block.name === 'core/button'
	);

	const defaultTargetIndex = formBlock ? formBlock.innerBlocks.length : 0;
	const targetIndex = buttonBlockIndex > -1 ? buttonBlockIndex : defaultTargetIndex;

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
			enforceBlockNesting();
			enforceBlockSelection();
			lockFormBlock();
			if ( ! formBlockClientId ) {
				locateFormBlock(); // Locate the form block if we haven't
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
