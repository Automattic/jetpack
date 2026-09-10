import { VerificationServicesComponent } from '../verification-services';

describe( 'Site verification meta tag formatting', () => {
	const component = new VerificationServicesComponent( {} );

	it( 'wraps verification codes containing safe punctuation', () => {
		expect( component.getMetaTag( 'google', '+token.value/with=safe:@~characters' ) ).toBe(
			'<meta name="google-site-verification" content="+token.value/with=safe:@~characters" />'
		);
	} );

	it( 'does not wrap values containing attribute delimiters', () => {
		expect( component.getMetaTag( 'google', 'unsafe"attribute' ) ).toBe( 'unsafe"attribute' );
	} );

	it( 'escapes ampersands when formatting the meta tag', () => {
		expect( component.getMetaTag( 'bing', 'token&value' ) ).toBe(
			'<meta name="msvalidate.01" content="token&amp;value" />'
		);
	} );

	it( 'does not double-escape stored HTML entities', () => {
		expect( component.getMetaTag( 'bing', 'token&amp;value' ) ).toBe(
			'<meta name="msvalidate.01" content="token&amp;value" />'
		);
	} );
} );
