const globalScope = typeof window !== 'undefined' ? window : globalThis;
globalScope.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: {
			wpcomUser: {
				ID: 99999,
				login: 'bobsacramento',
				display_name: 'Bob Sacramento',
				avatar: false,
			},
		},
	},
};
globalScope.myJetpackInitialState = {};
globalScope.myJetpackRest = {};

// Remembered choices, such as the Features tab's layout, would otherwise carry into the next test.
if ( typeof window !== 'undefined' ) {
	afterEach( () => window.localStorage.clear() );
}

/*
 * The real hook pulls in the connection store, which breaks under a partial `@wordpress/data` mock.
 * Assert on `jest.mocked( useAnalytics )().recordEvent`; one spy is shared per test file.
 */
jest.mock( '../_inc/hooks/use-analytics', () => {
	const recordEvent = jest.fn();
	return { __esModule: true, default: jest.fn( () => ( { recordEvent } ) ) };
} );
