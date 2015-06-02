/* global jitmL10n, jQuery */

(function($, jitmL10n) {

	///////////////////////////////////////
	// INIT
	///////////////////////////////////////

	var data;

	$(document).ready(function () {

		data = {
			'action'                :   'jitm_ajax',
			'hide_jitm_plugins'     :   jitmL10n.hide_jitm_plugins,
			'jitmStatsURLS'         :   jitmL10n.jumpstart_stats_urls,
			'jitmSERPStatsURLS'     :   jitmL10n.jumpstart_plugin_serp_stats_urls,
			'jitmNonce'             :   jitmL10n.jitm_nonce
		};

		initEvents();

	});

	///////////////////////////////////////
	// FUNCTIONS
	///////////////////////////////////////

	function initEvents() {
		// On dismiss of JITM admin notice
		$('.jetpack-jitm .dismiss').click(function() {
			// hide the notice
			$('.jetpack-jitm').hide();

			// track in mc stats
			new Image().src = data.jitmStatsURLS.dismiss;
			new Image().src = data.jitmSERPStatsURLS.dismiss;

			// ajax request to save dismiss and never show again
			data.hide_jitm_plugins = true;

			$.post( jitmL10n.ajaxurl, data, function (response) {
				// If there's no response, something bad happened
				if ( ! response ) {
					//console.log( 'Option "jetpack_dismiss_jitm" not updated.' );
				}

			});
		});

		$('.jetpack-learnmore-module').click(function() {

			// track in mc stats
			new Image().src = data.jitmStatsURLS.learnmore;
			new Image().src = data.jitmSERPStatsURLS.learnmore;
			new Image().src = data.jitmSERPStatsURLS.learnmore+': '+$(this).attr( 'id' );



		});
	}

})(jQuery, jitmL10n);
