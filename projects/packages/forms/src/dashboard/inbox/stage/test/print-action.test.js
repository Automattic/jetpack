import { describe, expect, it, jest } from '@jest/globals';

// The responses list's "Print" row action hands printing off to the standalone
// response page rather than printing from the list: it navigates to
// `/response/<id>` with `print=1`, and the page opens the browser dialog once the
// response has rendered. Located here for the same reason as `view-action.test.js`
// — `routes/*/package.json` has no `"type": "module"`, which makes `.js` under
// those directories CJS and unable to import the route's TS modules.
const { getActions } = await import( '../../../../../routes/responses/actions.tsx' );

describe( 'printAction', () => {
	it( 'opens the response page with the print flag set', async () => {
		const navigate = jest.fn();

		await getActions( { navigate } ).printAction.callback( [ { id: 7 } ], {} );

		expect( navigate ).toHaveBeenCalledWith( { to: '/response/7', search: { print: 1 } } );
	} );

	it( 'does nothing when handed no items', async () => {
		const navigate = jest.fn();

		await getActions( { navigate } ).printAction.callback( [], {} );

		expect( navigate ).not.toHaveBeenCalled();
	} );

	it( 'is not offered for bulk selections', () => {
		const navigate = jest.fn();

		// Printing several responses at once would open one dialog for whichever
		// response won the navigation race, so the action is single-item only.
		expect( getActions( { navigate } ).printAction.supportsBulk ).toBe( false );
	} );
} );
