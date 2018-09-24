window.onload = function() {
	if (window.jQuery) {
		// Remove | and () from the plugins filter bar
		jQuery.each(jQuery("ul.subsubsub li"), function(i, el) {
			var li = jQuery(el);
			li.html(li.html().replace("|", "").replace("(", "").replace(")", ""));
		});

		jQuery("#wp-admin-bar-root-default").on( "click", "li", function(e) {
			location.href = jQuery(e.target).closest('a').attr('href');
		});

		jQuery("#wp-admin-bar-top-secondary").on( "click", "li#wp-admin-bar-my-account", function(e) {
			location.href = jQuery(e.target).closest('a').attr('href');
		});

		if ( document && document.location && document.location.search ) {
			const params_array = document.location.search.substr( 1 ).split( '&' );
			const params_object = {};
			if ( params_array && params_array.length ) {
				for (let i = 0; i < params_array.length; i++) {
					const key_value = params_array[i].split( '=' );
					params_object[ key_value[0] ] = key_value[1];
				}

				if( params_object['s'] && params_object['modal-mode'] && params_object['plugin'] ) {
					const pluginEl = $( `.plugin-card-${params_object['plugin']} .thickbox.open-plugin-details-modal` );
					if (pluginEl && pluginEl.length ) {
						pluginEl.click();
					}
				}
			}

			$body = $( document.body );
			$body.on( 'thickbox:iframe:loaded', function(e) {
				jQuery( "#TB_window" ).on( "click", "button#TB_closeWindowButton", function(e) {
					$('#TB_closeWindowButton').click();
				} )
			} );
		}
	}
}
