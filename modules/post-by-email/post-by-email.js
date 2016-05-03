/* global jetpack_post_by_email:true, ajaxurl, pbeVars */

(function($) {
	var $pbeDisable      = $('#jp-pbe-disable'),
		$pbeEmail        = $('#jp-pbe-email'),
		$pbeEmailWrapper = $('#jp-pbe-email-wrapper'),
		$pbeEnable       = $('#jp-pbe-enable'),
		$pbeError        = $('#jp-pbe-error'),
		$pbeInfo         = $('#jp-pbe-info'),
		$pbeRegenerate   = $('#jp-pbe-regenerate'),
		$pbeSpinner      = $('#jp-pbe-spinner');

	jetpack_post_by_email = {
		init: function () {
			$pbeEnable.click( jetpack_post_by_email.enable );
			$pbeRegenerate.click( jetpack_post_by_email.regenerate );
			$pbeDisable.click( jetpack_post_by_email.disable );
		},

		enable: function () {
			$pbeEnable.attr('disabled', 'disabled');
			$pbeError.fadeOut();
			$pbeSpinner.fadeIn();

			var data = {
				action: 'jetpack_post_by_email_enable',
				pbe_nonce: pbeVars.nonces.enable
			};

			$.post( ajaxurl, data, jetpack_post_by_email.handle_enabled );
		},

		handle_enabled: function( response ) {
			var enabled = false,
				error;
			try {
				error = JSON.parse( response );
			} catch ( e ) {
				enabled = true;
			}

			$pbeRegenerate.removeAttr( 'disabled' );
			$pbeDisable.removeAttr( 'disabled' );

			if ( enabled ) {
				$pbeEnable.fadeOut( 400, function() {
					$pbeEnable.removeAttr( 'disabled' );
					$pbeEmail.val( response );
					$pbeInfo.fadeIn();
				});
			} else {
				$pbeError.text( error.message );
				$pbeError.fadeIn();
				$pbeEnable.removeAttr( 'disabled' );
			}

			$pbeSpinner.fadeOut();
		},

		regenerate: function() {
			$pbeRegenerate.attr( 'disabled', 'disabled' );
			$pbeDisable.attr( 'disabled', 'disabled' );
			$pbeError.fadeOut();
			$pbeSpinner.fadeIn();

			var data = {
				action: 'jetpack_post_by_email_regenerate',
				pbe_nonce: pbeVars.nonces.regenerate
			};

			$.post( ajaxurl, data, jetpack_post_by_email.handle_regenerated );
		},

		handle_regenerated: function( response ) {
			var regenerated = false, error;
			try {
				error = JSON.parse(response);
			} catch ( e ) {
				regenerated = true;
			}

			if ( regenerated ) {
				$pbeEmailWrapper.fadeOut( 400, function() {
					$pbeEmail.val( response );
					$pbeEmailWrapper.fadeIn();
				});
			} else {
				$pbeError.text( error.message );
				$pbeError.fadeIn();
			}

			$pbeRegenerate.removeAttr( 'disabled' );
			$pbeDisable.removeAttr( 'disabled' );
			$pbeSpinner.fadeOut();
		},

		disable: function () {
			$pbeRegenerate.attr( 'disabled', 'disabled' );
			$pbeDisable.attr( 'disabled', 'disabled' );
			$pbeError.fadeOut();
			$pbeSpinner.fadeIn();

			var data = {
				action: 'jetpack_post_by_email_disable',
				pbe_nonce: pbeVars.nonces.disable
			};

			$.post( ajaxurl, data, jetpack_post_by_email.handle_disabled );
		},

		handle_disabled: function( response ) {
			var disabled = false, error;
			try {
				error = JSON.parse( response );
			} catch ( e ) {
				disabled = true;
			}

			if ( 'error' !== error.response ) {
				disabled = true;
			}

			if ( disabled ) {
				$pbeEnable.removeAttr( 'disabled' );
				$pbeInfo.fadeOut( 400, function() {
					$pbeRegenerate.removeAttr( 'disabled' );
					$pbeDisable.removeAttr( 'disabled' );
					$pbeEnable.fadeIn();
				});
			} else {
				$pbeRegenerate.removeAttr( 'disabled' );
				$pbeDisable.removeAttr( 'disabled' );

				$pbeError.text( error.message );
				$pbeError.fadeIn();
			}

			$pbeSpinner.fadeOut();
		}
	};

	$( function() { jetpack_post_by_email.init(); } );
})(jQuery);
