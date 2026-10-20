import { render, screen } from '@testing-library/react';
import { SubscribersChart } from '../src/components/subscribers-chart';
import type { SubscriberTotals } from '../src/types';

// Mock the ParentSize component to provide dimensions
jest.mock( '@visx/responsive', () => ( {
	ParentSize: ( { children } ) => children( { width: 500, height: 300 } ),
} ) );

describe( 'SubscribersChart', () => {
	const mockCountsByDay: Record< string, SubscriberTotals > = {
		'2023-01-01': { all: 10, paid: 5 },
		'2023-01-02': { all: 15, paid: 5 },
		'2023-01-03': { all: 20, paid: 8 },
	};

	it( 'renders', async () => {
		render( <SubscribersChart subscriberTotalsByDate={ mockCountsByDay } /> );

		const chart = await screen.findByLabelText( 'XYChart' );

		expect( chart ).toBeInTheDocument();
	} );

	it( 'labels the top of the y axis above the highest data point', async () => {
		render(
			<SubscribersChart
				subscriberTotalsByDate={ {
					'2023-01-01': { all: 10, paid: 5 },
					'2023-01-02': { all: 30, paid: 5 },
					'2023-01-03': { all: 45, paid: 8 },
				} }
			/>
		);

		await expect( screen.findByLabelText( 'XYChart' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( '50', { selector: 'tspan' } ) ).toBeInTheDocument();
	} );

	it( 'labels the top of the y axis when the counts sit far above zero', async () => {
		render(
			<SubscribersChart
				subscriberTotalsByDate={ {
					'2023-01-01': { all: 800, paid: 820 },
					'2023-01-02': { all: 870, paid: 850 },
				} }
			/>
		);

		await expect( screen.findByLabelText( 'XYChart' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( '1,000', { selector: 'tspan' } ) ).toBeInTheDocument();
	} );

	it( 'displays a message when no data is available', () => {
		render( <SubscribersChart subscriberTotalsByDate={ {} } /> );

		expect( screen.getByText( 'No data available' ) ).toBeInTheDocument();
	} );
} );
