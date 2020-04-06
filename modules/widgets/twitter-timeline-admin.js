jQuery( function( $ ) {
	function twitterWidgetTypeChanged( widgetTypeSelector ) {
		var selectedType = $( widgetTypeSelector ).val();
		$( widgetTypeSelector )
			.closest( '.jetpack-twitter-timeline-widget-type-container' )
			.next( '.jetpack-twitter-timeline-widget-id-container' )
			.find( 'label' )
			.css( 'display', function() {
				var labelType = $( this ).data( 'widget-type' );
				if ( selectedType === labelType ) {
					return '';
				} else {
					return 'none';
				}
			} );
	}

	// We could either be in wp-admin/widgets.php or the Customizer.
	var $container = $( '#customize-controls' );
	if ( ! $container.length ) {
		$container = $( '#wpbody' );
	}

	// Observe widget settings for 'change' events of the 'type' property for
	// current and future Twitter timeline widgets.
	$container.on( 'change', '.jetpack-twitter-timeline-widget-type', function() {
		twitterWidgetTypeChanged( this );
	} );

	// Set the labels for currently existing widgets (including the "template"
	// version that is copied when a new widget is added).
	$container.find( '.jetpack-twitter-timeline-widget-type' ).each( function() {
		twitterWidgetTypeChanged( this );
	} );
} );
