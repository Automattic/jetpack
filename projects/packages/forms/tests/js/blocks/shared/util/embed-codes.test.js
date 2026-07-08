import { getEmbedCode, getShortcode } from '../../../../../src/blocks/shared/util/embed-codes';

describe( 'getEmbedCode', () => {
	it( 'generates a block embed code with the given post ID', () => {
		expect( getEmbedCode( 42 ) ).toBe( '<!-- wp:jetpack/contact-form {"ref":42} /-->' );
	} );
} );

describe( 'getShortcode', () => {
	it( 'generates a shortcode with the given post ID', () => {
		expect( getShortcode( 42 ) ).toBe( '[contact-form ref="42"]' );
	} );
} );
