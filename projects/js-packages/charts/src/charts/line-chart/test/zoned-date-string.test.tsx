/**
 * @jest-environment <rootDir>/tests/environment-auckland.mjs
 */
import { render, screen } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import LineChart from '../line-chart';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

// Naive day strings, the shape the Stats payload gives for day buckets.
const data = [
	{
		label: 'Series A',
		data: [
			{ dateString: '2026-08-02', value: 1 },
			{ dateString: '2026-08-03', value: 2 },
			{ dateString: '2026-08-04', value: 3 },
		],
		options: {},
	},
];

describe( 'dateString under a host time zone', () => {
	it( 'dates a naive string in the host zone, not the viewer browser zone', () => {
		render(
			<GlobalChartsProvider locale="en-US" timeZone="Asia/Tokyo">
				<LineChart width={ 500 } height={ 300 } withGradientFill={ false } data={ data } />
			</GlobalChartsProvider>
		);

		const ticks = screen.getAllByText( /^[A-Z][a-z]{2} \d{1,2}$/ );
		expect( ticks.map( tick => tick.textContent ) ).toEqual( [ 'Aug 2', 'Aug 3', 'Aug 4' ] );
	} );
} );
