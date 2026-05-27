/**
 * `queryOptions()` factories for the Akismet experimental UI.
 *
 * Each factory pairs a key from `akismetKeys` (the hierarchical source of
 * truth) with a typed `queryFn` over the `akismetClient`. Hooks in
 * `src/hooks/` are one-line wrappers around `useQuery( factory() )` — the
 * factory is also spreadable into `queryClient.prefetchQuery` / `setQueryData`
 * etc. without re-stating the key.
 *
 * See `akismet-modernization/react-query-conventions.md` §5.
 */
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { akismetKeys } from '@/data/query-keys';
import { apiClient, type WpError } from '@/lib/api-client';
import type { BlackboxAggregates } from '@/lib/blackbox-client';
import type {
	AkismetSettings,
	ApiKeyState,
	BlackboxCategory,
	StatsInterval,
	StatsTimeseries,
	StatsTotals,
	WooFraudSummary,
} from '@/lib/types';
import type {
	ActivityQueryParams,
	ActivityResponse,
	BlackboxVerdict,
} from '@/routes/activity/activity-types';

/**
 * Read the current Akismet API key state.
 *
 * @return TanStack queryOptions bag — pass to `useQuery` or `prefetchQuery`.
 */
export const apiKeyQuery = () =>
	queryOptions< ApiKeyState, WpError >( {
		queryKey: akismetKeys.key(),
		queryFn: () => apiClient.get< ApiKeyState >( 'key' ),
	} );

/**
 * Read the current Akismet settings (strictness + show-approved toggle).
 *
 * @return TanStack queryOptions bag — pass to `useQuery` or `prefetchQuery`.
 */
export const akismetSettingsQuery = () =>
	queryOptions< AkismetSettings, WpError >( {
		queryKey: akismetKeys.settings(),
		queryFn: () => apiClient.get< AkismetSettings >( 'settings' ),
	} );

/**
 * Comments-stats totals for the requested interval. Backs the Comments
 * card's count + the ThreatKPIs sum.
 *
 * @param interval - Window the totals cover.
 * @return TanStack queryOptions bag.
 */
export const statsTotalsQuery = ( interval: StatsInterval ) =>
	queryOptions< StatsTotals, WpError >( {
		queryKey: akismetKeys.stats.totals( interval ),
		queryFn: () => apiClient.get< StatsTotals >( `stats/${ interval }` ),
	} );

/**
 * Comments-stats per-bucket series. Backs the Comments card's sparkline.
 *
 * @param interval - Window the series covers.
 * @return TanStack queryOptions bag.
 */
export const statsTimeseriesQuery = ( interval: StatsInterval ) =>
	queryOptions< StatsTimeseries, WpError >( {
		queryKey: akismetKeys.stats.timeseries( interval ),
		queryFn: () =>
			apiClient.get< StatsTimeseries >(
				`stats/timeseries?interval=${ encodeURIComponent( interval ) }`
			),
	} );

/**
 * Blackbox-aggregates for one of the four Blackbox-backed categories.
 *
 * The PHP handler serves a deterministic mock when
 * `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` is off or the site isn't
 * enrolled. See `class.akismet-experimental-rest-api.php`.
 *
 * @param category - Which Blackbox category (logins / bots / brute-force / forms).
 * @param interval - Window the aggregate covers.
 * @return TanStack queryOptions bag.
 */
export const blackboxAggregatesQuery = ( category: BlackboxCategory, interval: StatsInterval ) =>
	queryOptions< BlackboxAggregates, WpError >( {
		queryKey: akismetKeys.blackbox.aggregates( category, interval ),
		queryFn: () =>
			apiClient.get< BlackboxAggregates >(
				`blackbox/aggregates?category=${ encodeURIComponent(
					category
				) }&interval=${ encodeURIComponent( interval ) }`
			),
	} );

/**
 * WooCommerce fraud summary. Returns a 400 when WC isn't installed —
 * the hook's caller is responsible for short-circuiting via
 * `isWooCommerceActive()` so we never make the request in that case.
 *
 * @param interval - Window the summary covers.
 * @return TanStack queryOptions bag.
 */
export const wooFraudSummaryQuery = ( interval: StatsInterval ) =>
	queryOptions< WooFraudSummary, WpError >( {
		queryKey: akismetKeys.woocommerce.fraudSummary( interval ),
		queryFn: () =>
			apiClient.get< WooFraudSummary >(
				`woocommerce/fraud-summary?interval=${ encodeURIComponent( interval ) }`
			),
	} );

/**
 * Activity list (Plan 3). Paginated by the server; the hook key includes
 * the full params object so flipping any filter is its own cache entry.
 * `placeholderData: keepPreviousData` keeps the prior page visible while
 * the next loads — Newsletter / VideoPress convention.
 *
 * @param params - Page / per-page / category / outcome / source / search.
 * @return TanStack queryOptions bag.
 */
export const activityListQuery = ( params: ActivityQueryParams ) =>
	queryOptions< ActivityResponse, WpError >( {
		queryKey: akismetKeys.activity.list( params ),
		queryFn: () => {
			const search = new URLSearchParams( {
				page: String( params.page ),
				per_page: String( params.perPage ),
				category: params.category,
				outcome: params.outcome,
				source: params.source,
			} );
			if ( params.search ) {
				search.set( 'search', params.search );
			}
			if ( params.from ) {
				search.set( 'from', params.from );
			}
			if ( params.to ) {
				search.set( 'to', params.to );
			}
			return apiClient.get< ActivityResponse >( `activity?${ search.toString() }` );
		},
		placeholderData: keepPreviousData,
	} );

/**
 * Blackbox per-row verdict (Plan 3). Backed by the PHP proxy at
 * `/akismet/v1/blackbox/verdict/{session_id}`. The row drawer only
 * mounts this query when `row.visitor_id` is present — so by the time
 * the hook runs, the id is guaranteed truthy.
 *
 * @param sessionId - Blackbox session id from `row.visitor_id`.
 * @return TanStack queryOptions bag.
 */
export const blackboxVerdictQuery = ( sessionId: string ) =>
	queryOptions< BlackboxVerdict, WpError >( {
		queryKey: akismetKeys.blackbox.verdict( sessionId ),
		queryFn: () =>
			apiClient.get< BlackboxVerdict >( `blackbox/verdict/${ encodeURIComponent( sessionId ) }` ),
	} );
