/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { Funnel } from '../funnel';
import type { FunnelStepInput } from '../build-funnel-chart-data';
import type { ReactNode } from 'react';

const STEPS: FunnelStepInput[] = [
	{ id: 'sessions', label: 'Sessions', value: 1250, previousValue: 1100 },
	{ id: 'cart', label: 'Cart', value: 310, previousValue: 260 },
	{ id: 'checkout', label: 'Checkout', value: 140, previousValue: 120 },
	{ id: 'purchase', label: 'Purchase', value: 60, previousValue: 45 },
];

const READY = { isLoading: false, isError: false };

const Providers = ( { children }: { children: ReactNode } ) => (
	<GlobalChartsProvider>{ children }</GlobalChartsProvider>
);

const renderFunnel = ( ui: ReactNode ) => render( ui, { wrapper: Providers } );

describe( 'Funnel', () => {
	it( 'renders the rate of the whole and a share per step', () => {
		renderFunnel( <Funnel steps={ STEPS } status={ READY } /> );

		// The rate of the whole and the last step's share read the same.
		expect( screen.getAllByText( '4.8%' ) ).toHaveLength( 2 );
		expect( screen.getByText( 'Cart' ) ).toBeInTheDocument();
		expect( screen.getByText( '24.8%' ) ).toBeInTheDocument();
		expect( screen.getByText( '11.2%' ) ).toBeInTheDocument();
	} );

	it( 'shows the delta only while the comparison period is on', () => {
		const { rerender } = renderFunnel( <Funnel steps={ STEPS } status={ READY } /> );

		expect( screen.queryByText( /17%/ ) ).not.toBeInTheDocument();

		rerender( <Funnel steps={ STEPS } status={ { ...READY, hasComparison: true } } /> );

		expect( screen.getByText( /17%/ ) ).toBeInTheDocument();
	} );

	it( 'names the chart from chartTitle', () => {
		renderFunnel( <Funnel steps={ STEPS } status={ READY } chartTitle="Conversion rate" /> );

		expect( screen.getByRole( 'group', { name: 'Chart: Conversion rate' } ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'Sessions', /^Sessions1,250$/ ],
		[ 'Cart', /^Cart310Conversion rate24\.8%$/ ],
	] )( 'shows the %s step count and conversion rate in its tooltip', async ( label, text ) => {
		renderFunnel( <Funnel steps={ STEPS } status={ READY } /> );

		await userEvent.click( screen.getByRole( 'option', { name: new RegExp( `^${ label }, ` ) } ) );

		expect( screen.getByTestId( 'funnel-tooltip' ) ).toHaveTextContent( text );
	} );

	it( 'renders the empty state when the first step is empty', () => {
		renderFunnel(
			<Funnel
				steps={ STEPS.map( step => ( { ...step, value: 0 } ) ) }
				status={ READY }
				empty={ { description: 'No conversion data in this period.' } }
			/>
		);

		expect( screen.getByText( 'No conversion data in this period.' ) ).toBeInTheDocument();
	} );

	it( 'offers a Retry bound to refetch when the widget passes no error of its own', async () => {
		const refetch = jest.fn();
		renderFunnel( <Funnel steps={ [] } status={ { isLoading: false, isError: true, refetch } } /> );

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( "We couldn't load this data." );
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
