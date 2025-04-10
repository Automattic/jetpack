import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

const collectAttributesToSync = ( block, attributes ) => {
	return attributes.reduce( ( acc, attr ) => {
		acc[ attr ] = block.attributes[ attr ];
		return acc;
	}, {} );
};

// TODO: - Fix potential infinite loop due to syncing while block is being migrated via deprecations.
//       - Confirm this hook syncs option styles and doesn't impact label/input styles in other fields.
//
// BUG: When some fields have already been migrated to inner blocks, if another legacy field is migrated
//      this style syncing hook goes into an infinite loop. This only really an issue if legacy fields
//      with syncing enabled is pasted into an already migrated form.

/**
 * Hook to sync specified block attributes to others of the same block type
 * within a specified ancestor block.
 *
 * @param {string} clientId         - Current block client ID.
 * @param {string} name             - Block name.
 * @param {string} parentName       - Name of block containing all the blocks to sync.
 * @param {Array}  sharedAttributes - List of block attributes to sync.
 */
export default function useSyncStyleAttributes( clientId, name, parentName, sharedAttributes ) {
	const registry = useRegistry();
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( 'core/block-editor' );

	const lastSyncedAttributesRef = useRef( null );
	const wasSyncEnabledRef = useRef( false );

	const { syncAttributes, isSyncEnabled, existingSyncedBlock, syncedBlockIds } = useSelect(
		select => {
			const blockEditor = select( 'core/block-editor' );
			const currentBlock = blockEditor.getBlock( clientId );
			if ( ! currentBlock ) {
				return {
					syncAttributes: null,
					isSyncEnabled: false,
					existingSyncedBlock: null,
					syncedBlockIds: [],
				};
			}

			// Get parent's `shareFieldAttributes` status
			const parentClientIds = blockEditor.getBlockParents( clientId );
			const parentId = parentClientIds?.[ parentClientIds.length - 1 ];
			const parentBlock = blockEditor.getBlock( parentId );

			const isSharingEnabled = parentBlock?.attributes.shareFieldAttributes || false;

			// Only collect attributes if sharing is enabled for this block's parent
			const attributesToSync = isSharingEnabled
				? collectAttributesToSync( currentBlock, sharedAttributes )
				: null;

			// Find existing synced blocks
			const parentFormId = blockEditor.getBlockParentsByBlockName( clientId, parentName )?.[ 0 ];
			const ids = [];

			let blockWithSyncedAttributes = null;

			if ( parentFormId ) {
				const fields = blockEditor
					.getBlocks( parentFormId )
					.filter(
						block =>
							block.name.indexOf( 'jetpack/field' ) > -1 && block.attributes.shareFieldAttributes
					);

				// Look for the first synced block that isn't this one
				for ( const field of fields ) {
					const blocks = blockEditor
						.getBlocks( field.clientId )
						.filter( block => block.name === name && block.clientId !== clientId );

					if ( blocks.length > 0 ) {
						blockWithSyncedAttributes = blockWithSyncedAttributes || blocks[ 0 ];
						ids.push( blocks[ 0 ].clientId );
					}
				}
			}

			return {
				syncAttributes: attributesToSync,
				isSyncEnabled: isSharingEnabled,
				existingSyncedBlock: blockWithSyncedAttributes,
				syncedBlockIds: ids,
			};
		},
		[ clientId, name, parentName, sharedAttributes ]
	);

	useEffect( () => {
		const sharingJustEnabled = isSyncEnabled && ! wasSyncEnabledRef.current;
		wasSyncEnabledRef.current = isSyncEnabled;

		if ( sharingJustEnabled && existingSyncedBlock ) {
			// When sharing is first enabled, adopt styles from existing synced block
			const syncedAttributes = collectAttributesToSync( existingSyncedBlock, sharedAttributes );
			registry.batch( () => {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( clientId, syncedAttributes );
			} );
			lastSyncedAttributesRef.current = syncedAttributes;
		} else if (
			syncAttributes &&
			syncedBlockIds.length &&
			JSON.stringify( syncAttributes ) !== JSON.stringify( lastSyncedAttributesRef.current )
		) {
			// Sync new style changes to other synced blocks.
			registry.batch( () => {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( syncedBlockIds, syncAttributes );
			} );

			lastSyncedAttributesRef.current = syncAttributes;
		}
	}, [
		__unstableMarkNextChangeAsNotPersistent,
		clientId,
		existingSyncedBlock,
		isSyncEnabled,
		registry,
		sharedAttributes,
		syncAttributes,
		syncedBlockIds,
		updateBlockAttributes,
	] );
}
