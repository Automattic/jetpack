import childProcess from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import url from 'node:url';
import mimeTypes from 'mime-types';

/* eslint-disable no-console, no-process-exit */

if ( process.argv[ 2 ] !== 'child' ) {
	const cp = childProcess.fork( url.fileURLToPath( import.meta.url ), [ 'child' ], {
		detached: true,
		stdio: [ 'ignore', 'inherit', 'inherit', 'ipc' ],
	} );
	cp.on( 'exit', code => process.exit( code ) );
	cp.on( 'message', m => {
		if ( m === 'ok' ) {
			console.log( `PID: ${ cp.pid }` );
			process.exit( 0 );
		} else {
			console.log( m );
		}
	} );
} else {
	const baseDir = url.fileURLToPath( new URL( '../docs', import.meta.url ) );

	http
		.createServer( function ( request, response ) {
			const errhandler = e => {
				if ( e.code === 'ENOENT' ) {
					response.writeHead( 404 );
				} else if ( e.code === 'EISDIR' || e.code === 'EACCES' ) {
					response.writeHead( 403 );
				} else {
					console.log( e.stack );
					if ( ! response.headersSent ) {
						response.writeHead( 500 );
					}
				}
				response.end();
			};

			try {
				const requestUrl = new URL( request.url, `http://${ request.headers.host }` );

				// need to use path.normalize so people can't access directories underneath baseDir
				const fsPath = path.join( baseDir, path.normalize( requestUrl.pathname ) );

				const fileStream = fs.createReadStream( fsPath );
				fileStream.pipe( response );
				fileStream.on( 'open', () => {
					response.setHeader( 'content-type', mimeTypes.contentType( path.extname( fsPath ) ) );
				} );
				fileStream.on( 'error', errhandler );
			} catch ( e ) {
				errhandler( e );
			}
		} )
		.listen( 6006, () => {
			process.send?.( 'ok' );
		} );
}
