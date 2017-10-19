/* jshint esversion: 6 */
/* global self, caches, console, Promise, Request, Headers, pwa_vars_json */

var CACHE = 'cache-v1';
var pwa_vars = pwa_vars_json;
var admin_regex = new RegExp( pwa_vars.admin_url );
var site_regex = new RegExp( pwa_vars.site_url );

// On install, cache some resources.
self.addEventListener('install', function( event ) {
	console.log('The service worker is being installed.');

	// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting
	// no need for a waiting worker to wait for a running one to
	// complete - let's just take over
	self.skipWaiting();

    // Ask the service worker to keep installing until the returning promise
    // resolves.
    event.waitUntil( precache() );
});

self.addEventListener('activate', function( event ) {
    console.log('Service Worker activating.');

	// https://developers.google.com/web/updates/2017/02/navigation-preload
	if ( self.registration.navigationPreload ) {
		event.waitUntil( self.registration.navigationPreload.enable() );
	}

	// Remove old caches
    event.waitUntil(
        caches.keys().then( function( cacheNames ) {
            return Promise.all( cacheNames.map( function( key ) {
                if( key !== CACHE ) {
                    console.log( 'Service Worker: Removing Old Cache', key );
                    return caches.delete( key );
                }
            } ) );
        })
	);

	// this claims any clients, EVEN ones which were loaded before this service
	// worker started (as long as they're in scope), so that subsequent requests
	// go through our fetch listener
    return self.clients.claim();
});

// On fetch, try the cache but if there's a miss try loading the content
self.addEventListener('fetch', function (evt) {
    if ( shouldCacheRequest( evt.request ) ) {
		if ( isExternalAsset( evt.request.url ) ) {
			evt.request.mode = 'no-cors';
		}
        evt.respondWith( fetchAndCacheAndRevalidate( evt ) );
	}
});

function isExternalAsset( url ) {
	return ! site_regex.test( url ) && ! url.match(/^\/[^\/]/);
}

// check if a response is expired
function responseShouldUpdate( response ) {
	var contentTypesNotUpdateRegex = /^(font\/woff2)/;
	var contentType = response.headers.get('content-type');
	if ( contentType && contentType.match( contentTypesNotUpdateRegex ) ) {
		return false;
	}
	return true; // for now, always try to update
}

function fetchAndCacheAndRevalidate( event ) {
	const request = event.request;
    // open cache
    return caches.open(CACHE).then( function( cache ) {
		// find in cache

		return cache.match( request )
			.then( function( response ) {
				// only do more work if we don't already have a response
				if ( response ) {
					if ( responseShouldUpdate( response ) ) {
						// tries to create a special request that checks eTags, last modified etc.
						var modifiedResourceRequest = getModifiedResourceRequest( request.clone(), response );

						event.waitUntil(
							// update from site
							fetch( modifiedResourceRequest )
								.then( function( networkResponse ) {
									if ( 200 === networkResponse.status ) {
										cache.put( modifiedResourceRequest, networkResponse );

										// notify all clients running the page to update
										updateAllClients( modifiedResourceRequest.url, networkResponse );
									}
									// TODO - update browser window with new content
								} )
						);
					}
					return response;
				}

				if ( event.preloadResponse ) {
					return event.preloadResponse;
				}

				return false;
			} )
			.then( function( response ) {
				if ( response ) {
					return response;
				}

				return fetch( request )
					.then( function( networkResponse ) {
						// put in cache if we're allowed to
						if ( shouldCacheResponse( request, networkResponse ) ) {
							cache.put( request, networkResponse.clone() );
						}
						return networkResponse;
					})
					.catch( function( err ) {
						console.warn('failed to fetch '+request.url);
						console.warn( err );
						return err;
					});
			})
			.catch( function( err ) {
				console.warn('failed to fetch '+request.url);
				console.warn( err );
				return err;
			} );
    });
}

function updateAllClients( url, response ) {
	// inject a page and/or resource into any page displaying it

	// for now, just HTML documents!

	self.clients.matchAll({
		type: 'window'
	}).then( ( allClients ) => {
		for (const client of allClients) {
			const clientUrl = new URL( client.url );
			const responseUrl = new URL( url );

			if ( clientUrl.pathname === responseUrl.pathname ) {
				client.focus();
				client.postMessage({
					msg: 'Hey I just got a fetch from you!',
					url: response.url
				});
				break;
			}
		}
	} );
}

function getModifiedResourceRequest( request, response ) {
	// CORS messes with this because it might limit the headers we can send
	if ( isExternalAsset( request.url ) ) {
		return request;
	}

	var checkModifiedHeaders = new Headers();
	for (var kv of request.headers.entries()) {
		checkModifiedHeaders.append( kv[0], kv[1] );
	}

	// get eTag from previous response
	var eTag = response.headers.get( 'ETag' );
	if ( eTag ) {
		checkModifiedHeaders.append( 'If-None-Match', eTag );
	}

	// check last-modified and date headers, only retrieve if changed since
	var lastModified = response.headers.get( 'Last-Modified' );
	if ( ! lastModified ) {
		lastModified = response.headers.get( 'Date' );
	}

	if ( lastModified ) {
		checkModifiedHeaders.append( 'If-Modified-Since', lastModified );
	}

	var newRequest = new Request(
		request,
		{
			headers: checkModifiedHeaders,
			mode: 'same-origin', // is no-cors by default, which discards cache control headers like If-Modified-Since
		}
	);

	return newRequest;
}

// having this function allows us to shortcut checking the cache,
// but we also have shouldCacheResponse which is able to look more deeply at what was returned.
// so it's possible that this should go away - I don't know how expensive cache checks are on most browsers.
function shouldCacheRequest( request ) {
	// if the request is for a wp-admin asset, or made from within wp-admin, ignore!
	if ( admin_regex.test( request.url ) || admin_regex.test( request.referrer ) || request.url === pwa_vars.sw_config_url ) {
		return false;
	}

    if ( request.method !== 'GET' ) {
        return false;
    }

    // get file extension using awful hackery, since we don't know response mime type before fetching
    var extension = request.url.split(/\#|\?/)[0].split('/').pop().split('.').pop();

    if ( extension.length > 0 && ! ['js', 'css', 'html', 'woff2', 'jpg', 'png'].includes( extension ) ) {
        return false;
    }

    return true;
}

// for now, only cache OK responses to GET requests that are HTML, CSS, JS
function shouldCacheResponse( request, response ) {
	if ( false === response ) {
		return false;
	}

	if ( 'opaque' === response.type ) {
		// shortcut and return true for any opaque response (cross-origin)
		return true;
	}

	if ( admin_regex.test( request.url ) ) {
		return false;
	}

    if ( request.method !== 'GET' ) {
        return false;
    }

    if ( ! response.ok ) {
        return false;
    }

    var validContentTypesRegex = /^(text\/html|application\/javascript|text\/css|image\/jpeg|image\/png|font\/woff2)/;

    if ( ! validContentTypesRegex.test( response.headers.get( 'content-type' ) ) ) {
        return false;
    }

    return true;
}

// Open a cache and use `addAll()` with an array of assets to add all of them
// to the cache. Return a promise resolving when all the assets are added.
// Right now, this doesn't check if assets are in the cache - it just loads them regardless
function precache() {
	// Load configuration from server
	return fetch( pwa_vars.sw_config_url )
		.then( function( response ) {
			return response.json().then( function( json ) {

				// prefetch assets
				return caches.open(CACHE).then( function( cache ) {
					var localAssets = json.assets.filter( function ( url ) {
						// starts with site URL or is relative path
						return ! isExternalAsset( url );
					} );

					var remoteAssets = json.assets.filter( function ( url ) {
						return isExternalAsset( url );
					} );

					// create a unified list of promises to resolve
					var requests = remoteAssets.map( ( assetUrl )  => {
						const request = new Request(assetUrl, { mode: 'no-cors' });
						return fetch( request ).then( response => cache.put( request, response ) );
					} );

					requests.push( cache.addAll( localAssets ) );

					// resolve all assets
					return Promise.all( requests );
				} );
			} );
		})
		.catch( function( err) {
			console.warn(err);
		});
}

// function refresh(response) {
//     if (!response) {
//         return Promise.reject('empty-response');
//     }
//     return self.clients.matchAll().then(function (clients) {
//         clients.forEach(function (client) {
//             var message = {
//                 type: 'refresh',
//                 url: response.url,
//                 eTag: response.headers.get('ETag')
//             };
//             client.postMessage(JSON.stringify(message));
//         });
//     });
// }

/**
 * Notifications
 */

self.addEventListener('notificationclose', function(e) {
	var notification = e.notification;
	var primaryKey = notification.data.primaryKey;

	console.log('Closed notification: ' + primaryKey);
});

self.addEventListener('notificationclick', function(e) {
	var notification = e.notification;
	var primaryKey = notification.data.primaryKey;
	var action = e.action;

	console.log('Clicked notification: ' + primaryKey);

	if ( action === 'close' ) {
		notification.close();
	} else {
		// TODO: actual URL
		self.clients.openWindow( pwa_vars.site_url );
		notification.close();
	}
});

/**
 * Push
 */
self.addEventListener('push', function(e) {
	var body;

	if (e.data) {
		console.warn(e.data);
		body = e.data.text();
	} else {
		body = 'Push message no payload';
	}

	var options = {
		body: body,
		icon: pwa_vars.site_icon,
		vibrate: [100, 50, 100],
		data: {
		dateOfArrival: Date.now(),
		primaryKey: '2'
		},
		actions: [
		{action: 'explore', title: 'Explore this new world',
			icon: pwa_vars.images_url + 'checkmark.png'},
		{action: 'close', title: 'Close',
			icon: pwa_vars.images_url + 'xmark.png'}
		]
	};
	e.waitUntil(
		self.registration.showNotification('Hello world!', options)
	);
});
