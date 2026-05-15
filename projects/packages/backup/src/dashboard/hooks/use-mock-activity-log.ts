import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { MOCK_ACTIVITY_LOG } from '../fixtures/activity-log';
import type { ActivityItem } from '../types/activity';

const INITIAL_LOAD_MS = 600;
const PAGE_CHANGE_MS = 150;

type Args = {
	page: number;
	pageSize: number;
	search: string;
};

type Result = {
	items: ActivityItem[];
	totalPages: number;
	isLoading: boolean;
};

/**
 * Predicate that returns true when the given activity item matches the search query.
 *
 * Matching is case-insensitive against the item's title and optional summary.
 * An empty query returns every item.
 *
 * @param item - Activity item to test.
 * @param q    - Search query (raw, untrimmed).
 * @return True when the item matches the query.
 */
function matchesSearch( item: ActivityItem, q: string ): boolean {
	if ( ! q ) {
		return true;
	}
	const haystack = `${ item.title } ${ item.summary ?? '' }`.toLowerCase();
	return haystack.includes( q.toLowerCase() );
}

/**
 * Hook returning a paginated, search-filtered slice of the mock activity log.
 *
 * Adds synthetic latency so the dashboard exercises its loading states even
 * with fixture data: a longer delay on first load, a shorter one on every
 * page or search change after that.
 *
 * @param args          - Query arguments.
 * @param args.page     - 1-indexed page number.
 * @param args.pageSize - Number of items per page.
 * @param args.search   - Current search query.
 * @return The current page of items, total page count, and loading flag.
 */
export function useMockActivityLog( { page, pageSize, search }: Args ): Result {
	// Tracked in a ref (not state) so settling the first load doesn't itself
	// retrigger the effect — a useState here causes a visible spinner blink
	// right after the initial 600ms load, with no user input.
	const firstLoadDoneRef = useRef( false );
	const [ isLoading, setIsLoading ] = useState( true );

	useEffect( () => {
		const delay = firstLoadDoneRef.current ? PAGE_CHANGE_MS : INITIAL_LOAD_MS;
		setIsLoading( true );
		const handle = window.setTimeout( () => {
			setIsLoading( false );
			firstLoadDoneRef.current = true;
		}, delay );
		return () => window.clearTimeout( handle );
	}, [ page, search ] );

	const { items, totalPages } = useMemo( () => {
		const filtered = MOCK_ACTIVITY_LOG.filter( item => matchesSearch( item, search ) );
		const total = Math.max( 1, Math.ceil( filtered.length / pageSize ) );
		const start = ( page - 1 ) * pageSize;
		const slice = filtered.slice( start, start + pageSize );
		return { items: slice, totalPages: total };
	}, [ page, pageSize, search ] );

	return { items, totalPages, isLoading };
}
