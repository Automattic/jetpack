/**
 * Internal dependencies
 */
import { appendTooltipExtras, previousRowKey, previousRowLabel } from '../tooltip-extras';

const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
const JULY_2 = new Date( '2026-07-02T00:00:00Z' );

const CPM = { label: 'Average CPM', data: [ { date: JULY_1, value: 0.15 } ] };
const REVENUE = { label: 'Revenue', data: [ { date: JULY_1, value: 12 } ] };

const hoveredAt = ( date: Date ) => ( {
	nearestDatum: { datum: { date, value: 100 }, key: 'Views' },
	datumByKey: { Views: { datum: { date, value: 100 }, index: 0, key: 'Views' } },
} );

describe( 'appendTooltipExtras', () => {
	it( "appends each extra's point for the hovered date", () => {
		const tooltipData = appendTooltipExtras( hoveredAt( JULY_1 ), [ CPM, REVENUE ] );

		// `index` only has to exist on a row, so its value is not asserted.
		expect( tooltipData?.datumByKey ).toEqual( {
			Views: { datum: { date: JULY_1, value: 100 }, index: 0, key: 'Views' },
			'Average CPM': expect.objectContaining( {
				datum: { date: JULY_1, value: 0.15 },
				key: 'Average CPM',
			} ),
			Revenue: expect.objectContaining( { datum: { date: JULY_1, value: 12 }, key: 'Revenue' } ),
		} );
	} );

	it( 'skips an extra with no point for the hovered date', () => {
		const tooltipData = appendTooltipExtras( hoveredAt( JULY_2 ), [ CPM ] );

		expect( Object.keys( tooltipData?.datumByKey ?? {} ) ).toEqual( [ 'Views' ] );
	} );

	it( 'keeps an extra whose point for the hovered date has no reading', () => {
		const gap = { ...CPM, data: [ { date: JULY_1, value: null } ] };
		const tooltipData = appendTooltipExtras( hoveredAt( JULY_1 ), [ gap ] );

		expect( tooltipData?.datumByKey?.[ 'Average CPM' ] ).toEqual(
			expect.objectContaining( { datum: { date: JULY_1, value: null } } )
		);
	} );

	it( 'leaves a key the chart already reports alone', () => {
		const drawn = { label: 'Views', data: [ { date: JULY_1, value: 999 } ] };

		const tooltipData = appendTooltipExtras( hoveredAt( JULY_1 ), [ drawn, CPM ] );

		expect( tooltipData?.datumByKey.Views ).toEqual( {
			datum: { date: JULY_1, value: 100 },
			index: 0,
			key: 'Views',
		} );
	} );

	it( "appends an extra's comparison point right after it, under a key that maps back to the label", () => {
		const withPrevious = { ...CPM, previous: [ { date: JULY_1, realDate: JULY_2, value: 0.1 } ] };
		const tooltipData = appendTooltipExtras( hoveredAt( JULY_1 ), [ withPrevious, REVENUE ] );
		const previousKey = previousRowKey( 'Average CPM' );

		expect( Object.keys( tooltipData?.datumByKey ?? {} ) ).toEqual( [
			'Views',
			'Average CPM',
			previousKey,
			'Revenue',
		] );
		expect( tooltipData?.datumByKey?.[ previousKey ] ).toMatchObject( {
			datum: { realDate: JULY_2, value: 0.1 },
		} );
		expect( previousRowLabel( previousKey ) ).toBe( 'Average CPM' );
		expect( previousRowLabel( 'Average CPM' ) ).toBeUndefined();
	} );

	it( 'returns the data untouched without extras or a hovered point', () => {
		const data = hoveredAt( JULY_1 );

		expect( appendTooltipExtras( data, undefined ) ).toBe( data );
		expect( appendTooltipExtras( data, [] ) ).toBe( data );
		expect( appendTooltipExtras( undefined, [ CPM ] ) ).toBeUndefined();
		expect( appendTooltipExtras( { datumByKey: data.datumByKey }, [ CPM ] ) ).toEqual( {
			datumByKey: data.datumByKey,
		} );
	} );
} );
