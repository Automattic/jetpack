/* global jpConnection, jQuery, confirm */

(function( $, jpConnection ) {

    ///////////////////////////////////////
    // INIT
    ///////////////////////////////////////
    var data = {
            'connectionLogic'    : jpConnection.connectionLogic,
            'showPrimaryUserRow' : jpConnection.showPrimaryUserRow,
            'masterComData'      : jpConnection.masterComData,
            'userComData'        : jpConnection.userComData,
            'userGrav'           : jpConnection.userGrav,
            'masterUserGrav'     : jpConnection.masterUserGrav,
            'potentialPrimaries' : jpConnection.potentialPrimaries
        };

    $( document ).ready(function () {
        renderPageTemplate( data );

        // Set someone as master.
        $( '#change-primary-btn' ).click( function() {

            if ( false == data.potentialPrimaries ) {
                alert( 'You must link another admin account before switching primary account holders.' );
                return;
            }

            $( '#change-primary-btn' ).hide();
            $( '#user-list' ).show();
            $( '#save-primary-btn' ).show();
        });

    });

    function renderPageTemplate( data ) {
        $( '#my-connection-page-template' ).html( wp.template( 'connection-page' )( data ) );
        // Save the focused element, then shift focus to the modal window.
        confirmJetpackDisconnect();
    }

    /*
     The function used to display the disconnect confirmation and support buttons
     */
    function confirmJetpackDisconnect() {
        $( '#jetpack-disconnect' ).click( function() {
            $( '#jetpack-disconnect-content' ).show();
            $( '#my-connection-page-template' ).hide();
        });
    }

})( jQuery, jpConnection );