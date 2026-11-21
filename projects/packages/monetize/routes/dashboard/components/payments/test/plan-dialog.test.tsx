import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toMembershipProduct } from '../../../data/memberships';
import { wpcomFetch } from '../../../data/wpcom-fetch';
import PlanDialog from '../plan-dialog';
import type { Plan } from '../plans';

jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );
jest.mock( '../../../data/tracking', () => ( { trackPaymentsEvent: jest.fn() } ) );

const CURRENCIES = { defaultCurrency: 'USD', minimumAmounts: { USD: 0.5 } };

const product = ( fields: Record< string, unknown > ) =>
	toMembershipProduct( { title: 'Gold', price: 5, currency: 'USD', ...fields } );

const TIER: Plan = {
	product: product( { id: 1, type: 'tier', interval: '1 month' } ),
	annual: product( { id: 2, type: 'tier', interval: '1 year', price: 50, tier: 1 } ),
};

const openDialog = ( plan: Plan | null ) => {
	const onClose = jest.fn();
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<PlanDialog plan={ plan } currencies={ CURRENCIES } onClose={ onClose } />
		</QueryClientProvider>
	);
	return onClose;
};

describe( 'PlanDialog', () => {
	it.each( [
		[ 'a new plan, with no annual product', null, [ 'memberships/product' ] ],
		[
			'an edited tier, into its own two products',
			TIER,
			[ 'memberships/product/1', 'memberships/product/2' ],
		],
	] )( 'saves %s', async ( _name, plan, paths ) => {
		( wpcomFetch as jest.Mock ).mockReset().mockResolvedValue( { id: 1 } );
		const onClose = openDialog( plan );

		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( ( wpcomFetch as jest.Mock ).mock.calls.map( ( [ request ] ) => request.path ) ).toEqual(
			paths
		);
	} );

	it( 'saves once when Save is clicked twice', async () => {
		( wpcomFetch as jest.Mock ).mockReset().mockReturnValue( new Promise( () => {} ) );
		openDialog( null );
		const save = screen.getByRole( 'button', { name: 'Save' } );

		await userEvent.click( save );
		await userEvent.click( save );

		expect( wpcomFetch ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [
		[ 'a tier', TIER ],
		[ 'a tier with no annual product', { product: TIER.product } ],
	] )( 'opens an edit of %s without the price notice', ( _name, plan ) => {
		openDialog( plan );

		expect( screen.queryByText( /existing subscribers/ ) ).not.toBeInTheDocument();
	} );

	it( 'leaves a cleared price blank and asks for the minimum', async () => {
		openDialog( null );
		const amount = screen.getByRole( 'spinbutton', { name: 'Amount' } );

		await userEvent.clear( amount );

		expect( amount ).toHaveValue( null );
		expect( screen.getByText( 'Enter a price of at least $0.50.' ) ).toBeVisible();
	} );
} );
