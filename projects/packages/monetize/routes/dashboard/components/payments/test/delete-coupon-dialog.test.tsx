import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { wpcomFetch } from '../../../data/wpcom-fetch';
import DeleteCouponDialog from '../delete-coupon-dialog';
import type { Coupon } from '../../../data/coupons';

jest.mock( '../../../data/wpcom-fetch', () => ( { wpcomFetch: jest.fn() } ) );
jest.mock( '../../../data/tracking', () => ( { trackPaymentsEvent: jest.fn() } ) );

const renderDialog = ( onClose: () => void ) =>
	render(
		<QueryClientProvider client={ new QueryClient() }>
			<DeleteCouponDialog coupon={ { id: 7, code: 'SPRING' } as Coupon } onClose={ onClose } />
		</QueryClientProvider>
	);

describe( 'DeleteCouponDialog', () => {
	beforeEach( () => ( wpcomFetch as jest.Mock ).mockReset() );

	it( 'deletes the coupon', async () => {
		( wpcomFetch as jest.Mock ).mockResolvedValue( true );
		const onClose = jest.fn();
		renderDialog( onClose );

		await userEvent.click( screen.getByRole( 'button', { name: 'Delete' } ) );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( wpcomFetch ).toHaveBeenCalledWith( {
			api: 'wpcom/v2',
			path: 'memberships/coupon/7',
			method: 'DELETE',
		} );
	} );

	it( 'stays open with WordPress.com’s message when the delete fails', async () => {
		( wpcomFetch as jest.Mock ).mockRejectedValue( new Error( 'Coupon not found.' ) );
		const onClose = jest.fn();
		renderDialog( onClose );

		await userEvent.click( screen.getByRole( 'button', { name: 'Delete' } ) );

		await expect( screen.findAllByText( 'Coupon not found.' ) ).resolves.not.toHaveLength( 0 );
		expect( onClose ).not.toHaveBeenCalled();
	} );
} );
