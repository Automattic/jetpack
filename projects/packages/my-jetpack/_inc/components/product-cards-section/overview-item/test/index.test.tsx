import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OverviewItem from '..';

jest.mock( '../../../../hooks/use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
let mockStatus = 'active';

jest.mock( '../../../../data/products/use-product', () => () => ( {
	detail: { name: 'Stats', status: mockStatus },
} ) );
jest.mock( '../../../../data/products/use-products-by-ownership', () => () => ( {
	data: { ownedProducts: [ 'stats' ] },
} ) );

describe( 'OverviewItem', () => {
	beforeEach( () => {
		mockStatus = 'active';
	} );

	it.each( [
		[ 'loading', { isLoading: true }, 'Loading…' ],
		[
			'failed',
			{ error: { reason: 'Failed to load stats', onRetry: jest.fn() } },
			'Failed to load stats',
		],
	] )( 'hides the value while %s', ( _, props, shown ) => {
		render( <OverviewItem slug="stats" admin label="Views" value="0" { ...props } /> );

		expect( screen.queryByText( '0' ) ).not.toBeInTheDocument();
		expect( screen.getByText( shown ) ).toBeInTheDocument();
	} );

	it( 'replaces the link with "Try again" when the load fails', async () => {
		const onRetry = jest.fn();
		render(
			<OverviewItem
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

	it.each( [
		[ 'boost', 'expired', 'Expired plan', 1 ],
		[ 'boost', 'inactive', 'Inactive', 1 ],
		[ 'boost', 'active', 'Active', 0 ],
		[ 'protect', 'needs_attention_warning', 'Needs attention', 0 ],
	] )( 'shows a %s value with its %s status as %s %d times', ( slug, status, badge, count ) => {
		mockStatus = status;
		render( <OverviewItem slug={ slug as 'boost' } admin label="Score" value="B" /> );

		expect( screen.getByText( 'B' ) ).toBeInTheDocument();
		expect( screen.queryAllByText( badge ) ).toHaveLength( count );
	} );

	it( 'shows why the host keeps the product off instead of its action', () => {
		mockStatus = 'module_disabled';
		render(
			<OverviewItem
				slug="stats"
				admin
				label="Views"
				action={ { label: 'Activate Stats', href: '#' } }
				forcedOffReason="Disabled by your host"
			/>
		);

		expect( screen.getByText( 'Disabled by your host' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Activate Stats' ) ).not.toBeInTheDocument();
	} );

	it( 'ignores clicks on a busy action', async () => {
		const onClick = jest.fn();
		render(
			<OverviewItem
				slug="stats"
				admin
				label="Views"
				action={ { label: 'Activate Stats', onClick, disabled: true } }
			/>
		);

		const button = screen.getByRole( 'button', { name: 'Activate Stats' } );
		expect( button ).toHaveAttribute( 'aria-disabled', 'true' );
		await userEvent.click( button );
		expect( onClick ).not.toHaveBeenCalled();
	} );
} );
