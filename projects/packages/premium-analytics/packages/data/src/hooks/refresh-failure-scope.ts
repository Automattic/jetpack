/**
 * External dependencies
 */
import type { Query } from '@tanstack/react-query';

/**
 * Marks a query as one the reader reads numbers from, so a failed refresh of it
 * is worth telling them about. Opt-in: the shared cache also holds queries whose
 * failure says nothing about the figures on screen — product thumbnails, site
 * settings, dashboard module state — and a notice about those would name a
 * staleness nothing on the page has.
 */
export const REFRESH_NOTICE_META = { refreshNotice: true } as const;

/**
 * The single definition of "a failed refresh the reader can still see the data
 * for". Detection and the Retry it offers both run through this, so the notice
 * can never count a query that Retry will not reach.
 */
export function isRefreshNoticeQuery( query: Query ): boolean {
	if ( query.meta?.refreshNotice !== true ) {
		return false;
	}

	// `isActive()`, not `getObserversCount()`: an observed but disabled query is
	// one `refetchQueries` skips, so counting it here would leave a notice that
	// Retry cannot clear until the cache evicts it.
	if ( ! query.isActive() ) {
		return false;
	}

	// Retained data is what separates a failed refresh from a failed first load —
	// the latter is the widget's own error state to render.
	return query.state.status === 'error' && query.state.data !== undefined;
}
