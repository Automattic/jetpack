/**
 * External dependencies
 */
import { _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { appendTooltipExtras, resolveTooltipUnits } from '../tooltip-extras';

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

	it( 'keeps an extra whose point for the hovered date has no reading', () => {
		const gap = { ...CPM, data: [ { date: JULY_1, value: null } ] };
		const { tooltipData, supplementaryRows } = appendTooltipExtras( hoveredAt( JULY_1 ), [ gap ] );

		expect( tooltipData?.datumByKey?.[ 'Average CPM' ] ).toEqual(
			expect.objectContaining( { datum: { date: JULY_1, value: null } } )
		);
		expect( supplementaryRows ).toEqual( { 'Average CPM': CURRENCY } );
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

describe( 'resolveTooltipUnits', () => {
	const views = ( count: number ) =>
		/* translators: %s: number of views. */
		_n( '%s View', '%s Views', count, 'jetpack-premium-analytics-pkg' );
	const impressions = ( count: number ) =>
		/* translators: %s: number of impressions. */
		_n( '%s Impression', '%s Impressions', count, 'jetpack-premium-analytics-pkg' );

	it( "reads a comparison row as its group's current period, count label included", () => {
		const units = resolveTooltipUnits(
			[
				{ label: 'Views', group: 'views', data: [], countLabel: views },
				{ label: 'Visitors', group: 'visitors', data: [] },
				{
					label: 'Views · previous period',
					group: 'views',
					data: [],
					options: { type: 'comparison' },
				},
				{
					label: 'Visitors · previous period',
					group: 'visitors',
					data: [],
					options: { type: 'comparison' },
				},
			],
			undefined
		);

		expect( units.get( 'Views · previous period' ) ).toEqual( {
			name: 'Views',
			countLabel: views,
		} );
		expect( units.get( 'Visitors · previous period' ) ).toEqual( {
			name: 'Visitors',
			countLabel: undefined,
		} );
	} );

	it( 'reads a group-less series as itself', () => {
		const units = resolveTooltipUnits( [ { label: 'Likes', data: [] } ], undefined );

		expect( units.get( 'Likes' ) ).toEqual( { name: 'Likes', countLabel: undefined } );
	} );

	it( "reads each extra as itself, without overriding a drawn series'", () => {
		const units = resolveTooltipUnits(
			[ { label: 'Views', group: 'views', data: [], countLabel: views } ],
			[
				{ label: 'Impressions', data: [], countLabel: impressions },
				{ label: 'Views', data: [], countLabel: impressions },
				CPM,
			]
		);

		expect( units.get( 'Impressions' ) ).toEqual( {
			name: 'Impressions',
			countLabel: impressions,
		} );
		expect( units.get( 'Views' ) ).toEqual( { name: 'Views', countLabel: views } );
		expect( units.get( 'Average CPM' ) ).toEqual( { name: 'Average CPM', countLabel: undefined } );
	} );
} );
