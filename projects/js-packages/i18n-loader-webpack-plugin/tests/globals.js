// Some globals the tests will probably want.
global.wpI18n = require( '@wordpress/i18n' );
global.jpI18nState = {
	baseUrl: 'http://test.example.com/wp-content/languages/',
	locale: 'en_piglatin',
	domainMap: {},
};
global.window = {
	...global.window,
	wp: {
		i18n: global.wpI18n,
		jpI18nState: global.jpI18nState,
	},
};

// Simple fetch mock, sufficient for our purposes.
global.fetch = jest.fn( url => {
	const ret = fetch.urls[ url ];
	if ( typeof ret === 'undefined' ) {
		throw new Error( `Unexpected URL ${ url }` );
	}
	if ( ret === null ) {
		throw new Error( `URL ${ url } was requested multiple times` );
	}
	fetch.urls[ url ] = null;
	return ret;
} );
fetch.urls = {};

/**
 * Mock a URL.
 *
 * @param {string} url - URL.
 * @param {*}      body - Response body. If not a string, it will be passed through `JSON.stringify()`.
 * @param {object} init - Additional response data.
 * @param {number} init.status - Response status. Default 200.
 * @param {string} init.statusText - Response status text. Default "OK".
 */
fetch.expectUrl = ( url, body, init = {} ) => {
	const status = parseInt( init.status || 200 );
	const statusText = init.statusText || 'OK';

	let rbody = body;
	if ( typeof rbody !== 'string' ) {
		rbody = JSON.stringify( rbody );
	}
	if ( status < 200 || status > 599 ) {
		throw new Error( `Invalid status: ${ init.status }` );
	}

	fetch.urls[ url ] = Promise.resolve( {
		body: rbody,
		ok: status < 300,
		status: status,
		statusText: statusText,
		url: url,
		json: () => JSON.parse( rbody ),
	} );
};

/**
 * Mock a fetch error.
 *
 * @param {string} url - URL.
 * @param {Error}  err - Error.
 */
fetch.expectError = ( url, err ) => {
	fetch.urls[ url ] = Promise.reject( err );
};
