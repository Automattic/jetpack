/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { name } from '../';

/**
 * This function, bound to the `editor.BlockEdit` filter,
 * shows/hides the `jetpack/dialogue` block depending on
 * whether the current block is children, or children of children, or so on,
 * of the `jetpack/conversation` block.
 *
 * @param {Function} OriginalBlockEdit - original edit function fo the block
 * @returns {Function} extended block edit function.
 */
function dialogAvailibilityHandler( OriginalBlockEdit ) {
	return props => {
		if ( ! props?.isSelected ) {
			return <OriginalBlockEdit { ...props } />;
		}

		const blockName = `jetpack/${ name }`;

		const { showBlockTypes, hideBlockTypes } = useDispatch( 'core/edit-post' );
		const parentBlocks = useSelect( select => {
			const selectedBlock = select( 'core/block-editor' ).getSelectedBlock();
			if ( ! selectedBlock?.clientId ) {
				return [];
			}

			return select( 'core/block-editor' ).getBlockParentsByBlockName(
				selectedBlock.clientId,
				blockName
			);
		}, [] );

		useEffect( () => {
			if ( ! parentBlocks?.length ) {
				hideBlockTypes( [ 'jetpack/dialogue' ] );
			} else {
				showBlockTypes( [ 'jetpack/dialogue' ] );
			}
		}, [ hideBlockTypes, parentBlocks, showBlockTypes ] );

		return <OriginalBlockEdit { ...props } />;
	};
}

addFilter( 'editor.BlockEdit', 'jetpack/jetpack-dialogue-availability', dialogAvailibilityHandler );
