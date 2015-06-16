/* global jpConnection, jQuery */

(function( $, jpConnection ) {

    ///////////////////////////////////////
    // INIT
    ///////////////////////////////////////

    var data = {
            'jetpackIsActive'    : jpConnection.jetpackIsActive,
            'showPrimaryUserRow' : jpConnection.showPrimaryUserRow,
            'otherAdminsLinked'  : jpConnection.otherAdminsLinked,
            'isMasterHere'       : jpConnection.isMasterHere,
            'stats_urls'         : jpConnection.my_jetpack_stats_urls,
            'masterUser'         : jpConnection.masterUser,
            'masterUserLink'     : jpConnection.masterUser.masterUserLink,
            'currentUser'        : jpConnection.currentUser
        };

    $( document ).ready(function () {
        renderPageTemplate( data );

        // Set someone as master.
        $( '#change-primary-btn' ).click( function() {

            if ( '1' !== data.otherAdminsLinked ) {
                window.alert( jpConnection.alertText );
                return;
            }

            $( '#change-primary-btn' ).hide();
            $( '#user-list' ).show();
            $( '#save-primary-btn' ).show();

            //Log My Jetpack event "change primary" in MC Stats
            new Image().src = data.stats_urls.change_primary;
        });

        // Hide the success message after a little bit
        setTimeout( function(){
            jQuery( '.jetpack-message:not( .stay-visible, .jetpack-err )' ).hide( 600 );
        }, 6000);

    });

    function renderPageTemplate( data ) {
        $( '#my-jetpack-page-template' ).html( wp.template( 'connection-page' )( data ) );
        // Save the focused element, then shift focus to the modal window.
        confirmJetpackDisconnect();
    }

    /*
     The function used to display the disconnect confirmation and support buttons
     */
    function confirmJetpackDisconnect() {
        $( '#jetpack-disconnect' ).click( function() {
            $( '#jetpack-disconnect-content' ).show();
            $( '#my-jetpack-content, .disconnect' ).hide();

            //Log My Jetpack event "wants to disconnect Jetpack" in MC Stats
            new Image().src = data.stats_urls.disconnect_site;
        });

		$( '#jetpack-disconnect-content #support-no-disconnect' ).click( function() {
			//Log My Jetpack event "get support instead of disconnecting site" in MC Stats
			new Image().src = data.stats_urls.support_no_disconnect;
		});

		$( '#jetpack-disconnect-content #confirm-disconnect' ).click( function() {
			//Log My Jetpack event "confirm the disconnecting of a the site" in MC Stats
			new Image().src = data.stats_urls.confirm_disconnect;
		});
    }

})( jQuery, jpConnection );