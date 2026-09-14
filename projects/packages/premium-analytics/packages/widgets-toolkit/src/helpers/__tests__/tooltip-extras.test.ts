/**
 * Internal dependencies
 */
import { appendTooltipExtras, resolveTooltipNames } from '../tooltip-extras';

const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
const JULY_2 = new Date( '2026-07-02T00:00:00Z' );
const CURRENCY = { type: 'currency' as const, options: { decimals: 2 } };

const CPM = { label: 'Average CPM', data: [ { date: JULY_1, value: 0.15 } ], dataFormat: CURRENCY };
const REVENUE = { label: 'Revenue', data: [ { date: JULY_1, value: 12 } ] };

const hoveredAt = ( date: Date ) => ( {
	nearestDatum: { datum: { date, value: 100 }, key: 'Views' },
	datumByKey: { Views: { datum: { date, value: 100 }, index: 0, key: 'Views' } },
} );

describe( 'appendTooltipExtras', () => {
	it( "appends each extra's point for the hovered date and reports it as supplementary", () => {
		const { tooltipData, supplementaryRows } = appendTooltipExtras( hoveredAt( JULY_1 ), [
			CPM,
			REVENUE,
		] );

		// `index` only has to exist on a row, so its value is not asserted.
		expect( tooltipData?.datumByKey ).toEqual( {
			Views: { datum: { date: JULY_1, value: 100 }, index: 0, key: 'Views' },
			'Average CPM': expect.objectContaining( {
				datum: { date: JULY_1, value: 0.15 },
				key: 'Average CPM',
			} ),
			Revenue: expect.objectContaining( { datum: { date: JULY_1, value: 12 }, key: 'Revenue' } ),
		} );
		// An extra with no format of its own keeps the chart's.
		expect( supplementaryRows ).toEqual( { 'Average CPM': CURRENCY, Revenue: undefined } );
	} );

	it( 'skips an extra with no point for the hovered date', () => {
		const { tooltipData, supplementaryRows } = appendTooltipExtras( hoveredAt( JULY_2 ), [ CPM ] );

		expect( Object.keys( tooltipData?.datumByKey ?? {} ) ).toEqual( [ 'Views' ] );
		expect( supplementaryRows ).toBeUndefined();
	} );

	it( 'leaves a key the chart already reports alone, swatch included', () => {
		const drawn = { label: 'Views', data: [ { date: JULY_1, value: 999 } ] };

		const { tooltipData, supplementaryRows } = appendTooltipExtras( hoveredAt( JULY_1 ), [
			drawn,
			CPM,
		] );

		// The chart's own row wins, and it is not marked supplementary.
		expect( tooltipData?.datumByKey.Views ).toEqual( {
			datum: { date: JULY_1, value: 100 },
			index: 0,
			key: 'Views',
		} );
		expect( supplementaryRows ).toEqual( { 'Average CPM': CURRENCY } );
	} );

	it( 'returns the data untouched without extras or a hovered point', () => {
		const data = hoveredAt( JULY_1 );

		expect( appendTooltipExtras( data, [] ) ).toEqual( {
			tooltipData: data,
			supplementaryRows: undefined,
		} );
		expect( appendTooltipExtras( data, undefined ).tooltipData ).toBe( data );
		expect( appendTooltipExtras( { datumByKey: data.datumByKey }, [ CPM ] ).tooltipData ).toEqual( {
			datumByKey: data.datumByKey,
		} );
		expect( appendTooltipExtras( undefined, [ CPM ] ).tooltipData ).toBeUndefined();
	} );
} );

describe( 'resolveTooltipNames', () => {
	const seriesNames = new Map( [ [ 'Views', 'Views' ] ] );

	it( 'hands the series names back as they are without extras', () => {
		expect( resolveTooltipNames( seriesNames, false, undefined ) ).toEqual( {
			names: seriesNames,
			namesRows: false,
		} );
		expect( resolveTooltipNames( seriesNames, true, [] ).namesRows ).toBe( true );
	} );

	it( 'names each extra after itself and turns row naming on', () => {
		const { names, namesRows } = resolveTooltipNames( seriesNames, false, [ CPM ] );

		expect( names.get( 'Views' ) ).toBe( 'Views' );
		expect( names.get( 'Average CPM' ) ).toBe( 'Average CPM' );
		expect( namesRows ).toBe( true );
		// The input map is not mutated.
		expect( seriesNames.has( 'Average CPM' ) ).toBe( false );
	} );
} );
