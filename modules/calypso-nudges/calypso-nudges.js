( function( $ ) {
    $( document ).on( 'click', '.jetpack-calypso-nudge button', function( event ) {
        // Remove the nudge and record the dismissal stat.
        event.preventDefault();
        $( this ).closest( '.jetpack-calypso-nudge' ).remove();
        $.ajax( {
            url: ajaxurl,
            data: {
                action: 'calypso_nudges_register_dismiss_stats',
                cookieGroup: jetpackCalypsoNudges.cookieGroup,
                nonce: jetpackCalypsoNudges.nonce
            }
        } );

        // Get an expiry date of about six months.
        var expires = new Date( new Date().getTime() + 15778458000 );

        // Create the updated cookie.
        document.cookie = 'jetpack_nudge_dismissed_' + jetpackCalypsoNudges.cookieGroup + '=1;expires=' + expires.toUTCString();
    } );
} )( jQuery );