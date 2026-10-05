/**
 * Internal dependencies
 */
import { previousRowKey } from '../../../helpers/tooltip-extras';
import { buildDatedTooltipModel } from '../dated-tooltip-model';
import type { ComparativeLineChartSeries } from '../../chart-comparative-line/types';

const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
const JUNE_1 = new Date( '2026-06-01T00:00:00Z' );
const DATA_FORMAT = { type: 'number' as const };
const CURRENCY = { type: 'currency' as const, options: { decimals: 2 } };

const SERIES: ComparativeLineChartSeries[] = [
	{ label: 'Views', group: 'views', data: [] },
	{ label: 'Views · previous period', group: 'views', options: { type: 'comparison' }, data: [] },
	{ label: 'Visitors', group: 'visitors', data: [] },
];
const STYLES = [ { stroke: '#views' }, { stroke: '#views-previous' }, { stroke: '#visitors' } ];

type Entry = [ string, { datum: Record< string, unknown >; index: number; key: string } ];
const entry = ( key: string, datum: Record< string, unknown > ): Entry => [
	key,
	{ datum, index: 0, key },
];
const formatDate = ( date: Date ) => date.toISOString().slice( 0, 10 );

function modelFor(
	entries: Entry[],
	extras?: Parameters< typeof buildDatedTooltipModel >[ 0 ][ 'extras' ]
) {
	return buildDatedTooltipModel( {
		tooltipData: {
			nearestDatum: { datum: entries[ 0 ]?.[ 1 ].datum },
			datumByKey: Object.fromEntries( entries ),
		},
		series: SERIES,
		seriesStyles: STYLES,
		extras,
		dataFormat: DATA_FORMAT,
		formatDate,
	} );
}

describe( 'buildDatedTooltipModel', () => {
	it( 'returns null with nothing hovered', () => {
		expect( modelFor( [] ) ).toBeNull();
	} );

	it( 'heads the rows with the hovered date and gives each drawn row its swatch', () => {
		const model = modelFor( [
			entry( 'Views', { date: JULY_1, value: 100 } ),
			entry( 'Visitors', { date: JULY_1, value: 40 } ),
		] );

		expect( model ).toEqual( {
			date: '2026-07-01',
			previousDate: undefined,
			rows: [
				expect.objectContaining( {
					name: 'Views',
					value: 100,
					indicator: { kind: 'series', style: { stroke: '#views' } },
				} ),
				expect.objectContaining( {
					name: 'Visitors',
					value: 40,
					indicator: { kind: 'series', style: { stroke: '#visitors' } },
				} ),
			],
		} );
	} );

	it( 'pairs a comparison with its group under the comparison date, whatever order the rows arrive in', () => {
		const model = modelFor( [
			entry( 'Views · previous period', { date: JULY_1, realDate: JUNE_1, value: 80 } ),
			entry( 'Views', { date: JULY_1, value: 100 } ),
		] );

		expect( model?.previousDate ).toBe( '2026-06-01' );
		expect( model?.rows ).toEqual( [
			expect.objectContaining( {
				name: 'Views',
				value: 100,
				previous: { value: 80, style: { stroke: '#views-previous' } },
			} ),
		] );
	} );

	it( 'drops a comparison whose metric is not reported, as a hidden series is not', () => {
		const model = modelFor( [
			entry( 'Visitors', { date: JULY_1, value: 40 } ),
			entry( 'Views · previous period', { date: JULY_1, realDate: JUNE_1, value: 80 } ),
		] );

		expect( model?.rows.map( row => row.name ) ).toEqual( [ 'Visitors' ] );
		expect( model?.previousDate ).toBeUndefined();
	} );

	it( 'reads an extra as its own row with its icon, format and comparison', () => {
		const cpm = { label: 'Average CPM', icon: <span />, data: [], dataFormat: CURRENCY };
		const model = modelFor(
			[
				entry( 'Views', { date: JULY_1, value: 100 } ),
				entry( 'Average CPM', { date: JULY_1, value: 0.15 } ),
				entry( previousRowKey( 'Average CPM' ), { date: JULY_1, realDate: JUNE_1, value: 0.1 } ),
			],
			[ cpm ]
		);

		expect( model?.rows[ 1 ] ).toEqual( {
			key: 'Average CPM',
			name: 'Average CPM',
			countLabel: undefined,
			dataFormat: CURRENCY,
			indicator: { kind: 'icon', icon: cpm.icon },
			value: 0.15,
			previous: { value: 0.1, style: undefined },
		} );
		expect( model?.previousDate ).toBe( '2026-06-01' );
	} );

	it( 'leaves an extra without an icon blank, and keeps a null reading as a row', () => {
		const model = modelFor(
			[ entry( 'Revenue', { date: JULY_1, value: null } ) ],
			[ { label: 'Revenue', data: [] } ]
		);

		expect( model?.rows ).toEqual( [
			expect.objectContaining( { name: 'Revenue', value: null, indicator: { kind: 'blank' } } ),
		] );
	} );
} );
