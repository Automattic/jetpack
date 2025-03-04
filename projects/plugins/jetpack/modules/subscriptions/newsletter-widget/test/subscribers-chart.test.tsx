import { render, screen } from '@testing-library/react';
import { SubscribersChart } from '../src/components/subscribers-chart';
import type { DailyCount } from '../src/types';

// Mock the ParentSize component to provide dimensions
jest.mock( '@visx/responsive', () => ( {
	ParentSize: ( { children } ) => children( { width: 500, height: 300 } ),
} ) );

describe( 'SubscribersChart', () => {
	const mockCountsByDay: Record< string, DailyCount > = {
		'2023-01-01': { all: 10, email: 5, paid: 5 },
		'2023-01-02': { all: 15, email: 10, paid: 5 },
		'2023-01-03': { all: 20, email: 12, paid: 8 },
	};

	it( 'renders', async () => {
		render( <SubscribersChart countsByDay={ mockCountsByDay } /> );

		const chart = await screen.findByLabelText( 'XYChart' );

		expect( chart ).toBeInTheDocument();
	} );

	it( 'displays a message when no data is available', () => {
		render( <SubscribersChart countsByDay={ {} } /> );

		expect( screen.getByText( 'No data available' ) ).toBeInTheDocument();
	} );
} );
