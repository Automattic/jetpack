import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, cloneBlock, getDefaultBlockName } from '@wordpress/blocks';
import { useRefEffect } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';

const useEnter = props => {
	const { replaceBlocks, insertBlock, selectionChange } = useDispatch( blockEditorStore );
	const { getBlock, getBlockRootClientId, getBlockIndex } = useSelect( blockEditorStore );

	const propsRef = useRef( props );
	propsRef.current = props;

	return useRefEffect( element => {
		function onKeyDown( event ) {
			if ( event.defaultPrevented || event.key !== 'Enter' ) {
				return;
			}

			const { clientId, content, isStandalone } = propsRef.current;

			if ( content.length && ! isStandalone ) {
				return;
			}

			event.preventDefault();

			if ( isStandalone ) {
				const fieldBlockId = getBlockRootClientId( clientId );
				const formBlockId = getBlockRootClientId( fieldBlockId );
				const insertIndex = getBlockIndex( fieldBlockId );
				const newBlock = createBlock( getDefaultBlockName() );

				insertBlock( newBlock, insertIndex + 1, formBlockId );
				selectionChange( newBlock.clientId );
			} else {
				const optionsBlockId = getBlockRootClientId( clientId );
				const optionsBlock = getBlock( optionsBlockId );
				const fieldBlockId = getBlockRootClientId( optionsBlockId );
				const fieldBlock = getBlock( fieldBlockId );

				if ( ! optionsBlock || ! fieldBlock ) {
					return;
				}

				const optionIndex = getBlockIndex( clientId );
				const allOptions = optionsBlock.innerBlocks;
				const beforeOptions = allOptions.slice( 0, optionIndex );
				const afterOptions = allOptions.slice( optionIndex + 1 );
				const labelBlock = fieldBlock.innerBlocks[ 0 ];
				const fieldBlockIndex = getBlockIndex( fieldBlockId );

				const cloneField = optionSlice =>
					cloneBlock( {
						...fieldBlock,
						innerBlocks: [
							cloneBlock( labelBlock ),
							cloneBlock( {
								...optionsBlock,
								innerBlocks: optionSlice,
							} ),
						],
					} );

				const headField = cloneField( beforeOptions );
				const middleBlock = createBlock( getDefaultBlockName() );
				const tailField = afterOptions.length ? [ cloneField( afterOptions ) ] : [];

				replaceBlocks(
					fieldBlock.clientId,
					[ headField, middleBlock, ...tailField ],
					fieldBlockIndex
				);
				selectionChange( middleBlock.clientId );
			}
		}

		element.addEventListener( 'keydown', onKeyDown );
		return () => element.removeEventListener( 'keydown', onKeyDown );
	}, [] );
};

export default useEnter;
