/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { useNavigate } from '@wordpress/route';
/**
 * Internal dependencies
 */
import useInboxData from '../../src/dashboard/hooks/use-inbox-data.ts';
import { getItemId } from '../../src/dashboard/inbox/utils.js';
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
 * Reuses the inbox data loader so the ordering (and any active filters/search
 * carried in the dashboard store) matches the responses list. Navigation stays
 * within the currently loaded page of records, mirroring the inbox inspector.
 *
 * @param currentId - The ID of the response currently being viewed.
 * @return Navigation state and handlers.
 */
export default function useResponsePageNavigation( currentId: number ): ResponsePageNavigation {
	const navigate = useNavigate();
	const { records } = useInboxData();

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
