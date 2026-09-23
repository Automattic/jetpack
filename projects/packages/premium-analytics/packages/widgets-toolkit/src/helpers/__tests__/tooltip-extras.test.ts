/**
 * External dependencies
 */
import { _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	appendTooltipExtras,
	resolveTooltipCountLabels,
	resolveTooltipNames,
} from '../tooltip-extras';

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
		expect( resolveTooltipNames( seriesNames, undefined ) ).toBe( seriesNames );
		expect( resolveTooltipNames( seriesNames, [] ) ).toBe( seriesNames );
	} );

	it( 'names each extra after itself', () => {
		const names = resolveTooltipNames( seriesNames, [ CPM ] );

		expect( names.get( 'Views' ) ).toBe( 'Views' );
		expect( names.get( 'Average CPM' ) ).toBe( 'Average CPM' );
		// The input map is not mutated.
		expect( seriesNames.has( 'Average CPM' ) ).toBe( false );
	} );

	it( 'keeps the name resolved for a drawn series that is also listed as an extra', () => {
		const names = resolveTooltipNames( new Map( [ [ 'July', 'Views' ] ] ), [
			{ label: 'July', data: [] },
		] );

		expect( names.get( 'July' ) ).toBe( 'Views' );
	} );
} );

describe( 'resolveTooltipCountLabels', () => {
	const views = ( count: number ) =>
		/* translators: %s: number of views. */
		_n( '%s view', '%s views', count, 'jetpack-premium-analytics-pkg' );
	const impressions = ( count: number ) =>
		/* translators: %s: number of impressions. */
		_n( '%s impression', '%s impressions', count, 'jetpack-premium-analytics-pkg' );

	it( "gives a comparison series its group's count label", () => {
		const labels = resolveTooltipCountLabels(
			[
				{ label: 'Views', group: 'views', data: [], countLabel: views },
				{
					label: 'Views · previous period',
					group: 'views',
					data: [],
					options: { type: 'comparison' },
				},
			],
			undefined
		);

		expect( labels.get( 'Views' ) ).toBe( views );
		expect( labels.get( 'Views · previous period' ) ).toBe( views );
	} );

	it( 'leaves a series without a count label out, so it keeps its name as the unit', () => {
		const labels = resolveTooltipCountLabels(
			[ { label: 'Revenue', group: 'revenue', data: [] } ],
			undefined
		);

		expect( labels.has( 'Revenue' ) ).toBe( false );
	} );

	it( "adds each extra's count label, without overriding a drawn series'", () => {
		const labels = resolveTooltipCountLabels(
			[ { label: 'Views', group: 'views', data: [], countLabel: views } ],
			[
				{ label: 'Impressions', data: [], countLabel: impressions },
				{ label: 'Views', data: [], countLabel: impressions },
				CPM,
			]
		);

		expect( labels.get( 'Impressions' ) ).toBe( impressions );
		expect( labels.get( 'Views' ) ).toBe( views );
		expect( labels.has( 'Average CPM' ) ).toBe( false );
	} );
} );
