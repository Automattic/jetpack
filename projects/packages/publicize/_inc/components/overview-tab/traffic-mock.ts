import type { TrafficReferrerDay } from '../../social-store/types';

/**
 * Five fixture services worth of believable daily traffic. The mock
 * exists to drive the free-plan "locked" preview of the Overview
 * traffic chart — the chart is blurred and overlaid with an upgrade
 * Notice, so free users still see the value proposition without us
 * spending a real `get_referrers` round-trip on their site. Numbers
 * trend upward gently with weekday seasonality (Mon–Fri > Sat–Sun)
 * and a deterministic small jitter so the lines wobble believably
 * without ever crossing zero or producing obvious flat spans.
 */
const MOCK_SERIES: Array< { host: string; base: number; growth: number } > = [
	{ host: 'facebook.com', base: 12, growth: 0.6 },
	{ host: 'x.com', base: 9, growth: 0.5 },
	{ host: 'linkedin.com', base: 6, growth: 0.4 },
	{ host: 'threads.net', base: 4, growth: 0.35 },
	{ host: 'instagram.com', base: 3, growth: 0.25 },
];

/**
 * Cheap deterministic pseudo-random in [0, 1). Lets the dummy curve
 * stay stable across re-renders without us having to seed a real
 * PRNG just for ten-line fixture data.
 *
 * @param n - Integer seed.
 * @return A pseudo-random number in [0, 1).
 */
function pseudoRandom( n: number ): number {
	const x = Math.sin( n * 9301 + 49297 ) * 233280;
	return x - Math.floor( x );
}

/**
 * Build a fake `days` payload shaped exactly like the live
 * `wpcom/v2/.../stats/referrers` response, covering the requested
 * window backwards from today. Same code path as the real chart —
 * `TrafficChartCard.buildSeries` reduces it without knowing it's
 * fake.
 *
 * @param interval - Number of days to fabricate.
 * @return Per-day referrer payload keyed by `YYYY-MM-DD`.
 */
export function buildMockReferrers( interval: number ): Record< string, TrafficReferrerDay > {
	const days: Record< string, TrafficReferrerDay > = {};
	const today = new Date();
	for ( let offset = interval - 1; offset >= 0; offset-- ) {
		const date = new Date( today );
		date.setUTCDate( today.getUTCDate() - offset );
		const dateKey = date.toISOString().slice( 0, 10 );
		const dayOfWeek = date.getUTCDay(); // 0 = Sunday
		const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
		const dayIndex = interval - 1 - offset;

		const groups = MOCK_SERIES.map( ( series, seriesIndex ) => {
			const trend = series.base + dayIndex * series.growth;
			const jitter = pseudoRandom( dayIndex * 31 + seriesIndex * 7 ) * 4;
			const weekendDamp = isWeekend ? 0.6 : 1;
			const total = Math.max( 1, Math.round( ( trend + jitter ) * weekendDamp ) );
			return {
				name: series.host,
				url: `https://${ series.host }/`,
				total,
			};
		} );

		days[ dateKey ] = {
			groups,
			other_views: 0,
			total_views: groups.reduce( ( sum, g ) => sum + ( g.total ?? 0 ), 0 ),
		};
	}
	return days;
}
