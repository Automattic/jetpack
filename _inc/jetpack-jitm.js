(function($, jitmL10n) {

	///////////////////////////////////////
	// INIT
	///////////////////////////////////////

	var data;

	$(document).ready(function () {

		data = {
			'action'            :   'jitm_ajax',
			'hide_jitm_plugins' :   jitmL10n.hide_jitm_plugins,
			'jitmStatsURLS'     :   jitmL10n.jumpstart_stats_urls,
			'jitmNonce'         :   jitmL10n.jitm_nonce
		};

		initEvents();

	});

	///////////////////////////////////////
	// FUNCTIONS
	///////////////////////////////////////

	function initEvents() {
		$('.jetpack-jitm .dismiss').click(function() {
			$('.jetpack-jitm').hide();

			new Image().src = data.jitmStatsURLS.dismiss;

			data.hide_jitm_plugins = true;

			$.post( jitmL10n.ajaxurl, data, function (response) {
				// If there's no response, something bad happened
				if ( ! response ) {
					//console.log( 'Option "jetpack_dismiss_jitm" not updated.' );
				}

			});
		})
	}

})(jQuery, jitmL10n);
