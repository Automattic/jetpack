/*jshint es5: true */
/* global console */

// detect and show offline/online status
( function () {
  'use strict';

  var body = document.querySelector( 'body' );

  //After DOM Loaded
  document.addEventListener( 'DOMContentLoaded', function( event ) {
    //On initial load to check connectivity
    if ( ! navigator.onLine ) {
      updateNetworkStatus();
    }

    window.addEventListener( 'online', updateNetworkStatus, false );
    window.addEventListener( 'offline', updateNetworkStatus, false );
  } );

  //To update network status
  function updateNetworkStatus() {
    if ( navigator.onLine ) {
      body.classList.remove( 'jetpack__offline' );
    }
    else {
      body.classList.add( 'jetpack__offline' );
    }
  }
} )();