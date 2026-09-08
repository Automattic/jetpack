import * as inlineSvgs from '../inline-svgs';

const PREFIX = 'data:image/svg+xml;base64,';

describe( 'inline-svgs', () => {
	it( 'exports one entry per inlined SVG', () => {
		expect( Object.keys( inlineSvgs ) ).toHaveLength( 14 );
	} );

	it.each( Object.entries( inlineSvgs ) )( '%s is a decodable SVG data URI', ( _name, value ) => {
		expect( typeof value ).toBe( 'string' );
		expect( value.startsWith( PREFIX ) ).toBe( true );

		const decoded = Buffer.from( value.slice( PREFIX.length ), 'base64' ).toString( 'utf8' );
		expect( decoded ).toContain( '<svg' );
	} );
} );
