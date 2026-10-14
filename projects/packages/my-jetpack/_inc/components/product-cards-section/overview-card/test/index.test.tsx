import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OverviewCard from '..';

jest.mock( '../../../connected-product-card', () => ( { children } ) => <div>{ children }</div> );
jest.mock( '../../../action-button', () => () => <button>Product action</button> );
jest.mock( '../../../../hooks/use-connect-site', () => () => ( { connectSite: jest.fn() } ) );
jest.mock( '../../../../data/products/use-product', () => () => ( {
	detail: { name: 'Stats', status: 'active' },
} ) );
jest.mock( '../../../../data/products/use-products-by-ownership', () => () => ( {
	data: { ownedProducts: [ 'stats' ] },
} ) );

describe( 'OverviewCard', () => {
	it.each( [
		[ 'loading', { isLoading: true }, 'Loading…' ],
		[ 'failed', { error: { reason: 'Could not load.', onRetry: jest.fn() } }, 'Unavailable' ],
	] )( 'hides the value while %s', ( _, props, shown ) => {
		render( <OverviewCard slug="stats" admin label="Views" value="0" { ...props } /> );

		expect( screen.queryByText( '0' ) ).not.toBeInTheDocument();
		expect( screen.getByText( shown ) ).toBeInTheDocument();
	} );

	it( 'replaces the action with "Try again" when the load fails', async () => {
		const onRetry = jest.fn();
		render(
			<OverviewCard
				slug="stats"
				admin
				label="Views"
				action={ { label: 'View detailed stats', href: '#' } }
				error={ { reason: 'Could not load.', onRetry } }
			/>
		);

		expect( screen.getByText( 'Could not load.' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'View detailed stats' ) ).not.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
		expect( onRetry ).toHaveBeenCalled();
	} );
} );
