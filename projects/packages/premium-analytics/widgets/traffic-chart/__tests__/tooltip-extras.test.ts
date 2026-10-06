/**
 * Internal dependencies
 */
import { buildTrafficTooltipExtras } from '../tooltip-extras';
import type { StatsVisitsResponse } from '@jetpack-premium-analytics/data';

const ZONE = 'UTC';

function report( rows: Array< Record< string, unknown > >, month = '07' ): StatsVisitsResponse {
	return {
		summary: {},
		data: rows.map( ( row, index ) => {
			const day = String( index + 1 ).padStart( 2, '0' );

			return {
				time_interval: `2026-${ month }-${ day }`,
				date_start: `2026-${ month }-${ day } 00:00:00`,
				date_end: `2026-${ month }-${ day } 23:59:59`,
				label: `2026-${ month }-${ day }`,
				value: 0,
				items: [],
				...row,
			};
		} ),
	};
}

describe( 'buildTrafficTooltipExtras', () => {
	it( 'derives views per visitor to two decimals, skipping a bucket with no visitors', () => {
		const [ ratio ] = buildTrafficTooltipExtras(
			{
				views: report( [
					{ views: 300, visitors: 90 },
					{ views: 12, visitors: 0 },
				] ),
				posts: undefined,
			},
			ZONE
		);

		expect( ratio.label ).toBe( 'Views per visitor' );
		expect( ratio.dataFormat ).toEqual( { type: 'average' } );
		expect( ratio.data ).toHaveLength( 1 );
		expect( ratio.data[ 0 ].value ).toBeCloseTo( 3.33, 2 );
	} );

	// Classic counts every post the bucket reports, untitled ones included.
	it( 'counts the posts published in a bucket, worded by its unit', () => {
		const [ posts ] = buildTrafficTooltipExtras(
			{
				views: undefined,
				posts: report( [
					{ post_titles: [ 'Hello world' ] },
					{ post_titles: [ '', 'One', 'Two' ] },
				] ),
			},
			ZONE
		);

		expect( posts.label ).toBe( 'Posts published' );
		expect( posts.data.map( point => point.value ) ).toEqual( [ 1, 3 ] );
		expect( posts.countLabel?.( 3 ) ).toBe( '%s Posts published' );
		expect( posts.countLabel?.( 1 ) ).toBe( '%s Post published' );
	} );

	it( 'gives a bucket without posts no row, and no series when none has any', () => {
		const extras = buildTrafficTooltipExtras(
			{
				views: report( [ { views: 5, visitors: 2 } ] ),
				posts: report( [ { post_titles: [] }, {} ] ),
			},
			ZONE
		);

		expect( extras.map( extra => extra.label ) ).toEqual( [ 'Views per visitor' ] );
	} );

	it( 'reads the comparison period into `previous`, placed on the current bucket in the same position', () => {
		const current = {
			views: report( [
				{ views: 300, visitors: 100 },
				{ views: 50, visitors: 25 },
			] ),
			posts: report( [ { post_titles: [ 'One' ] }, {} ] ),
		};
		const comparison = {
			views: report(
				[
					{ views: 40, visitors: 20 },
					{ views: 9, visitors: 0 },
				],
				'06'
			),
			posts: report( [ { post_titles: [ 'A', 'B' ] }, {} ], '06' ),
		};

		const [ ratio, posts ] = buildTrafficTooltipExtras( current, ZONE, comparison );

		expect( ratio.previous ).toEqual( [
			{
				date: ratio.data[ 0 ].date,
				realDate: expect.any( Date ),
				endDate: expect.any( Date ),
				value: 2,
			},
		] );
		expect( ratio.previous?.[ 0 ].realDate?.toISOString() ).toBe( '2026-06-01T00:00:00.000Z' );
		expect( posts.previous?.map( point => point.value ) ).toEqual( [ 2 ] );
	} );

	it( 'leaves `previous` out when the comparison period has no reading', () => {
		const [ ratio ] = buildTrafficTooltipExtras(
			{ views: report( [ { views: 300, visitors: 100 } ] ), posts: undefined },
			ZONE,
			{ views: report( [ { views: 0, visitors: 0 } ] ), posts: undefined }
		);

		expect( ratio.previous ).toBeUndefined();
	} );
} );
