import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/ui';
import useProtectSettings from '../../../data/use-protect-settings';
import { IpListDialog } from '../ip-list-dialog';
import type { ProtectSettingsData } from '../../../data/use-protect-settings';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const Rule = ( { error }: { error?: string } ) => {
	const settings = useProtectSettings();
	return (
		<IpListDialog
			data={ {
				...settings,
				error: error ?? settings.error,
				settings: { jetpack_waf_ip_block_list: '203.0.113.7', ...settings.settings },
			} }
			name="jetpack_waf_ip_block_list"
			dialogTitle="Blocked IP addresses"
			trigger={ <Button /> }
		>
			Edit block list
		</IpListDialog>
	);
};

const OFF_NOTE = 'This list is turned off, so it has no effect until you turn it on in Settings.';

describe( 'IpListDialog', () => {
	const LIST = 'jetpack_waf_ip_block_list';
	const ON = 'jetpack_waf_ip_block_list_enabled';

	it.each( [
		[ 'an edit link', false, '203.0.113.7', false, null, true, null ],
		[
			'an edit link',
			false,
			'203.0.113.7',
			false,
			'198.51.100.1',
			true,
			{ [ LIST ]: '198.51.100.1' },
		],
		[
			'a turn-on call to action',
			false,
			'203.0.113.7',
			true,
			null,
			false,
			{ [ LIST ]: '203.0.113.7', [ ON ]: true },
		],
		[ 'a turn-on call to action', false, '', true, null, false, null ],
		[ 'a turn-on call to action', true, '203.0.113.7', true, null, false, null ],
	] )(
		'opened from %s, with the list on: %s and holding "%s", saves only what changed',
		async ( _, enabled, list, enableOnSave, typed, showsNote, saved ) => {
			const save = jest.fn().mockResolvedValue( true );
			render(
				<IpListDialog
					data={
						{
							settings: { [ LIST ]: list, [ ON ]: enabled },
							error: null,
							isSaving: () => false,
							save,
						} as unknown as ProtectSettingsData
					}
					name={ LIST }
					dialogTitle="Blocked IP addresses"
					trigger={ <Button /> }
					enableOnSave={ enableOnSave }
				>
					Edit block list
				</IpListDialog>
			);

			await userEvent.click( screen.getByRole( 'button', { name: 'Edit block list' } ) );
			const dialog = await screen.findByRole( 'dialog', { name: 'Blocked IP addresses' } );
			expect( !! within( dialog ).queryByText( OFF_NOTE ) ).toBe( showsNote );
			if ( typed ) {
				const field = within( dialog ).getByRole( 'textbox', { name: 'IP addresses' } );
				await userEvent.clear( field );
				await userEvent.type( field, typed );
			}
			// A disabled Save ignores the click.
			await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Save' } ) );

			expect( save.mock.calls ).toEqual( saved ? [ [ saved ] ] : [] );
		}
	);

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
} );
