import { getEmbedCode, getShortcode } from '../embed-codes';

describe( 'getEmbedCode', () => {
	it( 'generates a block embed code with the given post ID', () => {
		expect( getEmbedCode( 42 ) ).toBe( '<!-- wp:jetpack/contact-form {"ref":42} /-->' );
	} );

	it( 'handles different post IDs', () => {
		expect( getEmbedCode( 1 ) ).toBe( '<!-- wp:jetpack/contact-form {"ref":1} /-->' );
		expect( getEmbedCode( 99999 ) ).toBe( '<!-- wp:jetpack/contact-form {"ref":99999} /-->' );
	} );
} );

describe( 'getShortcode', () => {
	it( 'generates a shortcode with the given post ID', () => {
		expect( getShortcode( 42 ) ).toBe( '[contact-form ref="42"]' );
	} );

	it( 'handles different post IDs', () => {
		expect( getShortcode( 1 ) ).toBe( '[contact-form ref="1"]' );
		expect( getShortcode( 99999 ) ).toBe( '[contact-form ref="99999"]' );
	} );
} );
