import { describe, expect, it, jest } from '@jest/globals';

// Located here rather than beside the route for the same reason as
// `view-action.test.js`: `routes/*/package.json` has no `"type": "module"`.
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
