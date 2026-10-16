import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginProtectionCard from '../login-protection-card';
import type { ProtectSettingsData } from '../../../data/use-protect-settings';
import type { LoginProtectionState } from '../types';

const on = { available: true, active: true };
const off = { available: true, active: false };
const unavailable = { available: false, active: false };

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
			settings={ { settings } as ProtectSettingsData }
			openTab={ openTab }
		/>
	);

describe( 'LoginProtectionCard', () => {
	it.each( [
		[ 'every method is on', {}, null, '3 of 3 on', true ],
		[ 'one method is off', { sso: off }, null, '2 of 3 on', true ],
		[ 'a method is unavailable', { sso: unavailable }, null, '2 of 2 on', true ],
		[ 'brute force protection is off', { bruteForce: off }, null, '2 of 3 on', false ],
		[ 'a method was turned off since page load', {}, { protect: false }, '2 of 3 on', false ],
		[ 'a method was turned on since page load', { sso: off }, { sso: true }, '3 of 3 on', true ],
		[ 'WordPress.com login is set but can’t run', { ssoUsable: false }, null, '2 of 2 on', true ],
		[
			'an unavailable method is still set',
			{ sso: unavailable },
			{ sso: true },
			'2 of 2 on',
			true,
		],
	] )( 'counts the methods that are on when %s', ( _name, state, settings, badge, hasCount ) => {
		renderCard( state, settings );

		expect( screen.getByText( badge ) ).toBeInTheDocument();
		expect( screen.queryByText( '1,234' ) !== null ).toBe( hasCount );
	} );

	it.each( [
		[ 'on', { sso: on }, { On: 1, Off: 2, Unavailable: 0 } ],
		[ 'off', { sso: off }, { On: 0, Off: 3, Unavailable: 0 } ],
		[ 'unavailable', { sso: unavailable }, { On: 0, Off: 2, Unavailable: 1 } ],
		[ 'on but unable to run', { sso: on, ssoUsable: false }, { On: 0, Off: 2, Unavailable: 1 } ],
	] )( 'badges a method that is %s', ( _name, state, badges ) => {
		renderCard( { bruteForce: off, accountProtection: off, ...state } );

		Object.entries( badges ).forEach( ( [ text, count ] ) =>
			expect( screen.queryAllByText( text ) ).toHaveLength( count )
		);
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
			.click( screen.getByRole( 'link', { name: 'Configure login protection' } ) );

		expect( openTab ).toHaveBeenCalledWith( 'settings', { section: 'loginProtection' } );
	} );
} );
