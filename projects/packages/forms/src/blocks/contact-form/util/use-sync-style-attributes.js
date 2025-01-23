import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Hook to sync specified block attributes to others of the same block type
 * within a specified ancestor block.
 *
 * @param {string} clientId         - Current block client ID.
 * @param {string} name             - Block name.
 * @param {string} parentName       - Name of block containing all the blocks to sync.
 * @param {Array}  sharedAttributes - List of block attributes to sync.
 */
export default function ( clientId, name, parentName, sharedAttributes ) {
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const lastSyncedAttributesRef = useRef( null );

	const syncAttributes = useSelect(
		select => {
			const block = select( 'core/block-editor' ).getBlock( clientId );
			if ( ! block ) {
				return null;
			}

			return sharedAttributes.reduce( ( acc, attr ) => {
				acc[ attr ] = block.attributes[ attr ];
				return acc;
			}, {} );
		},
		[ clientId, sharedAttributes ]
	);

	const syncedBlockIds = useSelect(
		select => {
			const blockEditor = select( 'core/block-editor' );

			// Skip syncing any blocks if the immediate parent doesn't opt into shared attributes.
			const parentClientIds = blockEditor.getBlockParents( clientId );
			const parentId = parentClientIds?.[ parentClientIds.length - 1 ];
			const parentBlock = blockEditor.getBlock( parentId );
			if ( ! parentBlock || ! parentBlock.attributes.shareFieldAttributes ) {
				return [];
			}

			// Find other blocks that have opted into sharing attributes and collect them.
			const parentFormId = blockEditor.getBlockParentsByBlockName( clientId, parentName )?.[ 0 ];
			const fields = blockEditor
				.getBlocks( parentFormId )
				.filter(
					block =>
						block.name.indexOf( 'jetpack/field' ) > -1 && block.attributes.shareFieldAttributes
				);
			const ids = [];
			fields.forEach( field => {
				const id = blockEditor
					.getBlocks( field.clientId )
					.filter( block => block.name === name && block.clientId !== clientId )?.[ 0 ]?.clientId;
				if ( id ) {
					ids.push( id );
				}
			} );
			return ids;
		},
		[ clientId, name, parentName ]
	);

	useEffect( () => {
		if (
			syncAttributes &&
			syncedBlockIds.length &&
			JSON.stringify( syncAttributes ) !== JSON.stringify( lastSyncedAttributesRef.current )
		) {
			updateBlockAttributes( syncedBlockIds, syncAttributes );
			lastSyncedAttributesRef.current = syncAttributes;
		}
	}, [ syncAttributes, syncedBlockIds, updateBlockAttributes ] );
}
