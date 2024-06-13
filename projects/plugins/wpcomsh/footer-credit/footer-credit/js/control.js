(function ($) {
	$(document).ready(function ($) {
		$('#customize-control-footercredit select').on('change', function () {
			var val = $(this).val();
			var $upgrade = $(this).parent().find( '.footercredit-upgrade-link' );
			if ( val === 'hidden-upgrade') {
				$upgrade.fadeIn();
			} else {
				$upgrade.fadeOut();
			}
		});
	})
})(jQuery);