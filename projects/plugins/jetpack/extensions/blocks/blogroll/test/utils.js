import {
	createBlockFromSubscription,
	discoverFeedUrl,
	getValidFeedUrl,
	getWpcomFeedUrl,
} from '../utils';

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: ( name, attributes ) => ( { name, attributes } ),
} ) );

jest.mock( '../placeholder-site-icon.svg', () => 'placeholder.svg' );

const subscription = {
	blog_id: '123',
	site_icon: 'https://example.wordpress.com/icon.png',
	URL: 'https://example.wordpress.com',
	name: 'Example',
	description: 'An example site',
};

describe( 'getWpcomFeedUrl', () => {
	it( 'appends /feed/ to the site URL', () => {
		expect( getWpcomFeedUrl( 'https://example.wordpress.com' ) ).toBe(
			'https://example.wordpress.com/feed/'
		);
	} );

	it( 'does not double the trailing slash', () => {
		expect( getWpcomFeedUrl( 'https://example.wordpress.com/' ) ).toBe(
			'https://example.wordpress.com/feed/'
		);
	} );

	it( 'returns undefined without a site URL', () => {
		expect( getWpcomFeedUrl( undefined ) ).toBeUndefined();
		expect( getWpcomFeedUrl( '' ) ).toBeUndefined();
	} );
} );

describe( 'createBlockFromSubscription', () => {
	it( 'uses the feed URL the API provides', () => {
		const block = createBlockFromSubscription( {
			...subscription,
			feed_URL: 'https://example.wordpress.com/custom-feed/',
		} );

		expect( block.attributes.feed_url ).toBe( 'https://example.wordpress.com/custom-feed/' );
	} );

	it( 'falls back to /feed/ for a WordPress.com-hosted site without a feed URL', () => {
		const block = createBlockFromSubscription( { ...subscription, jetpack: false } );

		expect( block.attributes.feed_url ).toBe( 'https://example.wordpress.com/feed/' );
	} );

	it( 'does not guess the feed of a Jetpack site', () => {
		const block = createBlockFromSubscription( {
			...subscription,
			URL: 'https://example.com',
			jetpack: true,
		} );

		expect( block.attributes.feed_url ).toBeUndefined();
	} );

	it( 'ignores a feed URL that is not http(s)', () => {
		const block = createBlockFromSubscription( {
			...subscription,
			feed_URL: 'javascript:void(0)',
		} );

		expect( block.attributes.feed_url ).toBeUndefined();
	} );

	it( 'leaves the feed URL empty for a site WordPress.com does not host', () => {
		const block = createBlockFromSubscription( {
			...subscription,
			URL: 'https://example.com',
			is_non_wpcom_site: true,
		} );

		expect( block.attributes.feed_url ).toBeUndefined();
	} );
} );

describe( 'getValidFeedUrl', () => {
	it.each( [
		[ '  https://example.com/feed/  ', 'https://example.com/feed/' ],
		[ 'http://example.com/rss.xml', 'http://example.com/rss.xml' ],
		[ 'https://example.com/my feed/', 'https://example.com/my%20feed/' ],
		[ '   ', undefined ],
		[ 'not a url', undefined ],
		[ 'javascript:void(0)', undefined ],
		[ undefined, undefined ],
	] )( '%p becomes %p', ( value, expected ) => {
		expect( getValidFeedUrl( value ) ).toBe( expected );
	} );
} );

describe( 'discoverFeedUrl', () => {
	const feeds = [
		{ subscribe_URL: 'https://example.com/feed/' },
		{ subscribe_URL: 'https://example.com/feed/podcast' },
	];

	// Answer /sites/ with `site` and the Reader with `readerFeeds`; undefined means a 404.
	const mockFetch = ( site, readerFeeds ) =>
		jest.spyOn( global, 'fetch' ).mockImplementation( url => {
			const body = url.includes( '/read/feed/' ) ? readerFeeds && { feeds: readerFeeds } : site;
			return Promise.resolve( { ok: !! body, json: () => Promise.resolve( body ) } );
		} );

	// jsdom has no fetch, so give spyOn one to replace.
	beforeEach( () => {
		global.fetch = () => Promise.reject( new Error( 'fetch is not mocked' ) );
	} );

	afterEach( () => {
		delete global.fetch;
	} );

	it( 'uses /feed/ for a WordPress.com-hosted site', async () => {
		mockFetch( { jetpack: false, URL: 'https://example.wordpress.com' }, [
			{ subscribe_URL: 'http://example.wordpress.com' },
		] );

		await expect( discoverFeedUrl( 'example.wordpress.com' ) ).resolves.toBe(
			'https://example.wordpress.com/feed/'
		);
	} );

	it.each( [
		[ 'a Jetpack site', { jetpack: true, URL: 'https://example.com' } ],
		[ 'a site WordPress.com does not know', undefined ],
	] )( 'returns the first feed the Reader finds for %s', async ( _, site ) => {
		mockFetch( site, feeds );

		await expect( discoverFeedUrl( 'example.com' ) ).resolves.toBe( 'https://example.com/feed/' );
		expect( global.fetch ).toHaveBeenCalledWith(
			'https://public-api.wordpress.com/rest/v1.1/read/feed/?url=example.com'
		);
	} );

	it.each( [
		[ 'no feed is found', () => mockFetch( undefined, undefined ) ],
		[
			'the request fails',
			() => jest.spyOn( global, 'fetch' ).mockRejectedValue( new Error( 'offline' ) ),
		],
	] )( 'returns undefined when %s', async ( _, setup ) => {
		setup();

		await expect( discoverFeedUrl( 'example.com' ) ).resolves.toBeUndefined();
	} );
} );
