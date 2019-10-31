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

	// To use the No Scrollbar” option, you should not specify a number of
	// tweets in the widget settings. Grey out the 'noscrollbar' option when
	// user sets 'tweet-limit'
	$container.on( 'input', '[id$="tweet-limit"]', function() {
		var inputFieldNames = [ 'chrome-noscrollbar', 'height' ];

		var tweet_limit_set = $( this ).val().length > 0;

		for ( var i = 0; i < inputFieldNames.length; i++ ) {
			var fieldName = inputFieldNames[ i ];
			var $input = $( this )
				.closest( '.widget-content' )
				.find( '[id$="' + fieldName + '"]' );

			var $label = $( this )
				.closest( '.widget-content' )
				.find( 'label[for$="' + fieldName + '"]' );

			if ( ! $input.length ) {
				return;
			}

			$input.prop( 'disabled', tweet_limit_set );

			// Disable/Mute the label associated with the inputs
			if ( tweet_limit_set ) {
				$label.addClass( 'jp-twitter-disabled' );
			} else {
				$label.removeClass( 'jp-twitter-disabled' );
			}
		}
	} );
} );
