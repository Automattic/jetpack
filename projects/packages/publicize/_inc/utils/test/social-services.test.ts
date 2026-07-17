import { SOCIAL_SERVICE_META, matchSocialService } from '../social-services';

describe( 'matchSocialService', () => {
	it( 'matches a bare hostname to its service slug', () => {
		expect( matchSocialService( 'facebook.com' ) ).toBe( 'facebook' );
		expect( matchSocialService( 'bsky.app' ) ).toBe( 'bluesky' );
		expect( matchSocialService( 'nextdoor.com' ) ).toBe( 'nextdoor' );
	} );

	it( 'matches a full URL by hostname', () => {
		expect( matchSocialService( 'https://m.facebook.com/some/path?x=1' ) ).toBe( 'facebook' );
		expect( matchSocialService( 'http://reddit.com/r/wordpress' ) ).toBe( 'reddit' );
	} );

	it( 'folds subdomains into the parent service', () => {
		expect( matchSocialService( 'l.facebook.com' ) ).toBe( 'facebook' );
		expect( matchSocialService( 'l.instagram.com' ) ).toBe( 'instagram-business' );
	} );

	it( 'maps all of X / Twitter / t.co hosts to x', () => {
		expect( matchSocialService( 'x.com' ) ).toBe( 'x' );
		expect( matchSocialService( 'twitter.com' ) ).toBe( 'x' );
		expect( matchSocialService( 't.co' ) ).toBe( 'x' );
	} );

	it( 'is case-insensitive', () => {
		expect( matchSocialService( 'Facebook.COM' ) ).toBe( 'facebook' );
	} );

	it( 'returns null for unknown hosts', () => {
		expect( matchSocialService( 'example.com' ) ).toBeNull();
		expect( matchSocialService( '' ) ).toBeNull();
	} );

	it( 'does not match on a non-boundary substring', () => {
		// `notfacebook.com` must not fold into facebook, nor a deeper domain
		// that merely contains the host as a non-suffix label.
		expect( matchSocialService( 'notfacebook.com' ) ).toBeNull();
		expect( matchSocialService( 'facebook.com.evil.example' ) ).toBeNull();
	} );

	it( 'covers every declared host', () => {
		for ( const [ slug, meta ] of Object.entries( SOCIAL_SERVICE_META ) ) {
			for ( const host of meta.hosts ) {
				expect( matchSocialService( host ) ).toBe( slug );
			}
		}
	} );
} );
