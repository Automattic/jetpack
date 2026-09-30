import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { applyFilters } from '@wordpress/hooks';
import '../admin';

jest.mock( '@wordpress/api-fetch' );

const MailchimpSettings = applyFilters(
	'jetpack.externalConnections.extraSettings',
	null,
	'mailchimp'
);

describe( 'Mailchimp audience setting', () => {
	test( 'locks the dropdown while saving and restores the saved audience on failure', async () => {
		let rejectSave;
		apiFetch.mockImplementation( ( { method } ) =>
			method === 'GET'
				? Promise.resolve( {
						follower_list_id: 'a',
						audiences: [
							{ id: 'a', name: 'Audience A' },
							{ id: 'b', name: 'Audience B' },
						],
					} )
				: new Promise( ( resolve, reject ) => ( rejectSave = reject ) )
		);
		const user = userEvent.setup();
		render(
			<form>
				<MailchimpSettings isConnected />
			</form>
		);
		const select = await screen.findByRole( 'combobox' );
		await expect(
			screen.findByRole( 'option', { name: 'Audience A' } )
		).resolves.toBeInTheDocument();

		// "None" is left for Save Changes, so the restore must not fall back to it.
		await user.selectOptions( select, 'none' );
		await user.selectOptions( select, 'b' );

		expect( select ).toBeDisabled();
		expect( new FormData( select.form ).get( 'jetpack-mailchimp-audience' ) ).toBe( 'b' );

		await act( async () => rejectSave( { message: 'Rejected by Mailchimp.' } ) );

		expect( select ).toHaveValue( 'a' );
		expect( select ).toBeEnabled();
		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Rejected by Mailchimp.' );
	} );
} );
