import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import useProtectSettings from '../../../data/use-protect-settings';
import IpRule from '../ip-rule';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const Rule = ( { error }: { error?: string } ) => {
	const settings = useProtectSettings();
	return (
		<IpRule
			data={ {
				...settings,
				error: error ?? settings.error,
				settings: { jetpack_waf_ip_block_list: '203.0.113.7', ...settings.settings },
			} }
			name="jetpack_waf_ip_block_list"
			label="Block specific IP addresses"
			description="Stops them."
			editLabel="Edit block list"
			dialogTitle="Blocked IP addresses"
		/>
	);
};

describe( 'IpRule', () => {
	it( 'keeps the edited list in the dialog when the save fails', async () => {
		( apiFetch as unknown as jest.Mock ).mockRejectedValue( { message: 'Nope' } );
		render( <Rule /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Edit block list' } ) );
		const dialog = await screen.findByRole( 'dialog', { name: 'Blocked IP addresses' } );
		const field = within( dialog ).getByRole( 'textbox', { name: 'IP addresses' } );
		await userEvent.clear( field );
		await userEvent.type( field, '198.51.100.1' );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Save' } ) );

		await expect( within( dialog ).findByText( 'Nope' ) ).resolves.toBeInTheDocument();
		expect( field ).toHaveValue( '198.51.100.1' );
	} );

	it( 'leaves another setting’s error out of the dialog', async () => {
		render( <Rule error="Your settings couldn’t be loaded." /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Edit block list' } ) );
		const dialog = await screen.findByRole( 'dialog', { name: 'Blocked IP addresses' } );

		expect( within( dialog ).queryByRole( 'alert' ) ).not.toBeInTheDocument();
	} );

	it( 'names a list of one in the singular', () => {
		render( <Rule /> );

		expect( screen.getByRole( 'checkbox', { name: /1 address on the list/ } ) ).toBeInTheDocument();
	} );
} );
