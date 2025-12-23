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
import { unregisterPlugin } from '@wordpress/plugins';
import { FORM_POST_TYPE } from '../blocks/shared/util/constants.js';

import './style.scss';

/**
 * Remove Jetpack block categories from the editor.
 */
const moveFormsCategoryToFront = () => {
	const { getCategories } = select( 'core/blocks' );
	const { setCategories } = dispatch( 'core/blocks' );

	const categories = getCategories();

	// move the category with the slug 'contact-form' to the beginning of the list
	const contactFormCategoryIndex = categories.findIndex( cat => cat.slug === 'contact-form' );
	if ( contactFormCategoryIndex > -1 ) {
		const [ contactFormCategory ] = categories.splice( contactFormCategoryIndex, 1 );
		categories.unshift( contactFormCategory );
	}
	setCategories( categories );
};

const moveFormsCategoryToBack = () => {
	const { getCategories } = select( 'core/blocks' );
	const { setCategories } = dispatch( 'core/blocks' );

	const categories = getCategories();

	const contactFormCategoryIndex = categories.findIndex( cat => cat.slug === 'contact-form' );
	if ( contactFormCategoryIndex > -1 ) {
		const [ contactFormCategory ] = categories.splice( contactFormCategoryIndex, 1 );
		const contactFormGrowIndex = categories.findIndex( cat => cat.slug === 'grow' );
		if ( contactFormGrowIndex > -1 ) {
			categories.splice( contactFormGrowIndex + 1, 0, contactFormCategory );
			setCategories( categories );
			return;
		}
		categories.push( contactFormCategory );
		setCategories( categories );
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
	const targetIndex = formBlock ? formBlock.innerBlocks.length : 0;

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

let isJetpackFormEditor = null;
let categoriesFiltered = false;

// Subscribe to editor changes to lock the form block when ready.
subscribe( () => {
	const { getCurrentPostType } = select( 'core/editor' );
	const isCurrentPostTypeJetpackForm = getCurrentPostType() === FORM_POST_TYPE;
	if ( isCurrentPostTypeJetpackForm ) {
		enforceBlockNesting();
		enforceBlockSelection();
		lockFormBlock();
		! formBlockClientId && locateFormBlock(); // Locate the form block if we haven't

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
		// moveFormsCategoryToBack();
	}
	// Update the flag.
	isJetpackFormEditor = isCurrentPostTypeJetpackForm;
} );
