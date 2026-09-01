import { render, screen } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import { runTestsInTimeZone } from '../../../test-utils/runtime-time-zone';
import LineChart from '../line-chart';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

// Each instant below is one day in Los Angeles and the next in Tokyo.
runTestsInTimeZone( 'America/Los_Angeles' );

const data = [
	{
		label: 'Series A',
		data: Array.from( { length: 8 }, ( _, index ) => ( {
			date: new Date( new Date( '2026-08-02T15:30:00Z' ).getTime() + index * 86400000 ),
			value: index,
		} ) ),
		options: {},
	},
];

describe( 'line chart tick placement', () => {
	it( 'places one tick per host zone calendar day, with no gap', () => {
		render(
			<GlobalChartsProvider locale="en-US" timeZone="Asia/Tokyo">
				<LineChart width={ 500 } height={ 300 } withGradientFill={ false } data={ data } />
			</GlobalChartsProvider>
		);

		// The 8 data points land on 8 consecutive Tokyo days, Aug 3 to Aug 10.
		const ticks = screen.getAllByText( /^[A-Z][a-z]{2} \d{1,2}$/ );
		expect( ticks.map( tick => tick.textContent ) ).toEqual( [
			'Aug 3',
			'Aug 4',
			'Aug 5',
			'Aug 6',
			'Aug 7',
			'Aug 8',
			'Aug 9',
			'Aug 10',
		] );
	} );
} );
