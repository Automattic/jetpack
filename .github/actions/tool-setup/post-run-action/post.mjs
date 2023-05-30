import * as fs from 'node:fs';
import * as path from 'node:path';

/* eslint-disable no-console */

console.log( '::group::Composer 304 short-circuiting proxy log' );

const file = path.join( process.env.HOME, 'proxy.log' );
try {
	const s = fs.createReadStream( file );
	await new Promise( ( resolve, reject ) => {
		s.on( 'close', resolve );
		s.on( 'error', reject );
		s.pipe( process.stdout, { end: false } );
	} );
} catch ( e ) {
	console.error( `\nFailed to read ${ file }:`, e );
}

console.log( '\n::endgroup::' );
