/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { useNavigate } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { getItemId } from '../../src/dashboard/inbox/utils.js';
import { store as dashboardStore } from '../../src/dashboard/store/index.js';
/**
 * Types
 */
import type { FormResponse } from '../../src/types/index.ts';

export type ResponsePageNavigation = {
	hasPrevious: boolean;
	hasNext: boolean;
	goPrevious: () => void;
	goNext: () => void;
};

/**
 * Prev/next navigation for the standalone single response page.
 *
 * Reads the same ordered feedback list the inbox uses (via the dashboard store's
 * current query, so filters/search/ordering carry over), but only needs the
 * record IDs for ordering. It deliberately avoids `useInboxData`'s
 * `getEditedEntityRecord` mapping: that resolves each record's *canonical*
 * (query-less) entity, which refetches feedback without `fields_format=collection`
 * and overwrites the shared record — stripping the open response from the rich
 * field rendering to the plain one. Navigation stays within the currently loaded
 * page of records, mirroring the inbox inspector.
 *
 * @param currentId - The ID of the response currently being viewed.
 * @return Navigation state and handlers.
 */
export default function useResponsePageNavigation( currentId: number ): ResponsePageNavigation {
	const navigate = useNavigate();
	const currentQuery = useSelect(
		select =>
			(
				select( dashboardStore ) as { getCurrentQuery: () => Record< string, unknown > }
			 ).getCurrentQuery(),
		[]
	);
	const { records } = useEntityRecords< FormResponse >( 'postType', 'feedback', currentQuery );

	const currentIndex = useMemo(
		() =>
			Number.isFinite( currentId ) && records
				? records.findIndex( ( item: FormResponse ) => Number( getItemId( item ) ) === currentId )
				: -1,
		[ records, currentId ]
	);

	const hasPrevious = currentIndex > 0;
	const hasNext = currentIndex >= 0 && currentIndex < ( records?.length ?? 0 ) - 1;

	const goTo = useCallback(
		( index: number ) => {
			const target = records?.[ index ];
			if ( target ) {
				navigate( { to: `/response/${ getItemId( target ) }` } );
			}
		},
		[ records, navigate ]
	);

	const goPrevious = useCallback( () => {
		if ( hasPrevious ) {
			goTo( currentIndex - 1 );
		}
	}, [ hasPrevious, currentIndex, goTo ] );

	const goNext = useCallback( () => {
		if ( hasNext ) {
			goTo( currentIndex + 1 );
		}
	}, [ hasNext, currentIndex, goTo ] );

	return { hasPrevious, hasNext, goPrevious, goNext };
}
