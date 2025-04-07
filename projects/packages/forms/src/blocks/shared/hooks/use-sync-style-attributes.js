import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

const collectAttributesToSync = ( block, attributes ) => {
	return attributes.reduce( ( acc, attr ) => {
		acc[ attr ] = block.attributes[ attr ];
		return acc;
	}, {} );
};

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
			const isPreviewMode = blockEditor.getSettings().templateMode === 'preview';

			if ( ! currentBlock || isPreviewMode ) {
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

			let parentBlock = blockEditor.getBlock( parentId );
			if ( parentBlock.name === 'jetpack/options' ) {
				parentBlock = blockEditor.getBlock( parentClientIds[ parentClientIds.length - 2 ] );
			}

			const isSharingEnabled = parentBlock?.attributes.shareFieldAttributes || false;

			// Only collect attributes if sharing is enabled for this block's parent
			const attributesToSync = isSharingEnabled
				? collectAttributesToSync( currentBlock, sharedAttributes )
				: null;

			// Find existing synced blocks
			const parentFormId = blockEditor.getBlockParentsByBlockName( clientId, parentName )?.[ 0 ];
			const ids = [];

			let blockWithSyncedAttributes = null;

			// Recursive util to find all fields with style syncing regardless of how
			// deeply nested in the form.
			const getFieldsWithSharedAttributes = currentId => {
				const blocks = blockEditor.getBlocks( currentId );
				let result = [];

				for ( const block of blocks ) {
					if ( block.name.indexOf( 'jetpack/field' ) > -1 ) {
						if ( block.attributes.shareFieldAttributes ) {
							result.push( block );
						}
					} else {
						result = result.concat( getFieldsWithSharedAttributes( block.clientId ) );
					}
				}

				return result;
			};

			if ( parentFormId ) {
				const fields = getFieldsWithSharedAttributes( parentFormId );

				// Look for the first synced block that isn't this one
				for ( const field of fields ) {
					const innerFieldBlocks = blockEditor.getBlocks( field.clientId );
					const isChoiceField =
						field.name === 'jetpack/field-radio' ||
						field.name === 'jetpack/field-checkbox-multiple';

					// Single and multiple choice fields nest their individual option blocks
					// within a `jetpack/options` block. If we're syncing option block styles
					// all the individual options within a choice field need to be included.
					if ( name === 'jetpack/option' && isChoiceField ) {
						const optionsBlock = innerFieldBlocks.find( block => block.name === 'jetpack/options' );

						blockEditor.getBlocks( optionsBlock.clientId ).forEach( block => {
							blockWithSyncedAttributes = blockWithSyncedAttributes || block;
							if ( block.clientId !== clientId ) {
								ids.push( block.clientId );
							}
						} );
					} else {
						// Check for blocks to sync as normal. This will still allow
						// `jetpack/option` blocks that are direct children of a field to be
						// found e.g. checkbox and consent fields.
						const blocks = innerFieldBlocks.filter(
							block => block.name === name && block.clientId !== clientId
						);

						if ( blocks.length > 0 ) {
							blockWithSyncedAttributes = blockWithSyncedAttributes || blocks[ 0 ];
							ids.push( blocks[ 0 ].clientId );
						}
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
			updateBlockAttributes( clientId, syncedAttributes );
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
		syncAttributes,
		isSyncEnabled,
		existingSyncedBlock,
		syncedBlockIds,
		updateBlockAttributes,
		clientId,
		sharedAttributes,
		registry,
		__unstableMarkNextChangeAsNotPersistent,
	] );
}
