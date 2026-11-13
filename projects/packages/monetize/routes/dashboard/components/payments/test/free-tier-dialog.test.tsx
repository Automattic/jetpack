import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import FreeTierDialog from '../free-tier-dialog';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@automattic/jetpack-script-data', () => ( { isSimpleSite: () => false } ) );
jest.mock( '../../../data/tracking', () => ( { trackPaymentsEvent: jest.fn() } ) );

describe( 'FreeTierDialog', () => {
	it( 'saves the description and visibility into the site’s subscription options', async () => {
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( {} );
		const onClose = jest.fn();
		render(
			<QueryClientProvider client={ new QueryClient() }>
				<FreeTierDialog freeTier={ { description: 'Old', hidden: false } } onClose={ onClose } />
			</QueryClientProvider>
		);

		const description = screen.getByRole( 'textbox', { name: 'Description' } );
		await userEvent.clear( description );
		await userEvent.type( description, ' New ' );
		await userEvent.click(
			screen.getByRole( 'checkbox', { name: 'Hide the free tier from subscribers' } )
		);
		await userEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( onClose ).toHaveBeenCalled() );
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/settings',
			method: 'POST',
			data: { subscription_options: { free_tier_description: 'New', hide_free_tier: 1 } },
		} );
	} );
} );
