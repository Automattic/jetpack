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
	totalItems: number;
	totalPages: number;
	isLoading: boolean;
	error: Error | null;
};

/**
 * Predicate that returns true when the given activity item matches the search query.
 *
 * Matches case-insensitively against the item's title and optional summary —
 * the same surface the real `useActivityLog` hook in the data-layer follow-up
 * matches against, so swapping the import line preserves search behaviour.
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
 * Mirrors the shape of the real `useActivityLog` hook (same `Args`, same
 * `Result` keys) so the data-layer follow-up can swap the import line
 * without touching the consumer.
 *
 * Adds synthetic latency so the dashboard exercises its loading states even
 * with fixture data: a longer delay on first load, a shorter one on every
 * page / pageSize / search change after that.
 *
 * @param args          - Query arguments.
 * @param args.page     - 1-indexed page number.
 * @param args.pageSize - Number of items per page.
 * @param args.search   - Current search query.
 * @return The current page of items, total item / page counts, loading flag, and a (mock-always-null) error.
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
	}, [ page, pageSize, search ] );

	const { items, totalItems, totalPages } = useMemo( () => {
		const filtered = MOCK_ACTIVITY_LOG.filter( item => matchesSearch( item, search ) );
		const total = Math.max( 1, Math.ceil( filtered.length / pageSize ) );
		const start = ( page - 1 ) * pageSize;
		return {
			items: filtered.slice( start, start + pageSize ),
			totalItems: filtered.length,
			totalPages: total,
		};
	}, [ page, pageSize, search ] );

	return { items, totalItems, totalPages, isLoading, error: null };
}
