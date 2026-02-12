import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';

/**
 * Hook that syncs the block's metadata.name to the form post title.
 * When the block name is changed (e.g., via the List View), the post title is updated to match.
 * Only applies to synced forms (forms with a ref attribute).
 *
 * @param clientId        - The block's client ID
 * @param formRef         - The form's post ID (ref attribute)
 * @param syncedFormTitle - The current synced form's title
 */
export function useSyncFormName(
	clientId: string,
	formRef: number | undefined,
	syncedFormTitle: string | undefined
) {
	const { editEntityRecord } = useDispatch( coreStore );

	const { metadataName } = useSelect(
		select => {
			if ( ! formRef ) {
				return {
					metadataName: '',
				};
			}

			const { getBlockAttributes } = select( blockEditorStore );
			const blockAttributes = getBlockAttributes( clientId );

			return {
				metadataName: ( blockAttributes?.metadata?.name as string ) || '',
			};
		},
		[ clientId, formRef ]
	);

	// Track the previous metadata name to detect changes
	const prevMetadataNameRef = useRef( metadataName );

	useEffect( () => {
		// Only sync for synced forms (forms with a ref)
		if ( ! formRef ) {
			return;
		}

		// Skip if metadata name hasn't changed or is empty
		if ( ! metadataName || metadataName === prevMetadataNameRef.current ) {
			prevMetadataNameRef.current = metadataName;
			return;
		}

		// Skip if the post title already matches the metadata name
		if ( metadataName === syncedFormTitle ) {
			prevMetadataNameRef.current = metadataName;
			return;
		}

		// Update the synced form's post title to match the metadata name
		editEntityRecord( 'postType', FORM_POST_TYPE, formRef, {
			title: metadataName,
		} );

		prevMetadataNameRef.current = metadataName;
	}, [ formRef, metadataName, syncedFormTitle, editEntityRecord ] );
}
