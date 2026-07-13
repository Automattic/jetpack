/**
 * Internal dependencies
 */
import { buildVideoPlaysData, buildVideoPlaysDataWithComparison } from '../build-video-plays-data';
import { mergeStatsVideoPlaysComparisonRows } from '@jetpack-premium-analytics/data';
import type { StatsNormalizedReport, StatsVideoPlaysItem } from '@jetpack-premium-analytics/data';

type VideoSeed = {
	/**
	 * Stable post ID (omitted when testing the link/label fallback).
	 */
	id?: string | number;
	/**
	 * Display label (defaults to `Video`).
	 */
	label?: string;
	/**
	 * Play count for the period.
	 */
	plays: number;
	/**
	 * Video URL (used as the alignment key when `id` is absent).
	 */
	link?: string | null;
};

/**
 * Builds a single normalized video-plays item from a compact seed.
 *
 * @param {VideoSeed} seed - The video seed.
 * @return A normalized video-plays item.
 */
function makeVideo( { id, label = 'Video', plays, link = null }: VideoSeed ): StatsVideoPlaysItem {
	return {
		id,
		label,
		plays,
		impressions: 0,
		watch_time: 0,
		retention_rate: 0,
		link,
		actions: [],
		children: null,
	};
}

/**
 * Builds a normalized video-plays report. The Stats query layer summarizes
 * multi-day ranges server-side, so the report carries a single data point of
 * per-video totals — which is what the widget consumes.
 *
 * @param videos - The videos for the period, already ranked by the API.
 * @return A normalized video-plays report.
 */
function makeReport( videos: VideoSeed[] ): StatsNormalizedReport< StatsVideoPlaysItem > {
	return {
		summary: { date_start: '2024-01-01', date_end: '2024-01-31' },
		data: [
			{
				time_interval: '2024-01-01',
				date_start: '2024-01-01',
				date_end: '2024-01-31',
				items: videos.map( makeVideo ),
			},
		],
	};
}

function buildData(
	primary?: StatsNormalizedReport< StatsVideoPlaysItem >,
	comparison?: StatsNormalizedReport< StatsVideoPlaysItem >
) {
	return buildVideoPlaysData( mergeStatsVideoPlaysComparisonRows( primary, comparison ).rows );
}

function buildDataWithComparison(
	primary?: StatsNormalizedReport< StatsVideoPlaysItem >,
	comparison?: StatsNormalizedReport< StatsVideoPlaysItem >
) {
	return buildVideoPlaysDataWithComparison(
		mergeStatsVideoPlaysComparisonRows( primary, comparison ).rows
	);
}

describe( 'buildVideoPlaysData', () => {
	it( 'returns an empty array when the primary report is undefined', () => {
		expect( buildData( undefined, undefined ) ).toEqual( [] );
	} );

	it( 'returns an empty array when the primary report has no videos', () => {
		expect( buildData( makeReport( [] ), undefined ) ).toEqual( [] );
	} );

	it( 'maps a single video into leaderboard data', () => {
		const result = buildData( makeReport( [ { id: 1, label: 'Intro', plays: 10 } ] ), undefined );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ] ).toMatchObject( {
			id: '1',
			label: 'Intro',
			currentValue: 10,
			currentShare: 100,
		} );
		expect( result[ 0 ].previousValue ).toBeUndefined();
		expect( result[ 0 ].previousShare ).toBeUndefined();
		expect( result[ 0 ].delta ).toBeUndefined();
	} );

	it( 'falls back to a translated label when the API omits a title', () => {
		const result = buildData( makeReport( [ { id: 1, label: '', plays: 5 } ] ), undefined );

		expect( result[ 0 ].label ).toBe( 'Untitled video' );
	} );

	it( 'preserves the order the API returns videos in', () => {
		const result = buildData(
			makeReport( [
				{ id: 2, label: 'B', plays: 20 },
				{ id: 3, label: 'C', plays: 12 },
				{ id: 1, label: 'A', plays: 5 },
			] ),
			undefined
		);

		expect( result.map( video => video.label ) ).toEqual( [ 'B', 'C', 'A' ] );
	} );

	it( 'aligns comparison values by video ID', () => {
		const result = buildData(
			makeReport( [ { id: 1, label: 'Intro', plays: 150 } ] ),
			makeReport( [ { id: 1, label: 'Intro (renamed)', plays: 100 } ] )
		);

		expect( result[ 0 ] ).toMatchObject( {
			currentValue: 150,
			previousValue: 100,
			delta: 50,
		} );
	} );

	it( 'detects when at least one primary video overlaps the comparison period', () => {
		expect(
			buildDataWithComparison(
				makeReport( [
					{ id: 1, label: 'Intro', plays: 10 },
					{ id: 2, label: 'Outro', plays: 8 },
				] ),
				makeReport( [ { id: 2, label: 'Outro', plays: 5 } ] )
			).hasComparison
		).toBe( true );
	} );

	it( 'does not detect comparison rows when videos do not overlap', () => {
		expect(
			buildDataWithComparison(
				makeReport( [ { id: 1, label: 'Intro', plays: 10 } ] ),
				makeReport( [ { id: 2, label: 'Outro', plays: 5 } ] )
			).hasComparison
		).toBe( false );
	} );

	it( 'does not fabricate comparison values for videos missing from the comparison period', () => {
		const result = buildData(
			makeReport( [
				{ id: 1, label: 'Intro', plays: 10 },
				{ id: 2, label: 'Outro', plays: 8 },
			] ),
			makeReport( [ { id: 1, label: 'Intro', plays: 5 } ] )
		);

		const outro = result.find( video => video.label === 'Outro' );
		expect( outro?.previousValue ).toBeUndefined();
		expect( outro?.delta ).toBeUndefined();
	} );

	it( 'aligns by label when the API omits IDs', () => {
		const result = buildData(
			makeReport( [ { label: 'Intro', plays: 150 } ] ),
			makeReport( [ { label: 'Intro', plays: 100 } ] )
		);

		expect( result[ 0 ] ).toMatchObject( {
			id: 'Intro',
			previousValue: 100,
			delta: 50,
		} );
	} );

	it( 'keys untitled, id-less videos by link so they do not collapse', () => {
		const result = buildData(
			makeReport( [
				{ label: '', plays: 20, link: 'https://example.com/a/' },
				{ label: '', plays: 12, link: 'https://example.com/b/' },
			] ),
			undefined
		);

		expect( result ).toHaveLength( 2 );
		expect( result.map( video => video.id ) ).toEqual( [
			'https://example.com/a/',
			'https://example.com/b/',
		] );
		// Both share the "Untitled video" label but remain distinct rows.
		expect( result.every( video => video.label === 'Untitled video' ) ).toBe( true );
	} );
} );
