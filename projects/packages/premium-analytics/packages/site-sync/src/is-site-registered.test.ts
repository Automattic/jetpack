/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { isSiteRegistered } from './is-site-registered';

jest.mock( '@automattic/jetpack-script-data' );
jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
} ) );

const mockSelect = select as jest.MockedFunction< typeof select >;
const mockScriptData = getScriptData as jest.MockedFunction< typeof getScriptData >;

/**
 * Stub the live `jetpack-connection` store's `getConnectionStatus` selector.
 *
 * @param isRegistered - What the live store should report, or `undefined` to
 *                     simulate the store being unregistered (no selector).
 */
function mockConnectionStore( isRegistered: boolean | undefined ) {
	mockSelect.mockImplementation( ( storeName: unknown ) => {
		if ( storeName === 'jetpack-connection' && isRegistered !== undefined ) {
			return { getConnectionStatus: () => ( { isRegistered } ) } as never;
		}
		return undefined as never;
	} );
}

/**
 * Stub the script-data snapshot's registration flag.
 *
 * @param isRegistered - What the snapshot should report.
 */
function mockSnapshot( isRegistered: boolean ) {
	mockScriptData.mockReturnValue( {
		connection: { connectionStatus: { isRegistered } },
	} as ReturnType< typeof getScriptData > );
}

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'isSiteRegistered', () => {
	it( 'prefers the live connection store over the script-data snapshot', () => {
		// Live store says registered; the (stale) snapshot disagrees.
		mockConnectionStore( true );
		mockSnapshot( false );

		expect( isSiteRegistered() ).toBe( true );
	} );

	it( 'returns false when the live store reports not registered', () => {
		// Live store wins even when the snapshot is stale-positive.
		mockConnectionStore( false );
		mockSnapshot( true );

		expect( isSiteRegistered() ).toBe( false );
	} );

	it( 'falls back to the script-data snapshot when the store is unregistered', () => {
		mockConnectionStore( undefined );
		mockSnapshot( true );

		expect( isSiteRegistered() ).toBe( true );
	} );

	it( 'returns false when neither source reports registration', () => {
		mockConnectionStore( undefined );
		mockScriptData.mockReturnValue( {} as ReturnType< typeof getScriptData > );

		expect( isSiteRegistered() ).toBe( false );
	} );

	it( 'returns false when script-data itself is unavailable', () => {
		mockConnectionStore( undefined );
		mockScriptData.mockReturnValue( undefined as unknown as ReturnType< typeof getScriptData > );

		expect( isSiteRegistered() ).toBe( false );
	} );
} );
