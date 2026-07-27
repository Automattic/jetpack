// The share destinations are the whole point of the Share modal, and a typo in
// one is invisible until someone lands on a broken compose page. These pin the
// two things that are easy to get wrong — that the URL is carried and encoded
// on every service, and the WhatsApp host swap that Jetpack's own sharing
// buttons already do for Firefox on desktop.

import { getShareLinks, getShareText } from '../_inc/share/share-links';

const SITE_URL = 'https://octagonal.wordpress.com';

/**
 * Point `navigator.userAgent` at a browser for the duration of a test.
 *
 * @param agent - The user-agent string to report.
 */
function setUserAgent( agent: string ): void {
	Object.defineProperty( window.navigator, 'userAgent', {
		value: agent,
		configurable: true,
	} );
}

const FIREFOX_DESKTOP =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0';
const FIREFOX_ANDROID = 'Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0';
const CHROME =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

describe( 'share links', () => {
	beforeEach( () => setUserAgent( CHROME ) );

	it( 'offers every service the design calls for, in order', () => {
		expect( getShareLinks( SITE_URL, 'text' ).map( link => link.service ) ).toEqual( [
			'mail',
			'tumblr',
			'bluesky',
			'linkedin',
			'telegram',
			'reddit',
			'whatsapp',
			'x',
		] );
	} );

	it( 'carries the URL, encoded, on every service', () => {
		const encoded = encodeURIComponent( SITE_URL );

		for ( const link of getShareLinks( SITE_URL, 'text' ) ) {
			expect( link.href ).toContain( encoded );
			// The raw URL would mean an unencoded `://` sitting in a query value.
			expect( link.href.split( '?' )[ 1 ] ).not.toContain( SITE_URL );
		}
	} );

	it( 'encodes the share text too, so punctuation survives', () => {
		const text = 'Please visit my newsletter: https://a.example/?x=1&y=2';
		const linkedin = getShareLinks( SITE_URL, text ).find( l => l.service === 'linkedin' );

		expect( linkedin?.href ).toContain( encodeURIComponent( text ) );
	} );

	it( 'sends Firefox on desktop to web.whatsapp.com, which it can actually open', () => {
		setUserAgent( FIREFOX_DESKTOP );
		const whatsapp = getShareLinks( SITE_URL, 'text' ).find( l => l.service === 'whatsapp' );

		expect( whatsapp?.href ).toContain( 'web.whatsapp.com' );
	} );

	it.each( [
		[ 'Chrome', CHROME ],
		[ 'Firefox on Android', FIREFOX_ANDROID ],
	] )( 'sends %s to api.whatsapp.com', ( _name, agent ) => {
		setUserAgent( agent );
		const whatsapp = getShareLinks( SITE_URL, 'text' ).find( l => l.service === 'whatsapp' );

		expect( whatsapp?.href ).toContain( 'api.whatsapp.com' );
	} );

	it( 'requests every service over https', () => {
		for ( const link of getShareLinks( SITE_URL, 'text' ) ) {
			expect( link.href.startsWith( 'https://' ) || link.href.startsWith( 'mailto:' ) ).toBe(
				true
			);
		}
	} );

	it( 'names the newsletter in the share text', () => {
		expect( getShareText( SITE_URL ) ).toContain( SITE_URL );
	} );
} );
