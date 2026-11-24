import { render, screen } from '@testing-library/react';
import IDCModal from '../index';

let mockIdentityCrisis = null;
let mockOldScript = false;

jest.mock( '@automattic/jetpack-connection', () => ( {
	CONNECTION_FROM: { myJetpackSafeMode: 'my_jetpack_safe_mode' },
	CONNECTION_STORE_ID: 'jetpack-connection',
	get IdentityCrisis() {
		return mockOldScript ? undefined : () => <p>New Safe Mode screen</p>;
	},
} ) );
jest.mock( '@wordpress/data', () => ( {
	...jest.requireActual( '@wordpress/data' ),
	useSelect: mapSelect => mapSelect( () => ( { getIdentityCrisis: () => mockIdentityCrisis } ) ),
} ) );

beforeEach( () => {
	mockOldScript = false;
	window.JP_IDENTITY_CRISIS__INITIAL_STATE = {
		containerID: 'my-jetpack-identity-crisis-container',
		isSafeModeConfirmed: false,
	};
} );

afterEach( () => {
	delete window.JP_IDENTITY_CRISIS__INITIAL_STATE;
} );

describe( 'IDCModal', () => {
	it.each( [
		[ 'the new screen with the flag on', { useNewScreen: true }, false, 'screen' ],
		[ 'the empty container with the flag off', { useNewScreen: false }, false, 'container' ],
		[
			'the empty container with an older shared script',
			{ useNewScreen: true },
			true,
			'container',
		],
		[
			'nothing once Safe Mode is confirmed',
			{ useNewScreen: true, isSafeModeConfirmed: true },
			false,
			'nothing',
		],
	] )( 'shows %s', ( _, identityCrisis, oldScript, expected ) => {
		mockIdentityCrisis = { isSafeModeConfirmed: false, ...identityCrisis };
		mockOldScript = oldScript;
		render( <IDCModal /> );

		expect( Boolean( screen.queryByRole( 'dialog' ) ) ).toBe( expected !== 'nothing' );
		expect( Boolean( screen.queryByText( 'New Safe Mode screen' ) ) ).toBe( expected === 'screen' );
	} );
} );
