// Mock this that's usually set by automattic/jetpack-connection.
window.JP_CONNECTION_INITIAL_STATE = {
	userConnectionData: {
		currentUser: {
			wpcomUser: { Id: 99999, login: 'bobsacramento', display_name: 'Bob Sacramento' },
		},
	},
};

// Work around (presumably) https://github.com/microsoft/TypeScript/issues/43081
jest.mock( '@wordpress/data', () => {
	const ret = {};
	for ( const [ k, v ] of Object.entries(
		Object.getOwnPropertyDescriptors( jest.requireActual( '@wordpress/data' ) )
	) ) {
		Object.defineProperty( ret, k, { ...v, configurable: true } );
	}
	return ret;
} );
