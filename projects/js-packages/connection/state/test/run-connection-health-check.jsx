import { jest } from '@jest/globals';
import actions from '../actions';

// Older bundles sharing this store still call the thunk unguarded, so it must keep resolving.
describe( 'runConnectionHealthCheck (deprecated no-op)', () => {
	it( 'resolves with an empty map without dispatching', async () => {
		const dispatch = jest.fn();

		await expect( actions.runConnectionHealthCheck()( { dispatch } ) ).resolves.toEqual( {} );
		expect( dispatch ).not.toHaveBeenCalled();
	} );
} );
