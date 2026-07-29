// Shared Dashboard control types.
//
// Stats data is fetched in `use-subscriber-stats.ts`,
// `use-email-performance-stats.ts`, and `use-recent-posts.ts`.

/** How far back the Dashboard is looking. */
export type StatsPeriod = '7d' | '30d' | '90d' | 'year';

/** The x-axis cadence of the subscribers chart. */
export type ChartGranularity = 'days' | 'weeks' | 'months' | 'years';
