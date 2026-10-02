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
			report( [
				{ views: 300, visitors: 90 },
				{ views: 12, visitors: 0 },
			] ),
			ZONE
		);

		expect( ratio.label ).toBe( 'Views per visitor' );
		expect( ratio.dataFormat ).toEqual( { type: 'average' } );
		expect( ratio.data ).toHaveLength( 1 );
		expect( ratio.data[ 0 ].value ).toBeCloseTo( 3.33, 2 );
	} );

	// Classic counts every post the bucket reports, untitled ones included.
	it( 'counts the posts published in a bucket, worded by its unit', () => {
		const extras = buildTrafficTooltipExtras(
			report( [
				{ views: 1, visitors: 1, post_titles: [ 'Hello world' ] },
				{ views: 1, visitors: 1, post_titles: [ '', 'One', 'Two' ] },
			] ),
			ZONE
		);
		const posts = extras.find( extra => extra.label === 'Posts published' );

		expect( posts?.data.map( point => point.value ) ).toEqual( [ 1, 3 ] );
		expect( posts?.countLabel?.( 3 ) ).toBe( '%s Posts published' );
		expect( posts?.countLabel?.( 1 ) ).toBe( '%s Post published' );
	} );

	it( 'gives a bucket without posts no row, and no series when none has any', () => {
		const extras = buildTrafficTooltipExtras(
			report( [
				{ views: 5, visitors: 2, post_titles: [] },
				{ views: 5, visitors: 2 },
			] ),
			ZONE
		);

		expect( extras.map( extra => extra.label ) ).toEqual( [ 'Views per visitor' ] );
	} );

	it( 'reads the comparison period after each row, placed on the current bucket in the same position', () => {
		const current = report( [
			{ views: 300, visitors: 100, post_titles: [ 'One' ] },
			{ views: 50, visitors: 25 },
		] );
		const comparison = report(
			[
				{ views: 40, visitors: 20, post_titles: [ 'A', 'B' ] },
				{ views: 9, visitors: 0 },
			],
			'06'
		);

		const extras = buildTrafficTooltipExtras( current, ZONE, comparison );

		expect( extras.map( extra => [ extra.label, extra.key ] ) ).toEqual( [
			[ 'Views per visitor', undefined ],
			[ 'Views per visitor', 'views-per-visitor-comparison' ],
			[ 'Posts published', undefined ],
			[ 'Posts published', 'posts-published-comparison' ],
		] );

		const [ ratio, previousRatio, , previousPosts ] = extras;
		expect( previousRatio.data ).toEqual( [
			{ date: ratio.data[ 0 ].date, realDate: expect.any( Date ), value: 2 },
		] );
		expect( previousRatio.data[ 0 ].realDate?.toISOString() ).toBe( '2026-06-01T00:00:00.000Z' );
		expect( previousPosts.data.map( point => point.value ) ).toEqual( [ 2 ] );
	} );

	it( 'adds no comparison row when the comparison period has no reading', () => {
		const extras = buildTrafficTooltipExtras(
			report( [ { views: 300, visitors: 100 } ] ),
			ZONE,
			report( [ { views: 0, visitors: 0 } ] )
		);

		expect( extras.map( extra => extra.key ) ).toEqual( [ undefined ] );
	} );

	it( 'returns nothing while the report has not loaded', () => {
		expect( buildTrafficTooltipExtras( undefined, ZONE ) ).toEqual( [] );
	} );
} );
