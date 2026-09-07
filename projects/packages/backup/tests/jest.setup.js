window.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: {
			wpcomUser: { ID: 99999, login: 'bobsacramento', display_name: 'Bob Sacramento' },
		},
	},
};

// jsdom implements no scrolling, and DataViews' list layout calls
// `scrollIntoView` on the selected row.
// Defined rather than spied on: `jest.spyOn` needs the property to already
// exist, and `defineProperty` keeps `jest/prefer-spy-on` from rewriting it.
Object.defineProperty( window.HTMLElement.prototype, 'scrollIntoView', {
	value: () => {},
	writable: true,
} );
