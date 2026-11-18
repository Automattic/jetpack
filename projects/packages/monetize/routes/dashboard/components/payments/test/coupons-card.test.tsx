import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
import { wpcomFetch } from '../../../data/wpcom-fetch';
import CouponsCard from '../coupons-card';
import { getPaymentsState } from '../state';

jest.mock( '../state', () => ( { getPaymentsState: jest.fn() } ) );
jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );

const renderCard = ( couponsEnabled: boolean | null, canManagePlans = true ) => {
	( getPaymentsState as jest.Mock ).mockReturnValue( { canManagePlans } );
	( wpcomFetch as jest.Mock ).mockImplementation( ( { path } ) =>
		Promise.resolve(
			path === 'memberships/status'
				? { is_connected: true, coupons_and_gifts_enabled: couponsEnabled }
				: [
						{
							id: 7,
							coupon_code: 'SPRING',
							discount_type: 'percentage',
							discount_percentage: 20,
							end_date: '2026-12-31',
							can_be_combined: false,
						},
					]
		)
	);
	return render(
		<QueryClientProvider client={ new QueryClient() }>
			<CouponsCard />
		</QueryClientProvider>
	);
};

const requestedPaths = () =>
	( wpcomFetch as jest.Mock ).mock.calls.map( ( [ request ] ) => request.path );

describe( 'CouponsCard', () => {
	beforeEach( () => ( wpcomFetch as jest.Mock ).mockReset() );

	it.each( [ false, null ] )(
		'stays hidden without asking for coupons when they’re %p',
		async couponsEnabled => {
			const { container } = renderCard( couponsEnabled );

			await waitFor( () => expect( requestedPaths() ).toEqual( [ 'memberships/status' ] ) );
			await act( () => new Promise( resolve => setTimeout( resolve, 0 ) ) );
			expect( requestedPaths() ).toEqual( [ 'memberships/status' ] );
			expect( container ).toBeEmptyDOMElement();
		}
	);

	it.each( [
		[ 'a site that can manage plans', true, true ],
		[ 'a site that can’t', false, false ],
	] )(
		'lists coupons, offering Add, Edit and Delete for %s',
		async ( _case, canManagePlans, offered ) => {
			renderCard( true, canManagePlans );

			await expect( screen.findByRole( 'heading', { name: 'SPRING' } ) ).resolves.toBeVisible();
			expect( screen.getByText( '20% off forever' ) ).toBeVisible();
			expect( screen.getByText( 'Cannot be combined with other coupons' ) ).toBeVisible();
			for ( const name of [ 'Add a coupon', 'Edit SPRING', 'Delete SPRING' ] ) {
				expect( Boolean( screen.queryByRole( 'button', { name } ) ) ).toBe( offered );
			}
		}
	);

	it( 'shows the expiry date unshifted in a site timezone behind every browser', async () => {
		const settings = getSettings();
		setSettings( { ...settings, timezone: { ...settings.timezone, offset: -12, string: '' } } );
		try {
			renderCard( true );

			await expect( screen.findByText( 'Expires on December 31, 2026' ) ).resolves.toBeVisible();
		} finally {
			setSettings( settings );
		}
	} );
} );
