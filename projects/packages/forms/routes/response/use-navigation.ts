/**
 * WordPress dependencies
 */
import { useEntityRecords } from '@wordpress/core-data';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
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
 * So the last index the response was seen at is remembered. When the lookup fails,
 * that index is reused against the (now one shorter) list, where it addresses the
 * response that used to follow — the natural "next". `index - 1` still addresses
 * the one before. The remembered index is only a fallback: while the response is
 * still in the list, its live position wins, so reordering and refetches stay
 * correct.
 *
 * A cold deep-link to an already-spammed response has no remembered index and no
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
	const { records } = useEntityRecords< FormResponse >( 'postType', 'feedback', pinned );

	const liveIndex = useMemo(
		() =>
			Number.isFinite( currentId ) && records
				? records.findIndex( ( item: FormResponse ) => Number( getItemId( item ) ) === currentId )
				: -1,
		[ records, currentId ]
	);

	// Keyed by id so that navigating to a response which isn't in the pinned list
	// (a deep link, or one opened from a different list) doesn't inherit the
	// previous response's position.
	const lastKnownIndexRef = useRef< { id: number; index: number } | null >( null );

	useEffect( () => {
		if ( liveIndex >= 0 ) {
			lastKnownIndexRef.current = { id: currentId, index: liveIndex };
		}
	}, [ liveIndex, currentId ] );

	const fallbackIndex =
		lastKnownIndexRef.current?.id === currentId ? lastKnownIndexRef.current.index : -1;

	// Where the response sits, or — once it has left the list — where it used to.
	const anchorIndex = liveIndex >= 0 ? liveIndex : fallbackIndex;
	const hasLeftList = liveIndex < 0 && fallbackIndex >= 0;
	const total = records?.length ?? 0;

	// Once the response is gone from the list, everything after it has shifted down
	// by one, so the anchor index itself now addresses the next response rather
	// than the one after it.
	const nextIndex = hasLeftList ? anchorIndex : anchorIndex + 1;
	const previousIndex = anchorIndex - 1;

	const hasPrevious = anchorIndex >= 0 && previousIndex >= 0 && previousIndex < total;
	const hasNext = anchorIndex >= 0 && nextIndex >= 0 && nextIndex < total;

	const goTo = useCallback(
		( index: number ) => {
			const target = records?.[ index ];
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
		[ records, navigate, pinned ]
	);

	const goPrevious = useCallback( () => {
		if ( hasPrevious ) {
			goTo( previousIndex );
		}
	}, [ hasPrevious, previousIndex, goTo ] );

	const goNext = useCallback( () => {
		if ( hasNext ) {
			goTo( nextIndex );
		}
	}, [ hasNext, nextIndex, goTo ] );

	return { hasPrevious, hasNext, goPrevious, goNext };
}
