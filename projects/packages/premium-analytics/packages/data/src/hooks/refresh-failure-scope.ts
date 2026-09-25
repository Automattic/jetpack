/**
 * External dependencies
 */
import type { Query } from '@tanstack/react-query';

/**
 * Opt-in for queries the reader reads numbers from. The shared cache also holds
 * product thumbnails, settings and module state, whose failure says nothing
 * about the figures on screen.
 */
export const REFRESH_NOTICE_META = { refreshNotice: true } as const;

/**
 * Shared by detection and the Retry it offers, so the notice cannot count a
 * query that Retry will not reach.
 */
export function isRefreshNoticeQuery( query: Query ): boolean {
	if ( query.meta?.refreshNotice !== true ) {
		return false;
	}

	// Not `getObserversCount()`: `refetchQueries` skips disabled queries, so one
	// counted here would leave a notice Retry cannot clear.
	if ( ! query.isActive() ) {
		return false;
	}

	// Retained data is what separates a failed refresh from a failed first load,
	// which is the widget's own error state to render.
	return query.state.status === 'error' && query.state.data !== undefined;
}
