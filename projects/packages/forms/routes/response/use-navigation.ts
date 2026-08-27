/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
import { useCallback, useMemo, useRef } from '@wordpress/element';
import { useNavigate } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { getItemId } from '../../src/dashboard/inbox/utils.js';
import { buildResponseSearch } from './pinned-view.ts';
/**
 * Types
 */
import type { PinnedViewQuery } from './pinned-view.ts';
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
 * Reads the ordered list the user came from — see `pinned-view.ts` for why that
 * comes from the URL rather than the dashboard store. It deliberately avoids
 * `useInboxData`'s `getEditedEntityRecord` mapping: that resolves each record's
 * canonical (query-less) entity, which refetches feedback without
 * `fields_format=collection` and overwrites the shared record — stripping the open
 * response from the rich field rendering to the plain one. Navigation stays within
 * the currently loaded page of records, mirroring the inbox inspector.
 *
 * ## Surviving a status change
 *
 * Pinning the query fixes *which* sequence is walked, but not the case this hook
 * exists to handle: marking the open response as spam or trash drops it out of an
 * inbox list, so looking it up by id finds nothing and both arrows go dead — the
 * user is stranded on a response they just actioned, which is exactly when they
 * most want to move on to the next one.
 *
 * There are two ways the live list stops describing where the user is, and one
 * answer to both: remember the last list the response was actually found in, and
 * keep walking that. It covers the response being actioned out of the list, and it
 * covers `useEntityRecords` reporting nothing at all while a status change
 * re-resolves the query — a gap that would otherwise kill the arrows for the
 * length of every refetch. Because the response is still present in the remembered
 * list, its neighbours are plain `index ± 1`, with no correction for the gap it
 * left behind and no way for the index to fall outside the array.
 *
 * The remembered list is only a fallback: while the response is still in the live
 * list, that wins, so reordering and new arrivals are picked up immediately.
 *
 * A cold deep-link to an already-spammed response has nothing remembered and no
 * position in the pinned list, so it correctly offers no navigation rather than
 * guessing a place in a sequence the response was never part of.
 *
 * @param currentId - The ID of the response currently being viewed.
 * @param pinned    - The pinned list query to navigate within.
 * @return Navigation state and handlers.
 */
export default function useResponsePageNavigation(
	currentId: number,
	pinned: PinnedViewQuery
): ResponsePageNavigation {
	const navigate = useNavigate();
	const { records: liveRecords } = useEntityRecords< FormResponse >(
		'postType',
		'feedback',
		pinned
	);

	const liveIndex = useMemo(
		() =>
			Number.isFinite( currentId ) && liveRecords
				? liveRecords.findIndex(
						( item: FormResponse ) => Number( getItemId( item ) ) === currentId
				  )
				: -1,
		[ liveRecords, currentId ]
	);

	// Keyed by id so a response that isn't in the pinned list (a deep link, or one
	// opened from a different list) doesn't inherit the previous response's place.
	const lastSeenRef = useRef< {
		id: number;
		records: FormResponse[];
		index: number;
	} | null >( null );

	if ( liveRecords && liveIndex >= 0 ) {
		lastSeenRef.current = { id: currentId, records: liveRecords, index: liveIndex };
	}

	// The live list wins whenever it still holds the response; otherwise fall back to
	// the remembered one, and only if it belongs to this response.
	const remembered = lastSeenRef.current?.id === currentId ? lastSeenRef.current : null;
	const seen = liveRecords && liveIndex >= 0 ? lastSeenRef.current : remembered;

	const records = seen?.records ?? null;
	const index = seen?.index ?? -1;

	const hasPrevious = index > 0;
	const hasNext = index >= 0 && index + 1 < ( records?.length ?? 0 );

	const goTo = useCallback(
		( target: FormResponse | undefined ) => {
			if ( target ) {
				navigate( {
					to: `/response/${ getItemId( target ) }`,
					// Carry the pinned list forward, or prev/next would fall back to the
					// default inbox on the very next response.
					// Router types aren't registered in this build, so `search` resolves
					// to `never`; cast through `unknown` to pass the object at runtime.
					search: buildResponseSearch( pinned ) as unknown as never,
				} );
			}
		},
		[ navigate, pinned ]
	);

	const goPrevious = useCallback( () => {
		if ( hasPrevious ) {
			goTo( records?.[ index - 1 ] );
		}
	}, [ hasPrevious, records, index, goTo ] );

	const goNext = useCallback( () => {
		if ( hasNext ) {
			goTo( records?.[ index + 1 ] );
		}
	}, [ hasNext, records, index, goTo ] );

	return { hasPrevious, hasNext, goPrevious, goNext };
}
