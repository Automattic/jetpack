/**
 * Tests for unlocking core's private block editor APIs.
 *
 * The editor loads this every time, so the opt-in waits for the first unlock.
 *
 * @package
 */

const mockPrivateApis = { requestInspectorTab: jest.fn() };
const mockUnlock = jest.fn( () => mockPrivateApis );
const mockOptIn = jest.fn( () => ( { unlock: mockUnlock } ) );

jest.mock( '@wordpress/private-apis', () => ( {
	__dangerousOptInToUnstableAPIsOnlyForCoreModules: ( ...args ) => mockOptIn( ...args ),
} ) );

/**
 * Load a fresh copy of the module, so no test inherits an earlier opt-in.
 *
 * @return {Function} The module's unlock.
 */
function loadUnlock() {
	let unlock;
	jest.isolateModules( () => {
		( { unlock } = require( '../../src/paypal-payment-buttons/utils/lock-unlock' ) );
	} );
	return unlock;
}

describe( 'unlock', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'waits for the first unlock to opt in', () => {
		const dispatch = { store: 'core/block-editor' };
		const unlock = loadUnlock();

		expect( mockOptIn ).not.toHaveBeenCalled();

		expect( unlock( dispatch ) ).toBe( mockPrivateApis );
		expect( mockUnlock ).toHaveBeenCalledWith( dispatch );
	} );

	// The block keeps working if core refuses. A changed consent string fails the
	// opt-in, and a second private-apis copy fails the unlock.
	it.each( [
		[ 'opt-in', mockOptIn ],
		[ 'unlock', mockUnlock ],
	] )(
		'logs an error once and returns an empty object when core refuses the %s',
		( _step, mock ) => {
			mock.mockImplementationOnce( () => {
				throw new Error( 'refused' );
			} );
			const consoleError = jest.spyOn( console, 'error' );
			const unlock = loadUnlock();

			expect( unlock( {} ) ).toEqual( {} );
			expect( unlock( {} ) ).toEqual( {} );
			expect( mockOptIn ).toHaveBeenCalledTimes( 1 );
			expect( consoleError ).toHaveBeenCalledTimes( 1 );
			expect( console ).toHaveErrored();
		}
	);
} );
