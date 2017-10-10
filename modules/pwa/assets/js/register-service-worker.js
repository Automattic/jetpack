/*jshint es5: true */
/* global console, pwa_vars */

'use strict;';
(function () {
    // install service worker
    if ('serviceWorker' in navigator) {
        // TODO - allow this URL to be customized
        navigator.serviceWorker.register( pwa_vars.service_worker_url, {
            scope: '/'
        }).then(function(reg) {
            // registration worked
            console.log('Registration succeeded. Scope is ' + reg.scope);
        }).catch(function(error) {
            // registration failed
            console.log('Registration failed with ' + error);
        });
    }
})();