/**
 * External dependencies
 */
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import { toLibraryItem } from '../../src/dashboard/utils/library-item';
import type { LibraryItem } from '../../src/dashboard/types/library';
import type { ApiMediaItem } from '../../src/dashboard/utils/library-item';

type VideoAttachmentState = {
	video: LibraryItem | null;
	isLoading: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
};

// `view`, not core-data's default `edit`: reading the report takes `view_stats`, not edit rights
// on the attachment.
const ATTACHMENT_QUERY = { context: 'view' };

/**
 * Load one attachment for the player from the core data store.
 *
 * @param id - Attachment id. `0` skips the request.
 * @return The mapped video, plus the request's load and error state.
 */
export function useVideoAttachment( id: number ): VideoAttachmentState {
	const { record, hasResolved, error } = useSelect(
		select => {
			if ( id <= 0 ) {
				return { record: undefined, hasResolved: false, error: null };
			}

			const { getEntityRecord, getResolutionError, hasFinishedResolution } = select( coreStore );
			const args = [ 'postType', 'attachment', id, ATTACHMENT_QUERY ];

			return {
				record: getEntityRecord( 'postType', 'attachment', id, ATTACHMENT_QUERY ) as
					ApiMediaItem | undefined,
				hasResolved: hasFinishedResolution( 'getEntityRecord', args ),
				error: getResolutionError( 'getEntityRecord', args ),
			};
		},
		[ id ]
	);
	const { invalidateResolution } = useDispatch( coreStore );
	const refetch = useCallback( () => {
		if ( id > 0 ) {
			invalidateResolution( 'getEntityRecord', [ 'postType', 'attachment', id, ATTACHMENT_QUERY ] );
		}
	}, [ id, invalidateResolution ] );
	const video = useMemo(
		() => ( record ? toLibraryItem( record, isSimpleSite() ) : null ),
		[ record ]
	);

	return {
		video,
		isLoading: id > 0 && ! hasResolved,
		isError: Boolean( error ),
		error,
		refetch,
	};
}
