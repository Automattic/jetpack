import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OverviewCard from '..';

jest.mock( '../../../connected-product-card', () => ( { children } ) => <div>{ children }</div> );
jest.mock( '../../../../data/products/use-product', () => () => ( {
	detail: { name: 'Stats', status: 'active' },
} ) );
jest.mock( '../../../../data/products/use-products-by-ownership', () => () => ( {
	data: { ownedProducts: [ 'stats' ] },
} ) );

describe( 'OverviewCard', () => {
	it.each( [
		[ 'loading', { isLoading: true }, 'Loading…' ],
		[
			'failed',
			{ error: { reason: 'Failed to load stats', onRetry: jest.fn() } },
			'Failed to load stats',
		],
	] )( 'hides the value while %s', ( _, props, shown ) => {
		render( <OverviewCard slug="stats" admin label="Views" value="0" { ...props } /> );

		expect( screen.queryByText( '0' ) ).not.toBeInTheDocument();
		expect( screen.getByText( shown ) ).toBeInTheDocument();
	} );

	it( 'replaces the link with "Try again" when the load fails', async () => {
		const onRetry = jest.fn();
		render(
			<OverviewCard
				slug="stats"
				admin
				label="Views"
				action={ { label: 'More stats', href: '#' } }
				error={ { reason: 'Failed to load stats', onRetry } }
			/>
		);

		expect( screen.queryByText( 'More stats' ) ).not.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
		expect( onRetry ).toHaveBeenCalled();
	} );
} );
