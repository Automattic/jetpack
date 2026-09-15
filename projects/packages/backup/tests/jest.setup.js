const { configure } = require( '@testing-library/react' );

// Testing Library's 1s default leaves these route-stage suites no headroom in
// the coverage job, where every project's jest pool shares one runner and every
// module is instrumented. Only a failing wait pays the longer budget.
configure( { asyncUtilTimeout: 10000 } );

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
