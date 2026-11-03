/**
 * @jest-environment <rootDir>/tests/environment-los-angeles.mjs
 */
import { render } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import AreaChart from '../area-chart';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

const monthly = ( label: string, count: number ) => ( {
	label,
	data: Array.from( { length: count }, ( _, index ) => ( {
		date: new Date( Date.UTC( 2026, index, 1, 12 ) ),
		value: index,
	} ) ),
	options: {},
} );

const xAxisTickOffsets = ( container: HTMLElement ) => {
	/* eslint-disable testing-library/no-node-access -- A tick's position is an SVG attribute no query reaches. */
	const xAxis = container.querySelectorAll( '.visx-axis' )[ 0 ];
	return Array.from( xAxis.querySelectorAll( '.visx-axis-tick text' ) ).map( tick =>
		Number( tick.getAttribute( 'x' ) )
	);
	/* eslint-enable testing-library/no-node-access */
};

const renderChart = ( defaultHiddenSeries?: string[] ) =>
	render(
		<GlobalChartsProvider locale="en-US" timeZone="Asia/Tokyo">
			<AreaChart
				width={ 500 }
				height={ 300 }
				data={ [ monthly( 'Long', 12 ), monthly( 'Short', 3 ) ] }
				defaultHiddenSeries={ defaultHiddenSeries }
			/>
		</GlobalChartsProvider>
	);

describe( 'area chart tick placement', () => {
	it( 'keeps ticks spanning the full domain when a series is hidden', () => {
		const shown = xAxisTickOffsets( renderChart().container );
		const hidden = xAxisTickOffsets( renderChart( [ 'Long' ] ).container );

		expect( hidden ).toEqual( shown );
		expect( hidden.length ).toBeGreaterThan( 1 );
		for ( const offset of hidden ) {
			expect( offset ).toBeGreaterThanOrEqual( 0 );
			expect( offset ).toBeLessThanOrEqual( 500 );
		}
	} );
} );
