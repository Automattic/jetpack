(function($, jitmL10n) {

	///////////////////////////////////////
	// INIT
	///////////////////////////////////////

	var data;

	$(document).ready(function () {

		data = {
			'jitmStatsURLS'    :    jitmL10n.jumpstart_stats_urls,
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
		})
	}

})(jQuery, jitmL10n);
