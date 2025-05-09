import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

export default function useGetInnerBlock( clientId, blockName ) {
	const inputBlock = useSelect(
		select => {
			// Get the parent block
			const parentBlock = select( blockEditorStore ).getBlock( clientId );
			if ( ! parentBlock ) {
				return {};
			}

			return parentBlock.innerBlocks.find( block => block.name === blockName );
		},
		[ clientId, blockName ]
	);

	return inputBlock;
}
