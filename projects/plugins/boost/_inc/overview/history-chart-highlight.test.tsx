/* eslint-disable testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { type ComponentProps, type PropsWithChildren } from 'react';
import HistoryChartCard from './history-chart-card';
import { getHistoryWindow } from './lib/history-days';
import type { BarChart } from '@automattic/charts';

jest.mock( '@automattic/charts', () => ( {
	GlobalChartsProvider: ( { children }: PropsWithChildren ) => children,
	// No unmount notification: these tests isolate the card's own highlight lifecycle.
	BarChart: ( { data, onCategoryHighlightChange }: ComponentProps< typeof BarChart > ) => (
		<div>
			<button
				onClick={ () =>
					onCategoryHighlightChange?.( {
						datum: data[ 0 ].data[ 0 ],
						x: 20,
						y: 0,
						width: 10,
						height: 100,
					} )
				}
			>
				{ `Highlight ${ data[ 0 ].label }` }
			</button>
			<button onClick={ () => onCategoryHighlightChange?.( null ) }>
				{ `Leave ${ data[ 0 ].label }` }
			</button>
		</div>
	),
} ) );

const props = {
	range: getHistoryWindow( 0 ),
	dayCount: 30 as const,
	canGoNext: false,
	onPrevious: jest.fn(),
	onNext: jest.fn(),
	onRetry: jest.fn(),
	onDismissFreshStart: jest.fn(),
};

test( 'keeps the entering chart highlighted when the other chart clears its selection', () => {
	render( <HistoryChartCard { ...props } /> );
	fireEvent.click( screen.getByRole( 'button', { name: 'Highlight Desktop' } ) );
	fireEvent.click( screen.getByRole( 'button', { name: 'Highlight Mobile' } ) );
	fireEvent.click( screen.getByRole( 'button', { name: 'Leave Desktop' } ) );
	expect( screen.getByTestId( 'history-highlight' ) ).toBeInTheDocument();
	fireEvent.click( screen.getByRole( 'button', { name: 'Leave Mobile' } ) );
	expect( screen.queryByTestId( 'history-highlight' ) ).not.toBeInTheDocument();
} );

test( 'resets the highlight on paging even without a chart cleanup notification', () => {
	const { rerender } = render( <HistoryChartCard { ...props } /> );
	fireEvent.click( screen.getByRole( 'button', { name: 'Highlight Desktop' } ) );
	expect( screen.getByTestId( 'history-highlight' ) ).toBeInTheDocument();
	rerender( <HistoryChartCard { ...props } range={ getHistoryWindow( 1 ) } /> );
	expect( screen.queryByTestId( 'history-highlight' ) ).not.toBeInTheDocument();
} );
