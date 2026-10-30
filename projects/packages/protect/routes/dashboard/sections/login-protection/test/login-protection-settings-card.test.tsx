import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginProtectionSettingsCard from '../login-protection-settings-card';
import type { ProtectSettings, ProtectSettingsData } from '../../../data/use-protect-settings';
import type { LoginProtectionState } from '../types';

const SSO = 'Allow users to log in with their WordPress.com account';
const MATCH_BY_EMAIL = 'Match accounts using email addresses';
const TWO_STEP = 'Require accounts to use WordPress.com Two-Step Authentication';
const ALLOW_LIST = 'Always allowed IP addresses';
const BRUTE_FORCE = 'Block repeated failed login attempts';
const ACCOUNT_PROTECTION = 'Protect accounts with weak or leaked passwords';

const available = { available: true, active: true };

type CardOptions = {
	state?: Partial< LoginProtectionState >;
	settings?: ProtectSettings;
	save?: jest.Mock;
};

const card = ( { state = {}, settings = {}, save = jest.fn() }: CardOptions = {} ) => (
	<LoginProtectionSettingsCard
		state={ {
			bruteForce: available,
			accountProtection: available,
			sso: available,
			blockedCount: '0',
			ssoUsable: true,
			isOffline: false,
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

const renderCard = ( options: CardOptions = {} ) => render( card( options ) );

describe( 'LoginProtectionSettingsCard', () => {
	it( 'asks before turning WordPress.com login off', async () => {
		const save = jest.fn();
		const user = userEvent.setup();
		renderCard( { save } );

		await user.click( screen.getByRole( 'switch', { name: SSO } ) );

		expect( save ).not.toHaveBeenCalled();

		await user.click( screen.getByRole( 'button', { name: 'Turn off' } ) );

		expect( save ).toHaveBeenCalledWith( { sso: false } );
	} );

	it( 'turns WordPress.com login on without asking', async () => {
		const save = jest.fn();
		renderCard( { save, settings: { sso: false } } );

		await userEvent.setup().click( screen.getByRole( 'switch', { name: SSO } ) );

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
				screen.getByRole( 'switch', { name: label } ).getAttribute( 'aria-disabled' ) !== 'true';
			expect( enabled( SSO ) ).toBe( canToggle );
			expect( enabled( MATCH_BY_EMAIL ) ).toBe( canSetOptions );
			expect( enabled( TWO_STEP ) ).toBe( canSetOptions );
		}
	);

	it.each( [
		[
			'no owner is connected',
			{ ssoUsable: false },
			'Needs the site owner’s WordPress.com account to be connected.',
		],
		[
			'the site is in offline mode',
			{ ssoUsable: false, isOffline: true },
			'WordPress.com login isn’t available in Offline Mode.',
		],
		[
			'the module is unavailable',
			{ sso: { available: false, active: false } },
			'WordPress.com login isn’t available on this site.',
		],
	] )( 'says why WordPress.com login can’t be changed when %s', ( _name, state, reason ) => {
		renderCard( { state } );

		expect( screen.getByText( reason ) ).toBeInTheDocument();
	} );

	it.each( [
		[ BRUTE_FORCE, 'bruteForce' ],
		[ ACCOUNT_PROTECTION, 'accountProtection' ],
	] )( 'locks "%s" when its module is unavailable', ( label, key ) => {
		renderCard( { state: { [ key ]: { available: false, active: false } } } );

		expect( screen.getByRole( 'switch', { name: label } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'says why account protection can’t be changed when it is unavailable', () => {
		renderCard( { state: { accountProtection: { available: false, active: false } } } );

		expect(
			screen.getByText( 'Account protection isn’t available on this site.' )
		).toBeInTheDocument();
	} );

	it( 'locks a forced option to the value WordPress.com login applies', () => {
		renderCard( {
			state: {
				ssoLocks: { matchByEmail: false, twoStep: true },
				ssoEffective: { matchByEmail: false, twoStep: true },
			},
			settings: { jetpack_sso_require_two_step: false },
		} );

		expect( screen.getByRole( 'switch', { name: TWO_STEP } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'switch', { name: TWO_STEP } ) ).toBeChecked();
		expect(
			screen.getByText( 'Two-Step Authentication is enforced by your site’s configuration.' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'switch', { name: MATCH_BY_EMAIL } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it.each( [
		[ 'shows', true ],
		[ 'hides', false ],
	] )( '%s the allowed addresses with their toggle', ( _name, enabled ) => {
		renderCard( { settings: { jetpack_waf_ip_allow_list_enabled: enabled } } );

		// Hidden rather than unmounted, so only an accessible query tells the two apart.
		expect( screen.queryByRole( 'textbox', { name: ALLOW_LIST } ) !== null ).toBe( enabled );
	} );

	it( 'keeps unsaved addresses when the allow list toggle goes off and back on', async () => {
		const { rerender } = renderCard( { settings: { jetpack_waf_ip_allow_list_enabled: true } } );
		await userEvent.setup().type( screen.getByLabelText( ALLOW_LIST ), '203.0.113.9' );

		rerender( card( { settings: { jetpack_waf_ip_allow_list_enabled: false } } ) );
		rerender( card( { settings: { jetpack_waf_ip_allow_list_enabled: true } } ) );

		expect( screen.getByLabelText( ALLOW_LIST ) ).toHaveValue( '203.0.113.9' );
	} );
} );
