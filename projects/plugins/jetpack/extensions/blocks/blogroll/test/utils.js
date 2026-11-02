import { createBlockFromSubscription, getWpcomFeedUrl } from '../utils';

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
		const block = createBlockFromSubscription( subscription );

		expect( block.attributes.feed_url ).toBe( 'https://example.wordpress.com/feed/' );
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
