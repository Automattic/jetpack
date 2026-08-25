/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ChartTooltip } from '../chart-tooltip';

// The swatches come from the charts library's own shape components, which need
// a provider jsdom cannot lay out. Stand them in for elements that expose the
// style they were handed.
jest.mock( '@jetpack-premium-analytics/externals', () => ( {
	LineShape: ( { fill }: { fill: string } ) => <span data-testid="swatch" data-fill={ fill } />,
	RectShape: ( { fill }: { fill: string } ) => <span data-testid="swatch" data-fill={ fill } />,
	Stack: ( { children }: { children?: React.ReactNode } ) => <div>{ children }</div>,
} ) );

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
} );
