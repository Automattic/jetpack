import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { toCoupon } from '../../../data/coupons';
import { wpcomFetch } from '../../../data/wpcom-fetch';
import CouponDialog from '../coupon-dialog';
import type { Coupon } from '../../../data/coupons';

jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );
jest.mock( '../../../data/tracking', () => ( { trackPaymentsEvent: jest.fn() } ) );

const CURRENCIES = { defaultCurrency: 'USD', minimumAmounts: { USD: 0.5 } };

const COUPON = toCoupon( {
	id: 7,
	coupon_code: 'SPRING',
	discount_type: 'percentage',
	discount_percentage: 20,
	start_date: '2026-01-01',
} );

const openDialog = ( coupon: Coupon | null ) => {
	const onClose = jest.fn();
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<CouponDialog coupon={ coupon } codes={ [] } currencies={ CURRENCIES } onClose={ onClose } />
		</QueryClientProvider>
	);
	return onClose;
};

const savedRequest = () =>
	( wpcomFetch as jest.Mock ).mock.calls
		.map( ( [ request ] ) => request )
		.find( request => request.method );

describe( 'CouponDialog', () => {
	beforeEach( () =>
		( wpcomFetch as jest.Mock )
			.mockReset()
			.mockImplementation( ( { method } ) => Promise.resolve( method ? {} : { products: [] } ) )
	);

	it( 'adds a coupon once it has a code and a discount', async () => {
		const onClose = openDialog( null );
		const save = screen.getByRole( 'button', { name: 'Save' } );
		expect( save ).toHaveAttribute( 'aria-disabled', 'true' );

		await userEvent.type( screen.getByRole( 'textbox', { name: 'Coupon code' } ), 'SPRING' );
		await userEvent.type( screen.getByRole( 'spinbutton', { name: 'Percentage off' } ), '20' );
		await userEvent.click( save );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( savedRequest() ).toMatchObject( {
			path: 'memberships/coupons',
			method: 'POST',
			data: { coupon_code: 'SPRING', discount_type: 'percentage', discount_percentage: 20 },
		} );
		expect( select( noticesStore ).getNotices() ).toContainEqual(
			expect.objectContaining( { type: 'snackbar', content: 'Coupon “SPRING” added.' } )
		);
	} );

	it( 'updates an edited coupon in place', async () => {
		const onClose = openDialog( COUPON );

		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( savedRequest() ).toMatchObject( { path: 'memberships/coupon/7', method: 'PUT' } );
	} );

	it( 'makes a plan the site no longer has be removed before saving', async () => {
		const onClose = openDialog( { ...COUPON, planIds: [ 9 ] } );
		const save = screen.getByRole( 'button', { name: 'Save' } );

		await expect( screen.findByText( 'Unavailable plan (ID 9)' ) ).resolves.toBeVisible();
		expect( save ).toHaveAttribute( 'aria-disabled', 'true' );

		await userEvent.click( screen.getByRole( 'button', { name: 'Remove' } ) );
		await userEvent.click( save );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( savedRequest() ).toMatchObject( { data: { plan_ids_allow_list: [] } } );
	} );

	it( 'stays open with WordPress.com’s message when the save fails', async () => {
		( wpcomFetch as jest.Mock ).mockImplementation( ( { method } ) =>
			method
				? Promise.reject( new Error( 'Coupon code is already used' ) )
				: Promise.resolve( { products: [] } )
		);
		const onClose = openDialog( COUPON );

		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await expect( screen.findByText( 'Coupon code is already used' ) ).resolves.toBeVisible();
		expect( onClose ).not.toHaveBeenCalled();
	} );
} );
