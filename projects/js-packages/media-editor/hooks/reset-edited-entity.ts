/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 *
 * @param root0
 * @param root0.postId
 */
export function useResetEditedEntity( { postId }: { postId: number } ) {
	const { editEntityRecord } = useDispatch( coreStore ) as any;
	const { record, edits } = useSelect(
		select => {
			const { getEntityRecordEdits, getEntityRecord } = select( coreStore ) as any;

			const _record = getEntityRecord( 'postType', 'attachment', postId );

			const _edits = getEntityRecordEdits( 'postType', 'attachment', postId );

			return {
				record: _record,
				edits: _edits,
			};
		},
		[ postId ]
	) as any;

	return useCallback( () => {
		if ( ! record || ! edits ) {
			return;
		}
		const editsToApply: Record< string, any > = {};
		Object.keys( edits ).forEach( key => ( editsToApply[ key ] = undefined ) );
		editEntityRecord( 'postType', 'attachment', postId, editsToApply );
	}, [ record, edits, editEntityRecord, postId ] );
}
