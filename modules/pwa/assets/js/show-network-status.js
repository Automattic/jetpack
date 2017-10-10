/*jshint es5: true */
/* global console */

// detect and show offline/online status
(function () {
    'use strict';

    var body;

    document.addEventListener('DOMContentLoaded', function (event) {
        body = document.querySelector('body');
        updateNetworkStatus();

        window.addEventListener('online', updateNetworkStatus, false);
        window.addEventListener('offline', updateNetworkStatus, false);
    });

    function updateNetworkStatus() {
        if (navigator.onLine) {
            body.classList.remove('jetpack__offline');
        }
        else {
            body.classList.add('jetpack__offline');
        }
    }
})();