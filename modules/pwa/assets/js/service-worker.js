/*jshint es5: true */
/* global self, caches, console, Promise, pwa_vars_json */

var CACHE = 'cache-v1';
var pwa_vars = pwa_vars_json;
var admin_regex = new RegExp( pwa_vars.admin_url );

// On install, cache some resources.
self.addEventListener('install', function (evt) {
    console.log('The service worker is being installed.');

    // Ask the service worker to keep installing until the returning promise
    // resolves.
    evt.waitUntil(precache());
});

// Remove old caches on activate
self.addEventListener('activate', function(event) {
    console.log('Service Worker activating.');

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
    return self.clients.claim();
});

// On fetch, try the cache but if there's a miss try loading the content
self.addEventListener('fetch', function (evt) {
    // console.log('The service worker is serving the asset ' + evt.request.url);

    if ( shouldCacheRequest( evt.request ) ) {
        evt.respondWith( fetchAndCache( evt.request ) );
    } else {
        evt.respondWith( fetch( evt.request ) );
    }
});

function fetchAndCache( request ) {
    // open cache
    return caches.open(CACHE).then( function( cache ) {
        // find in cache
        return cache.match( request ).then( function( response ) {
            // fall back to network if no response
			return response || fetch( request )
				.catch( function( err ) {
					console.warn( err );
					return false;
				} )
				.then( function( networkResponse ) {
					// put in cache if we're allowed to
					if ( shouldCacheResponse( request, networkResponse ) ) {
						cache.put( request, networkResponse.clone() );
					}
					return networkResponse;
				});
        });
    });
}

// having this function allows us to shortcut checking the cache,
// but we also have shouldCacheResponse which is able to look more deeply at what was returned.
// so it's possible that this should go away - I don't know how expensive cache checks are on most browsers.
function shouldCacheRequest( request ) {
	if ( admin_regex.test( request.url ) ) {
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

	if ( admin_regex.test( request.url ) ) {
		return false;
	}

    if ( request.method !== 'GET' ) {
        return false;
    }

    if ( ! response.ok ) {
        return false;
    }

    var validContentTypesRegex = /^(text\/html|application\/javascript|text\/css|image\/jpeg|image\/png)/;

    if ( ! validContentTypesRegex.test( response.headers.get( 'content-type' ) ) ) {
        return false;
    }

    return true;
}

// Open a cache and use `addAll()` with an array of assets to add all of them
// to the cache. Return a promise resolving when all the assets are added.
function precache() {
    return caches.open(CACHE).then(function (cache) {
        //   console.log("caching");
        return cache.addAll([
            '/' // home page
            //   './asset'
        ]);
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
