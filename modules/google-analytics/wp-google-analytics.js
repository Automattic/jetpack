(function($){ // Open closure and map jQuery to $.

	// Adds :external for grabbing external links
	$.expr[':'].external = function(obj) {
		return obj.href && !obj.href.match(/^mailto\:/) && !obj.href.match(/^javascript\:/) && (obj.hostname != location.hostname);
	};

	// Document ready.
	$( function() {
		// Add 'external' class and _blank target to all external links
		$('a:external').on( 'click.wp-google-analytics', function(e){
			try {
				_gaq.push( [ '_trackEvent', 'Outbound Links', e.currentTarget.host, $(this).attr('href') ] );
				/**
				 * If this link is not opened in a new tab or window, we need to add
				 * a small delay so the event can fully fire.  See:
				 * http://support.google.com/analytics/bin/answer.py?hl=en&answer=1136920
				 *
				 * We're actually checking for modifier keys, middle-click, or pre-existing target=_blank attribute
				 */
				if ( ! ( e.metaKey || e.ctrlKey || 1 == e.button || '_blank' == $(this).attr('target') ) ) {
					e.preventDefault();
					setTimeout('document.location = "' + $(this).attr('href') + '"', 100)
				}
			} catch(err) {}
		});
	});

})( jQuery ); // Close closure.
