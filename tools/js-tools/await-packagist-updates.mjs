#!/usr/bin/env node

/* eslint-disable no-console, no-process-exit */

import events from 'node:events';
import http2 from 'node:http2';
import path from 'node:path';
import timers from 'node:timers/promises';
import chalk from 'chalk';
import Listr from 'listr';
import semver from 'semver';

if ( process.argv.length <= 2 ) {
	const name = path.relative( process.cwd(), process.argv[ 1 ] );
	console.log( `USAGE: ${ name } some/package=1.2.3 another/package=1.2.4 ...` );
	process.exit( 1 );
}

// Avoids a warning about too many listeners on the http2Client and on the abort signal.
events.setMaxListeners( process.argv.length + 10 );

// Used for a quick exist when an error happens.
const aborter = new AbortController();

// http2 needs a global-ish client object.
let http2Client;

// Process args into listr tasks.
const listr = new Listr( [], { concurrent: true } );
for ( const pkg of process.argv.slice( 2 ) ) {
	const m = pkg.match(
		/^([a-z0-9]+(?:[_.-][a-z0-9]+)*\/[a-z0-9]+(?:(?:[_.]|-{1,2})[a-z0-9]+)*)=(.+)$/
	);
	if ( ! m ) {
		console.error(
			chalk.red( `Invalid parameter "${ pkg }". Parameters should look like "some/package=1.2.3".` )
		);
		process.exit( 1 );
	}
	if ( ! semver.validRange( m[ 2 ] ) ) {
		console.error( chalk.red( `Invalid semver range "${ m[ 2 ] }"` ) );
		process.exit( 1 );
	}
	listr.add( pollPackagist( m[ 1 ], m[ 2 ] ) );
}

// Run the tasks.
try {
	await listr.run();
} catch ( e ) {
	console.log( chalk.bgRed( e ) );
	process.exitCode = 1;
}

// Listr finished one way or another. Clean up by aborting anything still in progress then closing the http2Client.
aborter.abort();
if ( http2Client ) {
	const cl = http2Client;
	http2Client = null;
	cl.close();
}

/**
 * Poll packagist until the specified version of the named package is available.
 *
 * @param {string} name - Package name to poll.
 * @param {string} versionRange - Version number/range to look for.
 * @returns {object} Listr task object.
 */
function pollPackagist( name, versionRange ) {
	const delay = 10 * 1000;
	const reqHeaders = {
		[ http2.constants.HTTP2_HEADER_METHOD ]: 'GET',
		[ http2.constants.HTTP2_HEADER_PATH ]: `/p2/${ name }.json`,
		'user-agent':
			'Automattic-packagist-poll/1.0 (Source: https://github.com/Automattic/jetpack/blob/trunk/tools/js-tools/await-packagist-updates.mjs)',
	};
	return {
		title: `${ name } ${ versionRange }`,
		task: async ( ctx, task ) => {
			while ( ! aborter.aborted ) {
				try {
					let req;
					// http2 isn't a promise-based API, so wrap in a promise ourselves and await it.
					const done = await new Promise( ( resolve, reject ) => {
						// Reject the promise with a fatal-flagged error.
						const fatal = m => {
							const e = new Error( m );
							e.fatal = true;
							reject( e );
						};

						// Reject the promise with a temporary failure.
						const tempfail = m => {
							reject( new Error( m ) );
						};

						// Open the http2 connection if that hasn't been done already.
						if ( ! http2Client ) {
							http2Client = http2.connect( 'https://repo.packagist.org', {
								// https://packagist.org/apidoc suggests a max of 20 concurrent requests.
								peerMaxConcurrentStreams: 20,
							} );

							// If there's an http2 error, clean up so the next task tries opening a new connection.
							http2Client.on( 'error', () => {
								http2Client = null;
							} );
						}

						// Probably the req itself will also error if there's a connection-level error, but the docs aren't clear on that.
						// So listen for that just in case, because hung promises are bad.
						// @see https://nodejs.org/api/http2.html#error-handling
						http2Client.on( 'error', reject );

						// Make the actual request.
						req = http2Client.request( reqHeaders, { signal: aborter.signal } );
						req.on( 'error', reject );
						req.on( 'response', resHeaders => {
							const status = resHeaders[ http2.constants.HTTP2_HEADER_STATUS ];

							// Some specific 4xx codes that indicate a probable perma-fail.
							if ( status === 404 ) {
								return fatal( `Package ${ name } does not exist (got 404 from packagist)` );
							}
							if ( status === 401 || status === 403 ) {
								return fatal( `Package ${ name } is private? (got ${ status } from packagist)` );
							}

							// Any other 4xx or 5xx is hopefully temporary.
							if ( status >= 400 ) {
								return tempfail( `HTTP error fetching ${ name }: ${ status }` );
							}

							// 304 Not Modified (due to the If-Modified-Since logic below).
							if ( status === 304 ) {
								return resolve( false );
							}

							// Any other 3xx is a redirect.
							if ( status >= 300 ) {
								return fatal(
									`Unexpected redirect fetching ${ name }: ${ status } => ${ resHeaders.location }`
								);
							}

							// Use the Last-Modified in an If-Modified-Since for future requests to save traffic.
							if ( resHeaders[ 'last-modified' ] ) {
								reqHeaders[ 'if-modified-since' ] = resHeaders[ 'last-modified' ];
							}

							// Any non-200 2xx is weird.
							if ( status !== 200 ) {
								return tempfail( `Got HTTP ${ status }` );
							}

							// Got a 200 response! Read and parse the body to see if a satisfactory version exists.
							req.setEncoding( 'utf8' );
							const chunks = [];
							req.on( 'data', chunk => {
								chunks.push( chunk );
							} );
							req.on( 'end', () => {
								try {
									const data = JSON.parse( chunks.join( '' ) );
									for ( const ver of data.packages[ name ] ) {
										const sver = semver.coerce( ver.version_normalized );
										if ( sver && semver.satisfies( sver, versionRange ) ) {
											task.title = `${ name } ${ ver.version }`;
											return resolve( ver.version );
										}
									}
								} catch ( e ) {
									return tempfail( `Invalid JSON: ${ e.message }` );
								}
								return resolve( false );
							} );
						} );
						req.end();
					} ).finally( () => {
						// Make sure the request actually gets closed whenever the promise settles.
						// We don't want hung connections waiting on us to read more data or something.
						if ( req && ! req.closed && ! req.destroyed ) {
							req.close( http2.constants.NGHTTP2_CANCEL );
						}
					} );

					// The poll succeeded. `done` indicates if it found the looked-for version or not.
					task.output = '';
					if ( done ) {
						return done;
					}
				} catch ( e ) {
					// The poll failed. Either throw a fatal or let it retry on a temp fail.
					if ( e.fatal ) {
						throw e;
					}
					task.output = e.message + ' (will retry)';
				}

				// Either we didn't find the version or there was a tempfail. Wait for the specified delay before looping to try again.
				await timers.setTimeout( delay, null, { signal: aborter.signal } );
			}
		},
	};
}
