// Stand-in data for stats that are not wired yet.
//
// Total subscribers and subscribers over time are real now; see
// `use-subscriber-stats.ts`. Open rate, click rate, and CTOR remain placeholders:
// the per-post equivalents are real (see `use-recent-posts.ts`), but nothing in
// this package aggregates them across the newsletter yet.

/** How far back the Dashboard is looking. */
export type StatsPeriod = '7d' | '30d' | '90d' | 'year';

/** The x-axis cadence of the subscribers chart. */
export type ChartGranularity = 'days' | 'weeks' | 'months' | 'years';

export type StatsHeadline = {
	openRate: string;
	clickRate: string;
	ctor: string;
};

/** Figures not yet backed by real aggregate newsletter stats. */
export const HEADLINE_STATS_PLACEHOLDERS: StatsHeadline = {
	openRate: '62%',
	clickRate: '14%',
	ctor: '23%',
};
