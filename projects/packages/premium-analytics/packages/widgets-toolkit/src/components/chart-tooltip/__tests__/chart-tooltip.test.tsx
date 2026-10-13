/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ChartTooltip } from '../chart-tooltip';

// The library's shape components need a provider jsdom cannot lay out; the shared
// stand-ins expose the fill they were handed.
jest.mock( '@jetpack-premium-analytics/externals', () =>
	jest.requireActual( '../../../../../../tests/js/chart-test-utils' ).mockChartExternals()
);

jest.mock(
	'@wordpress/compose',
	() => jest.requireActual( '../../../../../../tests/js/chart-test-utils' ).mockWordPressCompose
);

const DATA_FORMAT = { type: 'number' as const, options: { decimals: 0 } };

const STYLES = [
	{ stroke: '#views' },
	{ stroke: '#views-previous' },
	{ stroke: '#visitors' },
	{ stroke: '#visitors-previous' },
];

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

	it( "hands getLabel each row's value spelled out in full, and the raw value", () => {
		const getLabel = jest.fn( ( _datum, _index, key: string ) => key );

		render(
			<ChartTooltip
				tooltipData={ {
					datumByKey: {
						'Ads Served': { datum: { value: 18432 }, index: 0, key: 'Ads Served' },
					},
				} }
				dataFormat={ { type: 'number', options: { useMultipliers: true } } }
				seriesStyles={ STYLES }
				indicatorType="line"
				getLabel={ getLabel }
			/>
		);

		expect( getLabel ).toHaveBeenCalledWith( { value: 18432 }, 0, 'Ads Served', '18,432', 18432 );
	} );

	it( 'hands getLabel null for a missing value, and a real zero as 0', () => {
		const getLabel = jest.fn( ( _datum, _index, key: string ) => key );

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
				getLabel={ getLabel }
			/>
		);

		expect( getLabel ).toHaveBeenCalledWith( { value: null }, 0, 'Views', null, null );
		expect( getLabel ).toHaveBeenCalledWith( { value: 0 }, 1, 'Visitors', '0', 0 );
	} );
} );
