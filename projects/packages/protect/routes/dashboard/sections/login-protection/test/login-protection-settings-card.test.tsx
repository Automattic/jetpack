import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginProtectionSettingsCard from '../login-protection-settings-card';
import type { ProtectSettings, ProtectSettingsData } from '../../../data/use-protect-settings';
import type { LoginProtectionState } from '../types';

const SSO = 'Allow users to log in with their WordPress.com account';
const MATCH_BY_EMAIL = 'Match accounts using email addresses';
const TWO_STEP = 'Require accounts to use WordPress.com Two-Step Authentication';
const ALLOW_LIST = 'Always allowed IP addresses';

const available = { available: true, active: true };

const renderCard = ( {
	state = {},
	settings = {},
	save = jest.fn(),
}: {
	state?: Partial< LoginProtectionState >;
	settings?: ProtectSettings;
	save?: jest.Mock;
} = {} ) =>
	render(
		<LoginProtectionSettingsCard
			state={ {
				bruteForce: available,
				accountProtection: available,
				sso: available,
				blockedCount: '0',
				ssoUsable: true,
				ssoLocks: { matchByEmail: false, twoStep: false },
				ssoEffective: { matchByEmail: false, twoStep: false },
				currentIp: '203.0.113.7',
				...state,
			} }
			settings={
				{
					settings: { sso: true, ...settings },
					isSaving: () => false,
					save,
				} as unknown as ProtectSettingsData
			}
			openTab={ jest.fn() }
		/>
	);

describe( 'LoginProtectionSettingsCard', () => {
	it( 'asks before turning WordPress.com login off', async () => {
		const save = jest.fn();
		const user = userEvent.setup();
		renderCard( { save } );

		await user.click( screen.getByLabelText( SSO ) );

		expect( save ).not.toHaveBeenCalled();

		await user.click( screen.getByRole( 'button', { name: 'Turn off' } ) );

		expect( save ).toHaveBeenCalledWith( { sso: false } );
	} );

	it( 'turns WordPress.com login on without asking', async () => {
		const save = jest.fn();
		renderCard( { save, settings: { sso: false } } );

		await userEvent.setup().click( screen.getByLabelText( SSO ) );

		expect( save ).toHaveBeenCalledWith( { sso: true } );
	} );

	it.each( [
		[ 'it is usable', {}, {}, true, true ],
		[ 'it is off', {}, { sso: false }, true, false ],
		[ 'no owner is connected', { ssoUsable: false }, {}, false, true ],
		[ 'the module is unavailable', { sso: { available: false, active: false } }, {}, false, true ],
	] )(
		'enables the right WordPress.com login toggles when %s',
		( _name, state, settings, canToggle, canSetOptions ) => {
			renderCard( { state, settings } );

			const enabled = ( label: string ) =>
				! screen.getByLabelText( label ).hasAttribute( 'disabled' );
			expect( enabled( SSO ) ).toBe( canToggle );
			expect( enabled( MATCH_BY_EMAIL ) ).toBe( canSetOptions );
			expect( enabled( TWO_STEP ) ).toBe( canSetOptions );
		}
	);

	it( 'locks a forced option to the value WordPress.com login applies', () => {
		renderCard( {
			state: {
				ssoLocks: { matchByEmail: false, twoStep: true },
				ssoEffective: { matchByEmail: false, twoStep: true },
			},
			settings: { jetpack_sso_require_two_step: false },
		} );

		expect( screen.getByLabelText( TWO_STEP ) ).toBeDisabled();
		expect( screen.getByLabelText( TWO_STEP ) ).toBeChecked();
		expect(
			screen.getByText( 'Two-Step Authentication is enforced by your site’s configuration.' )
		).toBeInTheDocument();
		expect( screen.getByLabelText( MATCH_BY_EMAIL ) ).toBeEnabled();
	} );

	it.each( [
		[ 'shows', true ],
		[ 'hides', false ],
	] )( '%s the allowed addresses with their toggle', ( _name, enabled ) => {
		renderCard( { settings: { jetpack_waf_ip_allow_list_enabled: enabled } } );

		expect( screen.queryByLabelText( ALLOW_LIST ) !== null ).toBe( enabled );
	} );
} );
