/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { SemiCircle, type SemiCircleSegmentInput } from '../semi-circle';
import type { ReactNode } from 'react';

const SEGMENTS: SemiCircleSegmentInput[] = [
	{ label: 'Mobile', value: 3820, previousValue: 3000 },
	{ label: 'Desktop', value: 1210, previousValue: 1400 },
];

const READY = { isLoading: false, isError: false };

const Providers = ( { children }: { children: ReactNode } ) => (
	<GlobalChartsProvider>{ children }</GlobalChartsProvider>
);

const renderSemiCircle = ( ui: ReactNode ) => render( ui, { wrapper: Providers } );

describe( 'SemiCircle', () => {
	it( 'renders the total under the arc and a legend row per segment', () => {
		renderSemiCircle( <SemiCircle segments={ SEGMENTS } status={ READY } /> );

		expect( screen.getByText( '5K' ) ).toBeInTheDocument();
		// By title: the chart also writes each label into its hidden text-measurement node.
		expect( screen.getByTitle( 'Mobile' ) ).toBeInTheDocument();
		expect( screen.getByText( '3.8K' ) ).toBeInTheDocument();
		expect( screen.getByTitle( 'Desktop' ) ).toBeInTheDocument();
		expect( screen.getByText( '1.2K' ) ).toBeInTheDocument();
	} );

	it( 'draws no total for shares', () => {
		renderSemiCircle(
			<SemiCircle
				segments={ [
					{ label: 'Mobile', value: 0.76 },
					{ label: 'Desktop', value: 0.24 },
				] }
				status={ READY }
				format={ { type: 'percentage', options: { decimals: 1 } } }
				withTotal={ false }
			/>
		);

		expect( screen.getByTitle( 'Mobile' ) ).toBeInTheDocument();
		expect( screen.getByText( /76/ ) ).toBeInTheDocument();
		expect( screen.queryByText( /100/ ) ).not.toBeInTheDocument();
	} );

	it( 'shows the deltas only while the comparison period is on', () => {
		const { rerender } = renderSemiCircle( <SemiCircle segments={ SEGMENTS } status={ READY } /> );

		expect( screen.queryByText( /27%/ ) ).not.toBeInTheDocument();

		rerender( <SemiCircle segments={ SEGMENTS } status={ { ...READY, hasComparison: true } } /> );

		expect( screen.getByText( /27%/ ) ).toBeInTheDocument();
	} );

	it( 'renders the loading shape while nothing answers the params', () => {
		renderSemiCircle( <SemiCircle segments={ [] } status={ { isLoading: true } } /> );

		expect( screen.getByTestId( 'skeleton-ring' ) ).toBeInTheDocument();
	} );

	it( 'renders the empty state when the segments add up to nothing', () => {
		renderSemiCircle(
			<SemiCircle
				segments={ [ { label: 'Mobile', value: 0 } ] }
				status={ READY }
				empty={ { description: 'No session data in this period.' } }
			/>
		);

		expect( screen.getByText( 'No session data in this period.' ) ).toBeInTheDocument();
	} );

	it( 'offers a Retry bound to refetch when the widget passes no error of its own', async () => {
		const refetch = jest.fn();
		renderSemiCircle(
			<SemiCircle segments={ [] } status={ { isLoading: false, isError: true, refetch } } />
		);

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( "We couldn't load this data." );
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
