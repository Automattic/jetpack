/* global jitmL10n, jQuery */

(function($, jitmL10n) {

	///////////////////////////////////////
	// INIT
	///////////////////////////////////////

	var data;

	$(document).ready(function () {

		data = {
			'action'        :   'jitm_ajax',
			'jitmNonce'     :   jitmL10n.jitm_nonce
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
			data.jitmActionToTake = 'dismiss';

			$.post( jitmL10n.ajaxurl, data, function (response) {
				// If there's no response, something bad happened
				if ( ! response ) {
					//console.log( 'Option "jetpack_dismiss_jitm" not updated.' );
				}

			});
		});

		$('.jp-jitm .activate').click(function() {

			data.jitmActionToTake = 'activate';
			data.jitmModuleToActivate = 'photon';

			// since 2.8 ajaxurl is always defined in the admin header and points to admin-ajax.php
			$.post( jitmL10n.ajaxurl, data, function (response) {
				console.log(response);
				// If there's no response, something bad happened
				if ( ! response ) {
					console.log( 'Option "jetpack_dismiss_jitm" not updated.' );
				}
				$('.jp-jitm').html('<p><span class="icon"></span>Success! Photon is now active.</p>');
				hide_msg = setTimeout(function () {
					$('.jp-jitm').hide('slow');
				}, 5000);
			});

		});
	}

})(jQuery, jitmL10n);