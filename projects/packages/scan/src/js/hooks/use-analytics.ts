import { useMemo } from 'react';

interface AnalyticsTracks {
	recordEvent: ( eventName: string, properties?: Record< string, unknown > ) => void;
}

interface AnalyticsApi {
	tracks: AnalyticsTracks;
}

/**
 * Resolve the global `_tkq` (Tracks queue) object that WordPress.com's
 * tracking script publishes after Jetpack hydrates the connection state.
 * Returns a stable analytics-like API that no-ops gracefully when the
 * global isn't present (e.g. in mock mode or local dev without a
 * connected site).
 *
 * @return Analytics API with a stable identity across renders.
 */
export default function useAnalytics(): AnalyticsApi {
	return useMemo< AnalyticsApi >( () => {
		return {
			tracks: {
				recordEvent: ( eventName, properties ) => {
					if ( typeof window === 'undefined' ) {
						return;
					}
					const tkq = ( window as unknown as { _tkq?: unknown[] } )._tkq;
					if ( ! Array.isArray( tkq ) ) {
						return;
					}
					tkq.push( [ 'recordEvent', eventName, properties ?? {} ] );
				},
			},
		};
	}, [] );
}
