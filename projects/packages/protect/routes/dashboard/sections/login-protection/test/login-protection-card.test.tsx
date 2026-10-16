import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginProtectionCard from '../login-protection-card';
import type { ProtectSettingsData } from '../../../data/use-protect-settings';
import type { LoginProtectionState } from '../types';

const on = { available: true, active: true };
const off = { available: true, active: false };

const renderCard = (
	state: Partial< LoginProtectionState > = {},
	settings: ProtectSettingsData[ 'settings' ] = null,
	openTab = jest.fn()
) =>
	render(
		<LoginProtectionCard
			state={
				{
					bruteForce: on,
					accountProtection: on,
					sso: on,
					blockedCount: '1,234',
					ssoUsable: true,
					...state,
				} as LoginProtectionState
			}
			settings={
				{
					settings,
					error: null,
					isSaving: () => false,
					save: jest.fn(),
				} as unknown as ProtectSettingsData
			}
			openTab={ openTab }
		/>
	);

describe( 'LoginProtectionCard', () => {
	it.each( [
		[ 'on', {}, null, true ],
		[ 'off', { bruteForce: off }, null, false ],
		[ 'turned off since page load', {}, { protect: false }, false ],
		[ 'turned on since page load', { bruteForce: off }, { protect: true }, true ],
	] )(
		'shows blocked logins only while brute force protection is %s',
		( _name, state, settings, isOn ) => {
			renderCard( state, settings );

			expect( screen.queryByText( '1,234' ) !== null ).toBe( isOn );
			expect(
				screen.queryByRole( 'checkbox', { name: 'Enable Brute Force Protection' } ) === null
			).toBe( isOn );
		}
	);

	it( 'shows the page-load state before the settings load', () => {
		renderCard( { accountProtection: on, sso: off } );

		expect( screen.getByRole( 'checkbox', { name: 'Enable Account protection' } ) ).toBeChecked();
		expect( screen.getByRole( 'checkbox', { name: 'Enable Secure Sign On' } ) ).not.toBeChecked();
	} );

	it.each( [
		[ 'on', {}, true ],
		[ 'off', { sso: off }, false ],
		[ 'on but unable to run', { ssoUsable: false }, false ],
	] )( 'links to WordPress.com login settings only while it is %s', ( _name, state, hasLink ) => {
		renderCard( state );

		expect( screen.queryByRole( 'link', { name: 'Configure' } ) !== null ).toBe( hasLink );
	} );

	it( 'renders nothing when PHP registered no section', () => {
		const { container } = render(
			<LoginProtectionCard
				state={ undefined }
				settings={ { settings: null } as ProtectSettingsData }
				openTab={ jest.fn() }
			/>
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'opens the Settings tab from its link', async () => {
		const openTab = jest.fn();
		renderCard( {}, null, openTab );

		await userEvent
			.setup()
			.click( screen.getByRole( 'link', { name: 'Configure Brute Force Protection' } ) );

		expect( openTab ).toHaveBeenCalledWith( 'settings', undefined );
	} );
} );
