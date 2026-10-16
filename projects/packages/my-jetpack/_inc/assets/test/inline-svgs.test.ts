import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as inlineSvgs from '../inline-svgs';

const INC = join( __dirname, '../..' );
const sources: Record< string, string > = JSON.parse(
	readFileSync( join( INC, '../bin/inline-svgs.json' ), 'utf8' )
);

describe( 'inline-svgs', () => {
	it( 'exports exactly the listed SVGs', () => {
		expect( Object.keys( inlineSvgs ).sort() ).toEqual( Object.keys( sources ).sort() );
	} );

	it.each( Object.entries( sources ) )( '%s matches its source', ( name, relative ) => {
		const source = readFileSync( join( INC, relative ) ).toString( 'base64' );

		expect( inlineSvgs[ name as keyof typeof inlineSvgs ] ).toBe(
			`data:image/svg+xml;base64,${ source }`
		);
	} );
} );
