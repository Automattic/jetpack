/*jshint es5: true */
/* global console, pwa_vars, JSON */

'use strict;';
(function () {
    // install service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register( pwa_vars.service_worker_url, {
            scope: '/' // TODO - allow this path to be customized
        }).then(function(reg) {
            // registration worked
			console.log('Registration succeeded. Scope is ' + reg.scope);

			// check if we have a subscription
			reg.pushManager.getSubscription().then(function(sub) {
				if (sub === null) {
					// Update UI to ask user to register for Push
					console.log('Not subscribed to push service!');
				} else {
					// We have a subscription, update the database
					console.log('Subscription object: ', sub);
				}
			});

			// TODO: opt-in
			subscribeUser();

        }).catch(function(error) {
            // registration failed
            console.log('Registration failed with ' + error);
		});

		// listen for messages, e.g. when a stale resource has been updated
		navigator.serviceWorker.addEventListener('message', function( event ) {
			console.log(event.data.msg, event.data.url);
		});
	}

	// enable push - TODO hide behind a setting!
	// TODO - legacy shim e.g. https://github.com/nickdesaulniers/fxos-irc/blob/master/js/notification.js
	// if ('Notification' in window ) {
	// 	Notification.requestPermission( function( status ) {
	// 		if ( 'granted' === status ) {
	// 			console.log( 'Notification granted' );
	// 		}
	// 		console.log( 'Notification permission status:', status );
	// 	});
	// }
})();

// subscribe the user to PWA push notifications
// TODO create a widget or other UI for opting in to this?
function subscribeUser() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.getRegistration('/').then(function(reg) {
			reg.pushManager.subscribe({
				// TODO: set false for background updates? e.g. freshening content
				userVisibleOnly: true
			}).then(function(sub) {
				console.log( sub );
				console.log('Endpoint URL: ', sub.endpoint);
				console.log('posting to ', pwa_vars.create_subscription_api_url);
				jQuery
					.ajax( {
						type: 'POST',
						url: pwa_vars.create_subscription_api_url,
						contentType: 'application/json',
						data: JSON.stringify( sub.toJSON() )
					}  )
					.then( function( result ) {
						console.warn('Success:', result);
					} )
					.fail( function( err ) {
						console.warn('Fail: ', err );
					} );
			}).catch(function(e) {
				if (Notification.permission === 'denied') {
					console.warn('Permission for notifications was denied');
				} else {
					console.error('Unable to subscribe to push', e);
				}
			});
		});
	}
}