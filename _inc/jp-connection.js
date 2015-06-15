/* global jpConnection, jQuery */

(function( $, jpConnection ) {

    ///////////////////////////////////////
    // INIT
    ///////////////////////////////////////

    var data = {
            'jetpackIsActive'    : jpConnection.jetpackIsActive,
            'showPrimaryUserRow' : jpConnection.showPrimaryUserRow,
            'otherAdminsLinked'  : jpConnection.otherAdminsLinked,
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
        });

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
        });
    }

})( jQuery, jpConnection );