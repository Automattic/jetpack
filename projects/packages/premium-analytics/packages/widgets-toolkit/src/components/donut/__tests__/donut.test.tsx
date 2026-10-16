/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { Donut } from '../donut';
import type { DonutSegmentInput } from '../build-donut-chart-data';
import type { ReactNode } from 'react';

const SEGMENTS: DonutSegmentInput[] = [
	{ label: 'Returning', value: 3820, previousValue: 3000 },
	{ label: 'New', value: 1210, previousValue: 1400 },
];

const READY = { isLoading: false, isError: false };

const Providers = ( { children }: { children: ReactNode } ) => (
	<GlobalChartsProvider>{ children }</GlobalChartsProvider>
);

const renderDonut = ( ui: ReactNode ) => render( ui, { wrapper: Providers } );

describe( 'Donut', () => {
	it.each( [ 'ring', 'half-ring' ] as const )(
		'renders the total and a legend row per segment as a %s',
		variant => {
			renderDonut( <Donut segments={ SEGMENTS } status={ READY } variant={ variant } /> );

			expect( screen.getByText( '5K' ) ).toBeInTheDocument();
			// By title: the chart also writes each label into its hidden text-measurement node.
			expect( screen.getByTitle( 'Returning' ) ).toBeInTheDocument();
			expect( screen.getByText( '3.8K' ) ).toBeInTheDocument();
			expect( screen.getByTitle( 'New' ) ).toBeInTheDocument();
			expect( screen.getByText( '1.2K' ) ).toBeInTheDocument();
		}
	);

	it( 'draws the stated total over the sum of the segments', () => {
		renderDonut(
			<Donut
				segments={ SEGMENTS }
				status={ { ...READY, hasComparison: true } }
				total={ 4900 }
				previousTotal={ 2450 }
			/>
		);

		expect( screen.getByText( '4.9K' ) ).toBeInTheDocument();
		expect( screen.queryByText( '5K' ) ).not.toBeInTheDocument();
		expect( screen.getByText( /\+100%/ ) ).toBeInTheDocument();
	} );

	it( 'draws no total for shares', () => {
		renderDonut(
			<Donut
				segments={ [
					{ label: 'Mobile', value: 0.76 },
					{ label: 'Desktop', value: 0.24 },
				] }
				status={ READY }
				format={ { type: 'percentage', options: { decimals: 1 } } }
				variant="half-ring"
				withTotal={ false }
			/>
		);

		expect( screen.getByTitle( 'Mobile' ) ).toBeInTheDocument();
		expect( screen.getByText( /76/ ) ).toBeInTheDocument();
		expect( screen.queryByText( /100/ ) ).not.toBeInTheDocument();
	} );

	it( 'shows the deltas only while the comparison period is on', () => {
		const { rerender } = renderDonut( <Donut segments={ SEGMENTS } status={ READY } /> );

		expect( screen.queryByText( /27%/ ) ).not.toBeInTheDocument();

		rerender( <Donut segments={ SEGMENTS } status={ { ...READY, hasComparison: true } } /> );

		expect( screen.getByText( /27%/ ) ).toBeInTheDocument();
	} );

	it.each( [ 'ring', 'half-ring' ] as const )(
		'names the chart from chartTitle as a %s',
		variant => {
			renderDonut(
				<Donut
					segments={ SEGMENTS }
					status={ READY }
					variant={ variant }
					chartTitle="Payment status"
				/>
			);

			// jsdom measures no size, so the chart stays `visibility: hidden` and has no computed name.
			expect( screen.getByRole( 'application', { hidden: true } ) ).toHaveAttribute(
				'aria-label',
				'Chart: Payment status'
			);
		}
	);

	it( 'renders the loading shape while nothing answers the params', () => {
		renderDonut( <Donut segments={ [] } status={ { isLoading: true } } /> );

		expect( screen.getByTestId( 'skeleton-ring' ) ).toBeInTheDocument();
	} );

	it( 'renders the empty state when the segments add up to nothing', () => {
		renderDonut(
			<Donut
				segments={ [ { label: 'Paid', value: 0 } ] }
				status={ READY }
				empty={ { description: 'No order revenue in this period.' } }
			/>
		);

		expect( screen.getByText( 'No order revenue in this period.' ) ).toBeInTheDocument();
	} );

	it( 'offers a Retry bound to refetch when the widget passes no error of its own', async () => {
		const refetch = jest.fn();
		renderDonut(
			<Donut segments={ [] } status={ { isLoading: false, isError: true, refetch } } />
		);

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( "We couldn't load this data." );
		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );
		expect( refetch ).toHaveBeenCalledTimes( 1 );
	} );
} );
