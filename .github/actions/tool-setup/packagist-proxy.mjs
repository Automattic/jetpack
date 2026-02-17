#!/usr/bin/env node

/**
 * Transparent proxy for repo.packagist.org
 *
 * This implements a simple transparent proxy for packagist.org that short-circuits
 * requests using if-modified-since if a previous response has gone through the proxy
 * with a last-modified header.
 *
 * Note it needs to be passed paths to certificate key and crt files.
 */

import fs from 'node:fs';
import http2 from 'node:http2';

const upstreamHost = 'https://repo.packagist.org';

const server = http2.createSecureServer( {
	key: fs.readFileSync( process.argv[ 2 ] ),
	cert: fs.readFileSync( process.argv[ 3 ] ),
	allowHTTP1: true,
} );

// http2 needs a global-ish client object.
let http2Client;

const dateRegex =
	/^\s*(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat), (\d{2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4}) (\d{2}):(\d{2}):(\d{2}) GMT\s*$/;
// prettier-ignore
const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
const parseDate = v => {
	const m = dateRegex.exec( v );
	return m ? Date.UTC( m[ 3 ], months[ m[ 2 ] ], m[ 1 ], m[ 4 ], m[ 5 ], m[ 6 ] ) : null;
};

let ctr = 0;
const lastModifiedCache = {};
const fourOhFourCache = {};
const inflight = {};

/**
 * Ensure a value is an array.
 *
 * @param {*} v - Value.
 * @return {Array} Value, wrapped in an array if it wasn't one already.
 */
function toArr( v ) {
	return Array.isArray( v ) ? v : [ v ];
}

server.on( 'request', async ( req, res ) => {
	const reqid = ++ctr;
	console.log( `<<[${ reqid }] ${ req.method } ${ req.url } HTTP/${ req.httpVersion }` );

	// To avoid multiple requests in flight for the same package, each request stores a promise and then waits on any previous request.
	const waitfor = inflight[ req.url ];
	const { promise: mypromise, resolve: mypromiseResolve } = Promise.withResolvers();
	const mypromiseDone = () => {
		if ( inflight[ req.url ] === mypromise ) {
			delete inflight[ req.url ];
		}
		res.removeListener( 'close', mypromiseDone );
		res.removeListener( 'finish', mypromiseDone );
		res.removeListener( 'error', mypromiseDone );
		mypromiseResolve();
	};
	res.on( 'close', mypromiseDone );
	res.on( 'finish', mypromiseDone );
	res.on( 'error', mypromiseDone );
	mypromise.reqid = reqid;
	inflight[ req.url ] = mypromise;
	if ( waitfor ) {
		console.log( `!![${ reqid }] Waiting for request ${ waitfor.reqid }` );
		await waitfor;
	}

	const headers = Object.fromEntries(
		Object.entries( req.headers ).filter( ( [ k ] ) => ! k.startsWith( ':' ) )
	);
	delete headers.host;
	delete headers.connection;

	/*
	for ( const [ k, vv ] of Object.entries( headers ) ) {
		for ( const v of toArr( vv ) ) {
			console.log( `<<[${ reqid }] ${ k }: ${ v }` );
		}
	}
	/**/

	// Check if-modified-since if we have cached a last-modified date.
	if ( lastModifiedCache[ req.url ] && headers[ 'if-modified-since' ] ) {
		for ( const v of toArr( headers[ 'if-modified-since' ] ) ) {
			const ts = parseDate( v );
			if ( ts <= lastModifiedCache[ req.url ] ) {
				console.log(
					`!![${ reqid }] Replying with cached timestamp ${ lastModifiedCache[ req.url ] }`
				);
				const now = new Date().toUTCString();
				const lm = new Date( lastModifiedCache[ req.url ] ).toUTCString();

				console.log( `>>[${ reqid }] HTTP/${ req.httpVersion } 304 Not Modified` );
				/*
				console.log( `>>[${ reqid }] date: ${ now }` );
				console.log( `>>[${ reqid }] last-modified: ${ lm }` );
				/**/

				mypromiseDone(); // No need to wait for it to send.
				res.writeHead( 304, {
					date: now,
					'last-modified': lm,
				} );
				res.end();
				return;
			}
		}
	}

	if ( fourOhFourCache[ req.url ] ) {
		console.log( `!![${ reqid }] Replying with cached 404` );
		const now = new Date().toUTCString();

		console.log( `>>[${ reqid }] HTTP/${ req.httpVersion } 404 Not Found` );
		/*
		console.log( `>>[${ reqid }] date: ${ now }` );
		/**/

		mypromiseDone(); // No need to wait for it to send.
		res.writeHead( 404, {
			date: now,
		} );
		res.end();
		return;
	}

	if ( ! http2Client ) {
		http2Client = http2.connect( upstreamHost, {
			// https://packagist.org/apidoc suggests a max of 20 concurrent requests.
			peerMaxConcurrentStreams: 20,
		} );

		const onclose = () => {
			console.log( '!![*] HTTP client closed.' );
			http2Client = null;
		};

		// If there's an http2 error, clean up so the next request tries opening a new connection.
		http2Client.on( 'error', onclose );
		http2Client.on( 'frameError', onclose );
		// Same if it's closed.
		http2Client.on( 'close', onclose );
	}

	console.log( `!![${ reqid }] Proxying to ${ upstreamHost }/${ req.url.replace( /^\//, '' ) }` );
	// If you're looking at this because some "security" scanner complained
	// about this code using user input to build the request, it's fine.
	// This proxy only runs on localhost inside of CI, any attacker could just
	// make their bad request directly.
	const upstreamReq = http2Client.request( {
		[ http2.constants.HTTP2_HEADER_METHOD ]: req.method,
		[ http2.constants.HTTP2_HEADER_PATH ]: req.url,
		...headers,
	} );

	let sentResponse = false;
	upstreamReq.on( 'response', upstreamHeaders => {
		const status = upstreamHeaders[ http2.constants.HTTP2_HEADER_STATUS ];
		console.log( `>>[${ reqid }] HTTP/${ req.httpVersion } ${ status }` );

		sentResponse = true;
		const resHeaders = Object.fromEntries(
			Object.entries( upstreamHeaders ).filter( ( [ k ] ) => ! k.startsWith( ':' ) )
		);
		delete resHeaders.connection;
		for ( const [ k, vv ] of Object.entries( resHeaders ) ) {
			for ( const v of toArr( vv ) ) {
				/*
				console.log( `>>[${ reqid }] ${ k }: ${ v }` );
				/**/
				if ( k === 'last-modified' ) {
					const ts = parseDate( v );
					if ( ts ) {
						console.log( `!![${ reqid }] Caching timestamp ${ ts }` );
						lastModifiedCache[ req.url ] = ts;
					}
				}
			}
		}
		if ( status === 404 ) {
			fourOhFourCache[ req.url ] = true;
		}

		mypromiseDone(); // No need to wait for it to send.
		res.writeHead( status, resHeaders );
		upstreamReq.pipe( res );
		res.on( 'finish', cleanup );
	} );

	upstreamReq.on( 'error', e => {
		console.log( `!![${ reqid }] Network error:`, e );

		if ( sentResponse ) {
			console.log( `!![${ reqid }] Already got a (partial) response, just closing.` );
			res.end();
			return;
		}
		sentResponse = true;

		const now = new Date().toUTCString();
		console.log( `>>[${ reqid }] HTTP/${ req.httpVersion } 502 Bad Gateway` );
		/*
		console.log( `>>[${ reqid }] date: ${ now }` );
		console.log( `>>[${ reqid }] content-type: text/plain` );
		/**/
		res.writeHead( 502, {
			date: now,
			'content-type': 'text/plain',
		} );
		res.end( 'A network error was encountered when fetching the upstream resource.\r\n' );
		cleanup();
	} );

	const onclose = () => {
		if ( ! upstreamReq.closed && ! upstreamReq.destroyed ) {
			upstreamReq.close( http2.constants.NGHTTP2_CANCEL );
		}
		cleanup();
	};
	res.on( 'close', onclose );

	const cleanup = () => {
		res.removeListener( 'close', onclose );
		res.removeListener( 'finish', cleanup );
	};

	req.pipe( upstreamReq );
} );

server.listen( 3129, 'localhost', () => {
	const addr = server.address();
	console.log( `Server listening on ${ addr.address }:${ addr.port }` );
} );
