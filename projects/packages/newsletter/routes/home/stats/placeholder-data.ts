// Stand-in data for the stats Dashboard.
//
// None of these numbers are real. The stats Dashboard is a design stub, and the
// metrics it shows do not exist in this package yet:
//
// - TODO: headline subscriber count — `/wpcom/v2/subscribers/counts`, registered
//   in the Jetpack plugin at `_inc/lib/core-api/wpcom-endpoints/subscribers.php`.
// - TODO: subscribers over time — `useStatsSubscribersReport()` in
//   `packages/premium-analytics/packages/data/src/hooks/use-stats-subscribers.ts`.
//   This package does not depend on premium-analytics today.
// - TODO: open / click / CTOR — the premium-analytics email stats stack
//   (`use-stats-email-summary.ts`). Only per-subscriber and per-post figures
//   exist anywhere today; there is no site-wide rate.
// - TODO: recent posts — core `wp/v2/posts`, which needs no Jetpack connection.
//
// Everything here is deterministic. No `Math.random()`, no `Date.now()`: the
// series must be identical on every render and every run so the chart does not
// jitter between screenshots and tests can assert on it.

/** How far back the Dashboard is looking. */
export type StatsPeriod = '7d' | '30d' | '90d' | 'year';

/** The x-axis cadence of the subscribers chart. */
export type ChartGranularity = 'days' | 'weeks' | 'months' | 'years';

export type StatsHeadline = {
	subscribers: string;
	openRate: string;
	clickRate: string;
	ctor: string;
};

export type RecentPost = {
	id: number;
	title: string;
	/** Already formatted — these are fixtures, not dates to localize. */
	date: string;
	status: 'publish' | 'draft';
	/** A data URI, so the stub needs no network and no bundled image files. */
	thumbnail: string;
	/** Null where the post has not been sent, which the table shows as an em dash. */
	recipients: number | null;
	openRate: number | null;
	clickRate: number | null;
};

/** The four figures across the top, straight from the mockup. */
export const HEADLINE_STATS: StatsHeadline = {
	subscribers: '122',
	openRate: '62%',
	clickRate: '14%',
	ctor: '23%',
};

/** How many points each cadence draws, and how far apart they sit. */
const GRANULARITY_SHAPE: Record< ChartGranularity, { points: number; stepDays: number } > = {
	days: { points: 30, stepDays: 1 },
	weeks: { points: 26, stepDays: 7 },
	months: { points: 12, stepDays: 30 },
	years: { points: 5, stepDays: 365 },
};

/**
 * The last day the sample series covers.
 *
 * Fixed rather than "today" so the chart is stable across runs — a moving end
 * date would make every screenshot and any snapshot test differ.
 */
const SERIES_END = new Date( '2026-07-23T00:00:00Z' );

/**
 * A subscriber-count series shaped like the mockup: flat, then a couple of steps
 * up, then flat again at the headline total.
 *
 * @param granularity - Cadence to draw.
 * @return Points oldest-first, ready for `LineChart`.
 */
export function getSubscriberSeries(
	granularity: ChartGranularity
): Array< { date: Date; value: number } > {
	const { points, stepDays } = GRANULARITY_SHAPE[ granularity ];
	const total = Number( HEADLINE_STATS.subscribers );

	return Array.from( { length: points }, ( _, index ) => {
		const date = new Date( SERIES_END );
		date.setUTCDate( date.getUTCDate() - ( points - 1 - index ) * stepDays );

		// Two thirds of the way along it reaches the headline total and holds
		// there, which is the shape the mockup shows.
		const progress = index / ( points - 1 );
		let value = 0;

		if ( progress > 0.2 ) {
			value = Math.round( total * 0.45 );
		}
		if ( progress > 0.45 ) {
			value = total;
		}

		return { date, value };
	} );
}

/**
 * A 1x1 transparent GIF, used where a post has no featured image.
 *
 * Inline so the stub pulls nothing over the network and ships no binary; the
 * visible thumbnail is the styled box behind it.
 */
const BLANK_THUMBNAIL =
	'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/** Sample rows for the Recent Posts table, including one unsent draft. */
export const RECENT_POSTS: RecentPost[] = [
	{
		id: 1,
		title: 'The Green Knight',
		date: '',
		status: 'draft',
		thumbnail: BLANK_THUMBNAIL,
		recipients: null,
		openRate: null,
		clickRate: null,
	},
	{
		id: 2,
		title: 'Parasite',
		date: '23 Jul 2026',
		status: 'publish',
		thumbnail: BLANK_THUMBNAIL,
		recipients: 122,
		openRate: 58,
		clickRate: 21,
	},
	{
		id: 3,
		title: 'Interstellar',
		date: '22 Jul 2026',
		status: 'publish',
		thumbnail: BLANK_THUMBNAIL,
		recipients: 121,
		openRate: 64,
		clickRate: 16,
	},
	{
		id: 4,
		title: 'Pillion',
		date: '22 Jul 2026',
		status: 'publish',
		thumbnail: BLANK_THUMBNAIL,
		recipients: 119,
		openRate: 49,
		clickRate: 18,
	},
	{
		id: 5,
		title: 'Undertone',
		date: '22 Jul 2026',
		status: 'publish',
		thumbnail: BLANK_THUMBNAIL,
		recipients: 115,
		openRate: 52,
		clickRate: 13,
	},
];
