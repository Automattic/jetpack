/*jshint es5: true */
/* global self, caches, console, JSON, Promise */

var CACHE = 'cache-only';

// On install, cache some resources.
self.addEventListener('install', function (evt) {
    console.log('The service worker is being installed.');

    // Ask the service worker to keep installing until the returning promise
    // resolves.
    evt.waitUntil(precache());
});

// On fetch, try the cache but if there's a miss try loading the content
self.addEventListener('fetch', function (evt) {
    console.log('The service worker is serving the asset ' + evt.request.url);

    evt.respondWith(
        caches.open(CACHE).then( function ( cache ) {
            return cache.match( evt.request ).then(function (response) {
                var fetchPromise = fetch(evt.request).then(function (networkResponse) {
                    cache.put( evt.request, networkResponse.clone() );
                    return networkResponse;
                })

                return response || fetchPromise;
            })
        })
    );
});

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