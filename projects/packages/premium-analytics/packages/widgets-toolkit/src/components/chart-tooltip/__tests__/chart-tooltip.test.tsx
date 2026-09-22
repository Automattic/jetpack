/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { MetricValue } from '../../metric-value';
import { ChartTooltip } from '../chart-tooltip';

// The library's shape components need a provider jsdom cannot lay out, so stand
// them in for elements that expose the style they were handed.
jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	LineShape: ( { fill }: { fill: string } ) => <span data-testid="swatch" data-fill={ fill } />,
	RectShape: ( { fill }: { fill: string } ) => <span data-testid="swatch" data-fill={ fill } />,
	Stack: ( { children }: { children?: React.ReactNode } ) => <div>{ children }</div>,
} ) );

// Wrapped, not replaced: `MetricValue` renders an empty span for `undefined`, so
// only its call count tells an inline row from a split row with a blank value.
jest.mock( '../../metric-value', () => {
	const actual = jest.requireActual( '../../metric-value' );
	return { ...actual, MetricValue: jest.fn( actual.MetricValue ) };
} );

beforeEach( () => {
	jest.mocked( MetricValue ).mockClear();
} );

const DATA_FORMAT = { type: 'number' as const, options: { decimals: 0 } };

const STYLES = [
	{ stroke: '#views' },
	{ stroke: '#views-previous' },
	{ stroke: '#visitors' },
	{ stroke: '#visitors-previous' },
];

// The order a bar chart reports its rows in: both current periods, then both
// previous ones — not the order the series (and so the styles) are in.
const TOOLTIP_DATA = {
	datumByKey: {
		Views: { datum: { value: 100 }, index: 0, key: 'Views' },
		Visitors: { datum: { value: 40 }, index: 2, key: 'Visitors' },
		'Views · June': { datum: { value: 80 }, index: 1, key: 'Views · June' },
		'Visitors · June': { datum: { value: 30 }, index: 3, key: 'Visitors · June' },
	},
};

const swatchFills = () =>
	screen.getAllByTestId( 'swatch' ).map( node => node.getAttribute( 'data-fill' ) );

describe( 'ChartTooltip', () => {
	it( 'spells a compact chart value out in full', () => {
		render(
			<ChartTooltip
				tooltipData={ {
					datumByKey: { Views: { datum: { value: 18432 }, index: 0, key: 'Views' } },
				} }
				dataFormat={ { type: 'number', options: { useMultipliers: true } } }
				seriesStyles={ STYLES }
				indicatorType="rect"
				getLabel={ () => 'Views' }
			/>
		);

		expect( screen.getByText( '18,432' ) ).toBeInTheDocument();
		expect( screen.queryByText( '18.4K' ) ).not.toBeInTheDocument();
	} );

	it( 'reads a missing value as No data and keeps a real zero', () => {
		render(
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						Views: { datum: { value: null }, index: 0, key: 'Views' },
						Visitors: { datum: { value: 0 }, index: 1, key: 'Visitors' },
					},
				} }
				dataFormat={ DATA_FORMAT }
				seriesStyles={ STYLES }
				indicatorType="rect"
				getLabel={ ( _datum, _index, key ) => key }
			/>
		);

		expect( screen.getAllByText( 'No data' ) ).toHaveLength( 1 );
		expect( screen.getByText( '0' ) ).toBeInTheDocument();
	} );

	it( 'pairs each row with its own series style when given series keys', () => {
		render(
			<ChartTooltip
				tooltipData={ TOOLTIP_DATA }
				dataFormat={ DATA_FORMAT }
				seriesStyles={ STYLES }
				seriesKeys={ [ 'Views', 'Views · June', 'Visitors', 'Visitors · June' ] }
				indicatorType="rect"
				getLabel={ ( _datum, _index, key ) => key }
			/>
		);

		expect( swatchFills() ).toEqual( [
			'#views',
			'#visitors',
			'#views-previous',
			'#visitors-previous',
		] );
	} );

	it( 'gives a row it has no key for the first style, not a borrowed one', () => {
		render(
			<ChartTooltip
				tooltipData={ TOOLTIP_DATA }
				dataFormat={ DATA_FORMAT }
				seriesStyles={ STYLES }
				// Short list: neither Visitors row appears in it.
				seriesKeys={ [ 'Views', 'Views · June' ] }
				indicatorType="rect"
				getLabel={ ( _datum, _index, key ) => key }
			/>
		);

		// Falling back to the row's position would hand these '#views-previous'
		// and '#visitors-previous' — a wrong swatch that still looks deliberate.
		expect( swatchFills() ).toEqual( [ '#views', '#views', '#views-previous', '#views' ] );
	} );

	it( 'falls back to position when no series keys are given', () => {
		render(
			<ChartTooltip
				tooltipData={ TOOLTIP_DATA }
				dataFormat={ DATA_FORMAT }
				seriesStyles={ STYLES }
				indicatorType="rect"
				getLabel={ ( _datum, _index, key ) => key }
			/>
		);

		// Charts whose rows already arrive in series order keep the old behaviour.
		expect( swatchFills() ).toEqual( [
			'#views',
			'#views-previous',
			'#visitors',
			'#visitors-previous',
		] );
	} );

	it( 'reads a supplementary row out without a swatch, in its own format', () => {
		render(
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						'Ads Served': { datum: { value: 131 }, index: 0, key: 'Ads Served' },
						'Average CPM': { datum: { value: 0.15 }, index: 1, key: 'Average CPM' },
					},
				} }
				dataFormat={ DATA_FORMAT }
				seriesStyles={ STYLES }
				seriesKeys={ [ 'Ads Served' ] }
				indicatorType="line"
				supplementaryRows={ { 'Average CPM': { type: 'currency', options: { decimals: 2 } } } }
				getLabel={ ( _datum, _index, key ) => key }
			/>
		);

		// One swatch for the drawn series; the count format would have rendered
		// the CPM as a bare "0".
		expect( swatchFills() ).toEqual( [ '#views' ] );
		expect( screen.getByText( 'Average CPM' ) ).toBeInTheDocument();
		expect( screen.getByText( /\$0\.15/ ) ).toBeInTheDocument();
	} );

	it( 'keeps the chart format for a supplementary row that names none', () => {
		render(
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						Views: { datum: { value: 100 }, index: 0, key: 'Views' },
						Visitors: { datum: { value: 40 }, index: 1, key: 'Visitors' },
					},
				} }
				dataFormat={ DATA_FORMAT }
				seriesStyles={ STYLES }
				seriesKeys={ [ 'Views' ] }
				indicatorType="rect"
				supplementaryRows={ { Visitors: undefined } }
				getLabel={ ( _datum, _index, key ) => key }
			/>
		);

		expect( swatchFills() ).toEqual( [ '#views' ] );
		expect( screen.getByText( '40' ) ).toBeInTheDocument();
	} );

	it( "hands getLabel each row's value spelled out in that row's format", () => {
		const getLabel = jest.fn( ( _datum, _index, key: string ) => key );

		render(
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						'Ads Served': { datum: { value: 18432 }, index: 0, key: 'Ads Served' },
						'Average CPM': { datum: { value: 0.15 }, index: 1, key: 'Average CPM' },
					},
				} }
				dataFormat={ { type: 'number', options: { useMultipliers: true } } }
				seriesStyles={ STYLES }
				seriesKeys={ [ 'Ads Served' ] }
				indicatorType="line"
				supplementaryRows={ { 'Average CPM': { type: 'currency', options: { decimals: 2 } } } }
				getLabel={ getLabel }
			/>
		);

		expect( getLabel ).toHaveBeenCalledWith( { value: 18432 }, 0, 'Ads Served', '18,432' );
		expect( getLabel ).toHaveBeenCalledWith(
			{ value: 0.15 },
			1,
			'Average CPM',
			expect.stringMatching( /\$0\.15/ )
		);
	} );

	it( 'renders an inline row as the label alone, with no value column', () => {
		render(
			<ChartTooltip
				tooltipData={ {
					datumByKey: { Views: { datum: { value: 100 }, index: 0, key: 'Views' } },
				} }
				dataFormat={ DATA_FORMAT }
				seriesStyles={ STYLES }
				indicatorType="line"
				layout="inline"
				getLabel={ ( _datum, _index, key, value ) => `${ value } ${ key }` }
			/>
		);

		expect( screen.getByText( '100 Views' ) ).toBeInTheDocument();
		expect( MetricValue ).not.toHaveBeenCalled();
	} );

	it( 'spells a missing value as No data into an inline label', () => {
		render(
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						Views: { datum: { value: null }, index: 0, key: 'Views' },
						Visitors: { datum: { value: 0 }, index: 1, key: 'Visitors' },
					},
				} }
				dataFormat={ DATA_FORMAT }
				seriesStyles={ STYLES }
				indicatorType="line"
				layout="inline"
				getLabel={ ( _datum, _index, key, value ) => `${ value } ${ key }` }
			/>
		);

		expect( screen.getByText( 'No data Views' ) ).toBeInTheDocument();
		expect( screen.getByText( '0 Visitors' ) ).toBeInTheDocument();
	} );
} );
