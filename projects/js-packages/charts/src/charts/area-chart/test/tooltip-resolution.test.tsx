import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GlobalChartsProvider } from '../../../providers';
import { runTestsInTimeZone } from '../../../test-utils/runtime-time-zone';
import AreaChart from '../area-chart';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

runTestsInTimeZone( 'America/Los_Angeles' );

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

		expect( screen.getByTestId( 'chart-tooltip-0' ) ).toHaveTextContent( '2.8.2026, 9 AM' );
	} );
} );
