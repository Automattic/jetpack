import { isSimpleSite } from '@automattic/jetpack-script-data';
import { isCurrentUserConnected } from '../is-current-user-connected';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn(),
} ) );

type TestWindow = {
	JP_CONNECTION_INITIAL_STATE?: { connectionStatus?: { isUserConnected?: boolean } };
};

const testWindow = window as unknown as TestWindow;

describe( 'isCurrentUserConnected', () => {
	afterEach( () => {
		delete testWindow.JP_CONNECTION_INITIAL_STATE;
	} );

	it( 'treats every user as connected on WordPress.com Simple', () => {
		jest.mocked( isSimpleSite ).mockReturnValue( true );

		expect( isCurrentUserConnected() ).toBe( true );
	} );

	it( 'reports connected when the per-user connection state says so', () => {
		jest.mocked( isSimpleSite ).mockReturnValue( false );
		testWindow.JP_CONNECTION_INITIAL_STATE = { connectionStatus: { isUserConnected: true } };

		expect( isCurrentUserConnected() ).toBe( true );
	} );

	it( 'reports not connected when the per-user connection state says so', () => {
		jest.mocked( isSimpleSite ).mockReturnValue( false );
		testWindow.JP_CONNECTION_INITIAL_STATE = { connectionStatus: { isUserConnected: false } };

		expect( isCurrentUserConnected() ).toBe( false );
	} );

	it( 'reports not connected when there is no connection state', () => {
		jest.mocked( isSimpleSite ).mockReturnValue( false );

		expect( isCurrentUserConnected() ).toBe( false );
	} );
} );
