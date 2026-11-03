import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const INC = join( __dirname, '../..' );

const addressed = ( readdirSync( INC, { recursive: true } ) as string[] )
	.filter( file => /\.[jt]sx?$/.test( file ) && ! file.split( /[\\/]/ ).includes( 'test' ) )
	.flatMap( file =>
		[ ...readFileSync( join( INC, file ), 'utf8' ).matchAll( /assetUrl\(\s*'([^']+)'\s*\)/g ) ].map(
			match => match[ 1 ]
		)
	);

describe( 'assetUrl() paths', () => {
	it( 'finds the addressed images', () => {
		expect( addressed ).toContain( 'components/connection-screen/connect.webp' );
	} );

	// Mirrors the glob and exclusion in bin/copy-raster-images.mjs.
	it.each( addressed )( '%s is copied into build/images', path => {
		expect( existsSync( join( INC, path ) ) ).toBe( true );
		expect( path ).toMatch( /\.(webp|png)$/ );
		expect( path.split( '/' ) ).not.toContain( 'stories' );
	} );
} );
