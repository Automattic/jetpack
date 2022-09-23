// eslint-disable-next-line jest/prefer-spy-on -- Nothing to spy on.
global.fetch = jest.fn();
fetch.mockFetchResponse = function ( body, init = {} ) {
	const status = parseInt( init.status || 200 );
	const statusText = init.statusText || 'OK';

	let rbody = body;
	if ( typeof rbody !== 'string' ) {
		rbody = JSON.stringify( rbody );
	}
	if ( status < 200 || status > 599 ) {
		throw new Error( `Invalid status: ${ init.status }` );
	}

	this.mockResolvedValueOnce( {
		body: rbody,
		ok: status < 300,
		status: status,
		statusText: statusText,
		json: () => JSON.parse( rbody ),
	} );
};

const mockSetLocaleData = jest.fn();
jest.doMock(
	'@wordpress/i18n',
	() => ( {
		setLocaleData: mockSetLocaleData,
	} ),
	{ virtual: true }
);

const translations = JSON.stringify( {
	domain: 'messages',
	locale_data: {
		messages: {
			'': {
				domain: 'messages',
				lang: 'en',
				'plural-forms': 'nplurals=2; plural=(n != 1);',
			},
			'This is translated': [ 'is-Thay is-way anslated-tray' ],
		},
	},
} );

const loader = require( '../../src/js/i18n-loader.js' );

beforeEach( () => {
	global.fetch.mockReset();
	mockSetLocaleData.mockReset();

	loader.state = {
		baseUrl: 'http://example.com/wp-content/languages/',
		locale: 'en_piglatin',
		domainMap: {},
		domainPaths: {},
	};
} );

test( 'No state', async () => {
	loader.state = null;
	await expect( loader.downloadI18n( 'foo', 'bar', 'baz' ) ).rejects.toThrow(
		'wp.jpI18nLoader.state is not set'
	);
	expect( global.fetch ).not.toHaveBeenCalled();
	expect( mockSetLocaleData ).not.toHaveBeenCalled();
} );

test( 'No baseUrl in state', async () => {
	loader.state.baseUrl = null;
	await expect( loader.downloadI18n( 'foo', 'bar', 'baz' ) ).rejects.toThrow(
		'wp.jpI18nLoader.state is not set'
	);
	expect( global.fetch ).not.toHaveBeenCalled();
	expect( mockSetLocaleData ).not.toHaveBeenCalled();
} );

test( 'Locale is en_US', async () => {
	loader.state.locale = 'en_US';
	await expect( loader.downloadI18n( 'foo', 'bar', 'baz' ) ).resolves.not.toThrow();
	expect( global.fetch ).not.toHaveBeenCalled();
	expect( mockSetLocaleData ).not.toHaveBeenCalled();
} );

test( 'No fetch', async () => {
	const tmp = global.fetch;
	try {
		delete global.fetch;
		await expect( loader.downloadI18n( 'foo', 'bar', 'baz' ) ).rejects.toThrow(
			'Fetch API is not available.'
		);
	} finally {
		global.fetch = tmp;
	}
	expect( global.fetch ).not.toHaveBeenCalled();
	expect( mockSetLocaleData ).not.toHaveBeenCalled();
} );

test.each( [
	[ 'plugin', 'plugins/' ],
	[ 'theme', 'themes/' ],
	[ 'core', '' ],
] )( 'Simple fetch (location=%s)', async ( location, urlpart ) => {
	fetch.mockFetchResponse( translations );
	await expect( loader.downloadI18n( 'foo.js', 'bar', location ) ).resolves.not.toThrow();
	expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	expect( global.fetch ).toHaveBeenCalledWith(
		`http://example.com/wp-content/languages/${ urlpart }bar-en_piglatin-c30102c2bcf57c992ba3491b22e1e4d0.json`
	);
	expect( mockSetLocaleData ).toHaveBeenCalledTimes( 1 );
	expect( mockSetLocaleData ).toHaveBeenCalledWith(
		{
			'': {
				domain: 'bar',
				lang: 'en',
				'plural-forms': 'nplurals=2; plural=(n != 1);',
			},
			'This is translated': [ 'is-Thay is-way anslated-tray' ],
		},
		'bar'
	);
} );

test( 'Failed fetch', async () => {
	fetch.mockFetchResponse( 'The specified document was not found.', {
		status: 404,
		statusText: 'Not found',
	} );
	await expect( loader.downloadI18n( 'foo.js', 'bar', 'plugin' ) ).rejects.toThrow(
		'HTTP request failed: 404 Not found'
	);
	expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	expect( global.fetch ).toHaveBeenCalledWith(
		'http://example.com/wp-content/languages/plugins/bar-en_piglatin-c30102c2bcf57c992ba3491b22e1e4d0.json'
	);
	expect( mockSetLocaleData ).not.toHaveBeenCalled();
} );

test( 'Bad JSON', async () => {
	fetch.mockFetchResponse( '<html>Whatever</html>' );
	await expect( loader.downloadI18n( 'foo.js', 'bar', 'plugin' ) ).rejects.toThrow(
		'Unexpected token < in JSON at position 0'
	);
	expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	expect( global.fetch ).toHaveBeenCalledWith(
		'http://example.com/wp-content/languages/plugins/bar-en_piglatin-c30102c2bcf57c992ba3491b22e1e4d0.json'
	);
	expect( mockSetLocaleData ).not.toHaveBeenCalled();
} );

test( 'Fetch with query part and domain map', async () => {
	loader.state.domainMap.bar = 'themes/mytheme';
	fetch.mockFetchResponse( translations );
	await expect(
		loader.downloadI18n( 'dist/foo.js?ver=12345?6789', 'bar', 'plugin' )
	).resolves.not.toThrow();
	expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	expect( global.fetch ).toHaveBeenCalledWith(
		'http://example.com/wp-content/languages/themes/mytheme-en_piglatin-1648792a465228e857cd166c292e2e4a.json?ver=12345?6789'
	);
	expect( mockSetLocaleData ).toHaveBeenCalledTimes( 1 );
	expect( mockSetLocaleData ).toHaveBeenCalledWith(
		{
			'': {
				domain: 'bar',
				lang: 'en',
				'plural-forms': 'nplurals=2; plural=(n != 1);',
			},
			'This is translated': [ 'is-Thay is-way anslated-tray' ],
		},
		'bar'
	);
} );

test( 'Fetch with query part and domain map and path', async () => {
	loader.state.domainMap.bar = 'themes/mytheme';
	loader.state.domainPaths.bar = 'path/to/bar/';
	fetch.mockFetchResponse( translations );
	await expect(
		loader.downloadI18n( 'dist/foo.js?ver=12345?6789', 'bar', 'plugin' )
	).resolves.not.toThrow();
	expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	expect( global.fetch ).toHaveBeenCalledWith(
		'http://example.com/wp-content/languages/themes/mytheme-en_piglatin-fe1568906ebfe6b7e22d422cba956f83.json?ver=12345?6789'
	);
	expect( mockSetLocaleData ).toHaveBeenCalledTimes( 1 );
	expect( mockSetLocaleData ).toHaveBeenCalledWith(
		{
			'': {
				domain: 'bar',
				lang: 'en',
				'plural-forms': 'nplurals=2; plural=(n != 1);',
			},
			'This is translated': [ 'is-Thay is-way anslated-tray' ],
		},
		'bar'
	);
} );

test( 'Fetch with silly domain', async () => {
	fetch.mockFetchResponse( translations );
	await expect( loader.downloadI18n( 'foo.js', 'toString', 'plugin' ) ).resolves.not.toThrow();
	expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	expect( global.fetch ).toHaveBeenCalledWith(
		'http://example.com/wp-content/languages/plugins/toString-en_piglatin-c30102c2bcf57c992ba3491b22e1e4d0.json'
	);
	expect( mockSetLocaleData ).toHaveBeenCalledTimes( 1 );
	expect( mockSetLocaleData ).toHaveBeenCalledWith(
		{
			'': {
				domain: 'toString',
				lang: 'en',
				'plural-forms': 'nplurals=2; plural=(n != 1);',
			},
			'This is translated': [ 'is-Thay is-way anslated-tray' ],
		},
		'toString'
	);
} );
