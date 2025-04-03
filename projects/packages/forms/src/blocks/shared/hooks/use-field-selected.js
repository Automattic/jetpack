import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

export default function useFieldSelected( clientId ) {
	return useSelect(
		select => {
			const { getBlock, hasSelectedInnerBlock } = select( blockEditorStore );
			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
				hasPlaceholder: !! getBlock( clientId ).innerBlocks[ 1 ]?.attributes?.placeholder,
			};
		},
		[ clientId ]
	);
}
