import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

export default function ( clientId ) {
	const { fieldParentId, parentIndex, formParentId } = useSelect(
		select => {
			const blockEditor = select( blockEditorStore );
			const parentClientIds = blockEditor.getBlockParents( clientId );
			const parentId = parentClientIds[ parentClientIds.length - 1 ];

			return {
				fieldParentId: parentId,
				parentIndex: parentId ? blockEditor.getBlockIndex( parentId ) : undefined,
				formParentId: parentClientIds[ parentClientIds.length - 2 ],
			};
		},
		[ clientId ]
	);

	const { insertBlock } = useDispatch( blockEditorStore );

	return useCallback(
		event => {
			if (
				event.key === 'Enter' &&
				! event.shiftKey &&
				fieldParentId &&
				parentIndex !== undefined
			) {
				event.preventDefault();
				insertBlock(
					createBlock( getDefaultBlockName() ),
					parentIndex + 1,
					formParentId // Insert in the same context as the field block.
				);
			}
		},
		[ insertBlock, fieldParentId, formParentId, parentIndex ]
	);
}
