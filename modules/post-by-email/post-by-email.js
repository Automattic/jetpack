/* global jetpack_post_by_email:true, ajaxurl */

(function($) {
	jetpack_post_by_email = {
		init: function () {
			$('#jp-pbe-enable').click(jetpack_post_by_email.enable);
			$('#jp-pbe-regenerate').click(jetpack_post_by_email.regenerate);
			$('#jp-pbe-disable').click(jetpack_post_by_email.disable);
		},

		enable: function () {
			$('#jp-pbe-enable').attr('disabled', 'disabled');
			$('#jp-pbe-error').fadeOut();
			$('#jp-pbe-spinner').fadeIn();

			var data = {
				action: 'jetpack_post_by_email_enable'
			};

			$.post(ajaxurl, data, jetpack_post_by_email.handle_enabled);
		},

		handle_enabled: function (response) {
			var enabled = false, error;
			try {
				error = JSON.parse(response);
			} catch (e) {
				enabled = true;
			}

			$('#jp-pbe-regenerate').removeAttr('disabled');
			$('#jp-pbe-disable').removeAttr('disabled');

			if (enabled) {
				$('#jp-pbe-enable').fadeOut(400, function () {
					$('#jp-pbe-enable').removeAttr('disabled');
					$('#jp-pbe-email').val(response);
					$('#jp-pbe-info').fadeIn();
				});
			} else {
				$('#jp-pbe-error').text(error.message);
				$('#jp-pbe-error').fadeIn();
				$('#jp-pbe-enable').removeAttr('disabled');
			}

			$('#jp-pbe-spinner').fadeOut();
		},

		regenerate: function () {
			$('#jp-pbe-regenerate').attr('disabled', 'disabled');
			$('#jp-pbe-disable').attr('disabled', 'disabled');
			$('#jp-pbe-error').fadeOut();
			$('#jp-pbe-spinner').fadeIn();

			var data = {
				action: 'jetpack_post_by_email_regenerate'
			};

			$.post(ajaxurl, data, jetpack_post_by_email.handle_regenerated);
		},

		handle_regenerated: function (response) {
			var regenerated = false, error;
			try {
				error = JSON.parse(response);
			} catch (e) {
				regenerated = true;
			}

			if (regenerated) {
				$('#jp-pbe-email-wrapper').fadeOut(400, function () {
					$('#jp-pbe-email').val(response);
					$('#jp-pbe-email-wrapper').fadeIn();
				});
			} else {
				$('#jp-pbe-error').text(error.message);
				$('#jp-pbe-error').fadeIn();
			}

			$('#jp-pbe-regenerate').removeAttr('disabled');
			$('#jp-pbe-disable').removeAttr('disabled');
			$('#jp-pbe-spinner').fadeOut();
		},

		disable: function () {
			$('#jp-pbe-regenerate').attr('disabled', 'disabled');
			$('#jp-pbe-disable').attr('disabled', 'disabled');
			$('#jp-pbe-error').fadeOut();
			$('#jp-pbe-spinner').fadeIn();

			var data = {
				action: 'jetpack_post_by_email_disable'
			};

			$.post(ajaxurl, data, jetpack_post_by_email.handle_disabled);
		},

		handle_disabled: function (response) {
			var disabled = false, error;
			try {
				error = JSON.parse(response);
			} catch (e) {
				disabled = true;
			}

			if ('error' !== error.response) {
				disabled = true;
			}

			if (disabled) {
				$('#jp-pbe-enable').removeAttr('disabled');
				$('#jp-pbe-info').fadeOut(400, function () {
					$('#jp-pbe-regenerate').removeAttr('disabled');
					$('#jp-pbe-disable').removeAttr('disabled');
					$('#jp-pbe-enable').fadeIn();
				});
			} else {
				$('#jp-pbe-regenerate').removeAttr('disabled');
				$('#jp-pbe-disable').removeAttr('disabled');

				$('#jp-pbe-error').text(error.message);
				$('#jp-pbe-error').fadeIn();
			}

			$('#jp-pbe-spinner').fadeOut();
		}
	};

	$( function() { jetpack_post_by_email.init(); } );
})(jQuery);
