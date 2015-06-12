/* global jpConnection, jQuery, confirm */

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

            if ( false == data.otherAdminsLinked ) {
                alert( 'You must link another admin account before switching primary account holders.' );
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