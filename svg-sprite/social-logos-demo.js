/**
 * Gridicons Demo page JS
 */
(function( $ ){
    // Kick things off
    $( document ).ready( function() {
        initEvents();
    });
    function initEvents() {
        var $rows = $('#icons').find('svg');
        // When you click on an icon
        $rows.on( 'click', function() {
            var attr = $( this ).find( 'use' ).attr( 'xlink:href' ),
                cssClass = attr.split( '#' )[1];

            suggestCode( attr, cssClass );

        });
    }
    function suggestCode( attr, cssClass ) {

		var fileLocation = '//s1.wp.com/i/gridicons.svg',	// @todo: needs to be updated with final location
            suggestion = '<svg class="social-logo '+ cssClass +'" width="24px" height="24px"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="' + fileLocation + attr + '"></use></svg>';

        window.prompt( "Copy this, paste in your HTML.\n\nRemember to update the social-logo.svg file as well!", suggestion );
    }
})( jQuery );