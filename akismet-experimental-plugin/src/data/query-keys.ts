/**
 * Single source of truth for TanStack Query keys in the Akismet experimental UI.
 *
 * Hierarchical, generic→specific. Invalidating any parent key invalidates
 * everything beneath it. See `akismet-modernization/react-query-conventions.md`
 * §4 for the full convention.
 *
 * Plans 2 + 3 extend this object — keep additions namespaced under
 * `akismetKeys.<resource>.…` so prefix-based invalidation continues to work.
 */
import type { BlackboxCategory, StatsInterval } from '@/lib/types';

export const akismetKeys = {
	all: [ 'akismet' ] as const,

	// Plan 1 — Account + Settings tabs.
	key: () => [ ...akismetKeys.all, 'key' ] as const,
	settings: () => [ ...akismetKeys.all, 'settings' ] as const,
	jetpackKey: () => [ ...akismetKeys.all, 'jetpack-key' ] as const,

	// Plan 2 — Overview tab. The four sub-trees below collectively back the
	// six category cards + WooCommerce panel. Each sub-tree is its own
	// invalidation prefix so a "Save" or "Refresh" can target the right slice.
	stats: {
		all: () => [ ...akismetKeys.all, 'stats' ] as const,
		totals: ( interval: StatsInterval ) =>
			[ ...akismetKeys.stats.all(), 'totals', interval ] as const,
		timeseries: ( interval: StatsInterval ) =>
			[ ...akismetKeys.stats.all(), 'timeseries', interval ] as const,
	},
	category: {
		all: () => [ ...akismetKeys.all, 'category' ] as const,
		summary: ( cat: string, interval: StatsInterval ) =>
			[ ...akismetKeys.category.all(), 'summary', cat, interval ] as const,
	},
	blackbox: {
		all: () => [ ...akismetKeys.all, 'blackbox' ] as const,
		aggregates: ( cat: BlackboxCategory, interval: StatsInterval ) =>
			[ ...akismetKeys.blackbox.all(), 'aggregates', cat, interval ] as const,
	},
	woocommerce: {
		all: () => [ ...akismetKeys.all, 'woocommerce' ] as const,
		fraudSummary: ( interval: StatsInterval ) =>
			[ ...akismetKeys.woocommerce.all(), 'fraud-summary', interval ] as const,
	},
};

export type AkismetQueryKey =
	| typeof akismetKeys.all
	| ReturnType< typeof akismetKeys.key >
	| ReturnType< typeof akismetKeys.settings >
	| ReturnType< typeof akismetKeys.jetpackKey >
	| ReturnType< typeof akismetKeys.stats.all >
	| ReturnType< typeof akismetKeys.stats.totals >
	| ReturnType< typeof akismetKeys.stats.timeseries >
	| ReturnType< typeof akismetKeys.category.all >
	| ReturnType< typeof akismetKeys.category.summary >
	| ReturnType< typeof akismetKeys.blackbox.all >
	| ReturnType< typeof akismetKeys.blackbox.aggregates >
	| ReturnType< typeof akismetKeys.woocommerce.all >
	| ReturnType< typeof akismetKeys.woocommerce.fraudSummary >;
