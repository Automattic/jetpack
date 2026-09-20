/**
 * @jest-environment <rootDir>/tests/environment-los-angeles.mjs
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import AreaChart from '../area-chart';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

// 09:30 on the Tokyo calendar day.
const morning = new Date( '2026-08-02T00:30:00Z' );

describe( 'area chart tooltip bucket info', () => {
	it( 'names the hour on a mounted chart', async () => {
		const user = userEvent.setup();
		render(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				<AreaChart
					width={ 500 }
					height={ 300 }
					options={ { axis: { x: { tickResolution: 'hour' } } } }
					data={ [ { label: 'Series A', data: [ { date: morning, value: 10 } ], options: {} } ] }
				/>
			</GlobalChartsProvider>
		);

		screen.getByRole( 'grid', { name: /area chart/i } ).focus();
		await user.keyboard( '{ArrowRight}' );

		expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( '2.8.2026, 09 Uhr' );
	} );

	// The axis keeps a hidden area in its domain for the animation, but the
	// tooltip drops its data, so the bucket has to follow the tooltip.
	it( 'ignores a hidden series when naming the bucket', async () => {
		const user = userEvent.setup();
		const hourly = Array.from( { length: 4 }, ( _, index ) => ( {
			date: new Date( Date.UTC( 2026, 7, 2, index ) ),
			value: index,
		} ) );
		const daily = Array.from( { length: 3 }, ( _, index ) => ( {
			date: new Date( Date.UTC( 2026, 7, 2 + index ) ),
			value: index,
		} ) );

		render(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				<AreaChart
					width={ 500 }
					height={ 300 }
					defaultHiddenSeries={ [ 'Hourly' ] }
					data={ [
						{ label: 'Hourly', data: hourly, options: {} },
						{ label: 'Daily', data: daily, options: {} },
					] }
				/>
			</GlobalChartsProvider>
		);

		screen.getByRole( 'grid', { name: /area chart/i } ).focus();
		await user.keyboard( '{ArrowRight}' );

		expect( screen.getByTestId( 'chart-tooltip-0' ) ).not.toHaveTextContent( 'Uhr' );
	} );
} );
