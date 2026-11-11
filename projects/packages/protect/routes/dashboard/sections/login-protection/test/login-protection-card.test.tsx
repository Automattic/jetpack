import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginProtectionCard from '../login-protection-card';
import type { ProtectSettingsData } from '../../../data/use-protect-settings';
import type { LoginProtectionState } from '../types';

const on = { available: true, active: true };
const off = { available: true, active: false };
const unavailable = { available: false, active: false };

const card = (
	state: Partial< LoginProtectionState > = {},
	settings: Partial< ProtectSettingsData > = {},
	openTab = jest.fn()
) => (
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
				settings: null,
				error: null,
				errorKeys: [],
				isSaving: () => false,
				save: jest.fn(),
				...settings,
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
		'shows blocked logins only while login protection is %s',
		( _name, state, settings, isOn ) => {
			render( card( state, { settings } ) );

			expect( screen.queryByText( '1,234' ) !== null ).toBe( isOn );
			expect( screen.queryByRole( 'switch', { name: 'Enable login protection' } ) === null ).toBe(
				isOn
			);
		}
	);

	it( 'shows the page-load state before the settings load', () => {
		render( card( { accountProtection: on, sso: off } ) );

		expect( screen.getByRole( 'switch', { name: 'Enable account protection' } ) ).toBeChecked();
		expect(
			screen.getByRole( 'switch', { name: 'Enable WordPress.com login (SSO)' } )
		).not.toBeChecked();
	} );

	it.each( [
		[ 'Enable login protection', { bruteForce: off }, { protect: true } ],
		[ 'Enable account protection', { accountProtection: off }, { 'account-protection': true } ],
	] )( 'saves “%s” when it is switched on', async ( name, state, patch ) => {
		const save = jest.fn();
		render( card( state, { save } ) );

		await userEvent.setup().click( screen.getByRole( 'switch', { name } ) );

		expect( save ).toHaveBeenCalledWith( patch );
	} );

	it.each( [
		[ 'Enable login protection', { bruteForce: unavailable }, 'Login protection' ],
		[ 'Enable account protection', { accountProtection: unavailable }, 'Account protection' ],
	] )( 'says why “%s” is disabled when unavailable', ( name, state, feature ) => {
		render( card( state ) );

		expect( screen.getByRole( 'switch', { name } ) ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( screen.getByText( `${ feature } isn’t available on this site.` ) ).toBeInTheDocument();
	} );

	it( 'keeps keyboard focus in the row when login protection turns on', async () => {
		const { rerender } = render( card( { bruteForce: off } ) );
		await userEvent
			.setup()
			.click( screen.getByRole( 'switch', { name: 'Enable login protection' } ) );

		rerender( card( { bruteForce: off }, { settings: { protect: true } } ) );

		expect( screen.getByRole( 'link', { name: 'Configure login protection' } ) ).toHaveFocus();
	} );

	it.each( [
		[ 'one of its settings', [ 'sso' ], true ],
		[ 'another card’s setting', [ 'waf' ], false ],
		[ 'loading the settings', [], false ],
	] )( 'shows a failure from %s only when it is the card’s own', ( _name, errorKeys, isShown ) => {
		render( card( {}, { error: 'Nope', errorKeys } ) );

		expect( screen.queryByText( 'Nope' ) !== null ).toBe( isShown );
	} );

	it.each( [
		[ 'on', {}, true ],
		[ 'off', { sso: off }, false ],
		[ 'on but unable to run', { ssoUsable: false }, false ],
	] )( 'links to WordPress.com login settings only while it is %s', ( _name, state, hasLink ) => {
		render( card( state ) );

		expect(
			screen.queryByRole( 'link', { name: 'Configure WordPress.com login (SSO)' } ) !== null
		).toBe( hasLink );
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
		render( card( {}, {}, openTab ) );

		await userEvent
			.setup()
			.click( screen.getByRole( 'link', { name: 'Configure login protection' } ) );

		expect( openTab ).toHaveBeenCalledWith( 'settings', { section: 'loginProtection' } );
	} );
} );
