import { aggregateTagRows, getTagRowId, tagsToTimeSeries } from './aggregate';
import type { StatsNormalizedReport, StatsTagsItem } from '@jetpack-premium-analytics/data';

/**
 * Build a Tags report item fixture.
 *
 * @param overrides - Tag item overrides.
 * @return The tag item fixture.
 */
function makeTag( overrides: Partial< StatsTagsItem > = {} ): StatsTagsItem {
	return {
		label: [ { label: 'News', labelIcon: 'tag', link: 'https://example.com/tag/news/' } ],
		labelText: 'News',
		value: 0,
		link: 'https://example.com/tag/news/',
		children: undefined,
		...overrides,
	};
}

const report: StatsNormalizedReport< StatsTagsItem > = {
	summary: {},
	data: [
		{
			time_interval: '2026-06-04',
			date_start: '2026-06-04T00:00:00+00:00',
			date_end: '2026-06-04T23:59:59+00:00',
			items: [
				makeTag( { value: 10 } ),
				makeTag( {
					label: [ { label: 'Recipes', labelIcon: 'folder', link: null } ],
					labelText: 'Recipes',
					value: 5,
					link: null,
					children: [
						{
							label: 'Recipes',
							labelIcon: 'folder',
							value: null,
							link: 'https://example.com/category/recipes/',
							children: null,
						},
					],
				} ),
			],
		},
		{
			time_interval: '2026-06-05',
			date_start: '2026-06-05T00:00:00+00:00',
			date_end: '2026-06-05T23:59:59+00:00',
			items: [ makeTag( { value: 7 } ) ],
		},
	],
};

describe( 'report tags aggregate', () => {
	it( 'builds views totals for each chart bucket', () => {
		const series = tagsToTimeSeries( report );

		expect( series.data.map( point => point.views ) ).toEqual( [ 15, 7 ] );
	} );

	it( 'groups daily totals into calendar weeks for the chart', () => {
		const series = tagsToTimeSeries( report, 'week' );

		expect( series.data ).toEqual( [
			expect.objectContaining( {
				time_interval: '2026-06-01',
				date_start: '2026-06-01T00:00:00+00:00',
				date_end: '2026-06-05T23:59:59+00:00',
				views: 22,
			} ),
		] );
	} );

	it( 'aggregates repeated tags without mutating the source report', () => {
		const rows = aggregateTagRows( report );

		expect( rows ).toEqual( [
			expect.objectContaining( {
				labelText: 'News',
				value: 17,
			} ),
			expect.objectContaining( {
				labelText: 'Recipes',
				value: 5,
			} ),
		] );
		expect( report.data[ 0 ].items[ 0 ].value ).toBe( 10 );
	} );

	it( 'keys linked rows by URL and grouped rows by label', () => {
		expect( getTagRowId( makeTag() ) ).toBe( 'https://example.com/tag/news/' );
		expect( getTagRowId( makeTag( { link: null, labelText: 'News, Updates' } ) ) ).toBe(
			'News, Updates'
		);
	} );
} );
