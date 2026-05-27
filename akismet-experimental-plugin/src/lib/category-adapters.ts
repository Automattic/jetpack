/**
 * Per-source adapters that normalize each fetch shape into the shared
 * `CategorySummary` contract every `<CategoryCard>` consumes.
 *
 * The shared shape:
 *   {
 *     blocked, challenged, passed,        // KPIs the card renders
 *     series,                              // sparkline points
 *     preview,                             // → "preview data" badge
 *     not_active_here                      // → empty-state card
 *   }
 *
 * One adapter per fetch kind in `category-config.ts`. The unified hook
 * `useCategorySummary` picks the adapter via the category's `fetch.kind`.
 */
import { useBlackboxAggregates } from '@/hooks/use-blackbox-aggregates';
import { isWooCommerceActive } from '@/hooks/use-is-woocommerce-active';
import { useStatsTimeSeries } from '@/hooks/use-stats-time-series';
import { useStatsTotals } from '@/hooks/use-stats-totals';
import { useWooCommerceFraudSummary } from '@/hooks/use-woocommerce-fraud-summary';
import type { BlackboxCategory, StatsInterval } from '@/lib/types';

export type CategorySeriesPoint = {
	date: string;
	blocked: number;
	challenged?: number;
	passed?: number;
};

export type CategorySummary = {
	blocked: number;
	challenged: number;
	passed: number;
	series: CategorySeriesPoint[];
	preview: boolean;
	not_active_here: boolean;
};

export type AdapterResult = {
	data: CategorySummary | undefined;
	isLoading: boolean;
	isSuccess: boolean;
	isError: boolean;
};

/**
 * Comments adapter — pairs the totals endpoint with the timeseries endpoint
 * so the card has both KPIs and a sparkline. Both branches carry
 * `preview: true` until a real upstream Akismet source is wired up.
 *
 * @param interval - Window the summary covers.
 * @return Adapter result honoring the shared CategorySummary shape.
 */
export function useCommentsCategoryAdapter( interval: StatsInterval ): AdapterResult {
	const totals = useStatsTotals( interval );
	const ts = useStatsTimeSeries( interval );

	const isLoading = totals.isLoading || ts.isLoading;
	const isSuccess = totals.isSuccess && ts.isSuccess;
	const isError = totals.isError || ts.isError;

	const data: CategorySummary | undefined =
		totals.data && ts.data
			? {
					blocked: totals.data.spam,
					challenged: 0,
					passed: totals.data.ham,
					series: ts.data.series.map( p => ( {
						date: p.date,
						blocked: p.spam,
					} ) ),
					preview: totals.data.preview || ts.data.preview,
					not_active_here: false,
			  }
			: undefined;

	return { data, isLoading, isSuccess, isError };
}

/**
 * Blackbox-aggregates adapter — passes the wire shape through with minor
 * normalization (`series` keeps its shape; KPIs come from the top level).
 *
 * @param category - Blackbox category id.
 * @param interval - Window the aggregate covers.
 * @return Adapter result.
 */
export function useBlackboxCategoryAdapter(
	category: BlackboxCategory,
	interval: StatsInterval
): AdapterResult {
	const { data, isLoading, isSuccess, isError } = useBlackboxAggregates( category, interval );
	const out: CategorySummary | undefined = data && {
		blocked: data.blocked,
		challenged: data.challenged,
		passed: data.passed,
		series: data.series.map( p => ( {
			date: p.date,
			blocked: p.blocked,
			challenged: p.challenged,
			passed: p.passed,
		} ) ),
		preview: data.preview,
		not_active_here: false,
	};
	return { data: out, isLoading, isSuccess, isError };
}

/**
 * WooCommerce-fraud adapter — short-circuits to a `not_active_here`
 * stub when WC isn't installed, otherwise reads the WC summary endpoint.
 *
 * Note: the short-circuit branch returns a fully synthetic AdapterResult
 * (no React Query under it). Safe because `isWooCommerceActive()` reads a
 * value injected at page load — stable across renders for a given session.
 *
 * @param interval - Window the summary covers.
 * @return Adapter result.
 */
export function useWooCommerceCategoryAdapter( interval: StatsInterval ): AdapterResult {
	// We must call the WC summary hook unconditionally to satisfy rules-of-hooks.
	// It short-circuits internally via `enabled: isWooCommerceActive()` so the
	// network never sees a request when WC is absent.
	const wcActive = isWooCommerceActive();
	const { data, isLoading, isSuccess, isError } = useWooCommerceFraudSummary( interval );

	if ( ! wcActive ) {
		return {
			data: {
				blocked: 0,
				challenged: 0,
				passed: 0,
				series: [],
				preview: false,
				not_active_here: true,
			},
			isLoading: false,
			isSuccess: true,
			isError: false,
		};
	}

	const out: CategorySummary | undefined = data && {
		blocked: data.blocked_checkouts,
		challenged: 0,
		passed: 0,
		series: [],
		preview: data.preview,
		not_active_here: false,
	};
	return { data: out, isLoading, isSuccess, isError };
}
