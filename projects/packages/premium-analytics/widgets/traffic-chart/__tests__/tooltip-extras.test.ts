/**
 * Internal dependencies
 */
import { buildTrafficTooltipExtras } from '../tooltip-extras';
import type { StatsVisitsResponse } from '@jetpack-premium-analytics/data';

const ZONE = 'UTC';

function report( rows: Array< Record< string, unknown > > ): StatsVisitsResponse {
	return {
		summary: {},
		data: rows.map( ( row, index ) => {
			const day = String( index + 1 ).padStart( 2, '0' );

			return {
				time_interval: `2026-07-${ day }`,
				date_start: `2026-07-${ day } 00:00:00`,
				date_end: `2026-07-${ day } 23:59:59`,
				label: `2026-07-${ day }`,
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
		expect( ratio.dataFormat ).toEqual( { type: 'number', options: { decimals: 2 } } );
		// Neither row is traffic: a day with a post but no views still reads as empty.
		expect( ratio.derived ).toBe( true );
		expect( ratio.data ).toHaveLength( 1 );
		expect( ratio.data[ 0 ].value ).toBeCloseTo( 3.33, 2 );
	} );

	it( 'lists up to two titles for the posts published in a bucket', () => {
		const extras = buildTrafficTooltipExtras(
			report( [
				{ views: 1, visitors: 1, post_titles: [ 'Hello world' ] },
				{ views: 1, visitors: 1, post_titles: [ 'One', 'Two' ] },
			] ),
			ZONE
		);
		const posts = extras.find( extra => extra.label === 'Posts published' );

		expect( posts?.data.map( point => [ point.value, point.tooltipText ] ) ).toEqual( [
			[ 1, 'Post published: Hello world' ],
			[ 2, 'Posts published: One, Two' ],
		] );
	} );

	it( 'falls back to a count past two titles, worded by its unit', () => {
		const extras = buildTrafficTooltipExtras(
			report( [ { views: 1, visitors: 1, post_titles: [ 'One', 'Two', 'Three' ] } ] ),
			ZONE
		);
		const posts = extras.find( extra => extra.label === 'Posts published' );

		expect( posts?.data ).toEqual( [
			expect.objectContaining( { value: 3, tooltipText: undefined } ),
		] );
		expect( posts?.countLabel?.( 3 ) ).toBe( '%s Posts published' );
		expect( posts?.countLabel?.( 1 ) ).toBe( '%s Post published' );
		expect( posts?.derived ).toBe( true );
	} );

	it( 'drops an untitled post from the list', () => {
		const extras = buildTrafficTooltipExtras(
			report( [ { views: 1, visitors: 1, post_titles: [ '', 'Hello world' ] } ] ),
			ZONE
		);
		const posts = extras.find( extra => extra.label === 'Posts published' );

		expect( posts?.data ).toEqual( [
			expect.objectContaining( { value: 1, tooltipText: 'Post published: Hello world' } ),
		] );
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

	it( 'returns nothing while the report has not loaded', () => {
		expect( buildTrafficTooltipExtras( undefined, ZONE ) ).toEqual( [] );
	} );
} );
