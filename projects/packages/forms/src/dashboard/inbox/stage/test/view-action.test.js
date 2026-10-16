import { describe, expect, it, jest } from '@jest/globals';

// The headline behaviour of the standalone response page: the responses list's
// "View" row action opens `/response/<id>` instead of selecting the response in
// the list via the `responseIds` search param. Located here rather than beside the
// route because `routes/*/package.json` has no `"type": "module"`, which makes
// `.js` under those directories CJS and unable to import the route's TS modules.
const { getActions } = await import( '../../../../../routes/responses/actions.tsx' );

describe( 'viewAction', () => {
	it( 'opens the response on its own page', async () => {
		const navigate = jest.fn();

		await getActions( { navigate } ).viewAction.callback( [ { id: 7 } ], {} );

		expect( navigate ).toHaveBeenCalledWith( { to: '/response/7' } );
	} );

	it( 'does not fall back to selecting the response in the list', async () => {
		const navigate = jest.fn();

		await getActions( { navigate } ).viewAction.callback( [ { id: 7 } ], {} );

		// Guards the regression back to the pre-PR behaviour, which navigated by
		// setting `search: { responseIds: [ '7' ] }` on the list route.
		expect( navigate.mock.calls[ 0 ][ 0 ] ).not.toHaveProperty( 'search' );
	} );

	it( 'does nothing when handed no items', async () => {
		const navigate = jest.fn();

		await getActions( { navigate } ).viewAction.callback( [], {} );

		expect( navigate ).not.toHaveBeenCalled();
	} );
} );
