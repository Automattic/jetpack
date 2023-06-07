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

/* eslint-disable no-console */

import * as fs from 'node:fs';
import * as https from 'node:https';

const upstreamHost = 'https://repo.packagist.org/';

const server = https.createServer( {
	key: fs.readFileSync( process.argv[ 2 ] ),
	cert: fs.readFileSync( process.argv[ 3 ] ),
} );

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

server.on( 'request', ( req, res ) => {
	const reqid = ++ctr;
	console.log( `<<[${ reqid }] ${ req.method } ${ req.url } HTTP/${ req.httpVersion }` );
	const headers = { ...req.headersDistinct };
	delete headers.host;
	delete headers.connection;

	/*
	for ( const [ k, vv ] of Object.entries( headers ) ) {
		for ( const v of vv ) {
			console.log( `<<[${ reqid }] ${ k }: ${ v }` );
		}
	}
	*/

	// Check if-modified-since if we have cached a last-modified date.
	if ( lastModifiedCache[ req.url ] && headers[ 'if-modified-since' ] ) {
		for ( const v of headers[ 'if-modified-since' ] ) {
			const ts = parseDate( v );
			if ( ts <= lastModifiedCache[ req.url ] ) {
				console.log( `!![${ reqid }] Replying with cached timestamp ${ ts }` );
				const now = new Date().toUTCString();
				const lm = new Date( lastModifiedCache[ req.url ] ).toUTCString();

				console.log( `>>[${ reqid }] HTTP/${ res.httpVersion ?? '1.1' } 304 Not Modified` );
				/*
				console.log( `>>[${ reqid }] date: ${ now }` );
				console.log( `>>[${ reqid }] last-modified: ${ lm }` );
				*/

				res.writeHead( 304, 'Not Modified', {
					date: now,
					'last-modified': lm,
				} );
				res.end();
				return;
			}
		}
	}

	// Make remote request.
	const upstreamUrl = upstreamHost + req.url.replace( /^\//, '' );
	console.log( `!![${ reqid }] Proxying to ${ upstreamUrl }` );
	const upstreamReq = https.request( upstreamUrl, {
		method: req.method,
		headers,
	} );

	let sentResponse = false;
	upstreamReq.on( 'response', upstreamRes => {
		console.log(
			`>>[${ reqid }] HTTP/${ upstreamRes.httpVersion } ${ upstreamRes.statusCode } ${ upstreamRes.statusMessage }`
		);

		sentResponse = true;
		const resHeaders = { ...upstreamRes.headersDistinct };
		delete resHeaders.connection;
		for ( const [ k, vv ] of Object.entries( resHeaders ) ) {
			for ( const v of vv ) {
				/*
				console.log( `>>[${ reqid }] ${ k }: ${ v }` );
				*/
				if ( k === 'last-modified' ) {
					const ts = parseDate( v );
					if ( ts ) {
						console.log( `!![${ reqid }] Caching timestamp ${ ts }` );
						lastModifiedCache[ req.url ] = ts;
					}
				}
			}
		}

		res.writeHead( upstreamRes.statusCode, upstreamRes.statusMessage, resHeaders );

		upstreamRes.pipe( res );

		res.on( 'finish', cleanup );
	} );

	upstreamReq.on( 'error', e => {
		console.log( `!![${ reqid }] Network error: ${ e }` );

		if ( sentResponse ) {
			console.log( `!![${ reqid }] Already got a (partial) response, just closing.` );
			res.end();
			return;
		}
		sentResponse = true;

		const now = new Date().toUTCString();
		console.log( `>>[${ reqid }] HTTP/${ res.httpVersion ?? '1.1' } 502 Bad Gateway` );
		/*
		console.log( `>>[${ reqid }] date: ${ now }` );
		console.log( `>>[${ reqid }] content-type: text/plain` );
		*/
		res.writeHead( 502, 'Bad Gateway', {
			date: now,
			'content-type': 'text/plain',
		} );
		res.end( 'A network error was encountered when fetching the upstream resource.\r\n' );
		cleanup();
	} );

	const onclose = () => {
		upstreamReq.abort();
		cleanup();
	};
	res.on( 'close', onclose );

	const cleanup = () => {
		res.removeListener( 'close', onclose );
		res.removeListener( 'finish', cleanup );
	};

	req.pipe( upstreamReq );
} );

server.listen( 3129, () => {
	const addr = server.address();
	console.log( `Server listening on ${ addr.address }:${ addr.port }` );
} );
