import { onIdentityCrisisActionSuccess } from '@automattic/jetpack-connection';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { reloadPage } from '../../../utils/reload-page';
import IDCModal from '../index';

let mockIdentityCrisis = null;
let mockOldScript = false;
let mockOnActionSuccess;

jest.mock( '@automattic/jetpack-connection', () => ( {
	CONNECTION_FROM: { myJetpackSafeMode: 'my_jetpack_safe_mode' },
	CONNECTION_STORE_ID: 'jetpack-connection',
	onIdentityCrisisActionSuccess: jest.fn(),
	get IdentityCrisis() {
		if ( mockOldScript ) {
			return undefined;
		}
		return ( { onActionSuccess } ) => {
			mockOnActionSuccess = onActionSuccess;
			return <p>New Safe Mode screen</p>;
		};
	},
} ) );
jest.mock( '../../../utils/reload-page' );
jest.mock( '@wordpress/data', () => ( {
	...jest.requireActual( '@wordpress/data' ),
	useSelect: mapSelect => mapSelect( () => ( { getIdentityCrisis: () => mockIdentityCrisis } ) ),
} ) );

beforeEach( () => {
	jest.clearAllMocks();
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

	it.each( [
		[ 'reloads after a migrate', 'migrate', true ],
		[ 'closes after another action', 'confirm-safe-mode', false ],
	] )( 'on close, %s', async ( _, action, reloads ) => {
		const user = userEvent.setup();
		mockIdentityCrisis = { useNewScreen: true, isSafeModeConfirmed: false };
		render( <IDCModal /> );

		act( () => mockOnActionSuccess( { action } ) );
		await user.keyboard( '{Escape}' );

		expect( reloadPage ).toHaveBeenCalledTimes( reloads ? 1 : 0 );
		expect( onIdentityCrisisActionSuccess ).toHaveBeenCalledTimes( reloads ? 0 : 1 );
		expect( Boolean( screen.queryByRole( 'dialog' ) ) ).toBe( reloads );
	} );
} );
