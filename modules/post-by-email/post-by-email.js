/* global jetpack_post_by_email:true, pbeVars */

( function( $ ) {
	var $pbeDisable,
		$pbeEmail,
		$pbeEmailWrapper,
		$pbeEnable,
		$pbeError,
		$pbeInfo,
		$pbeRegenerate,
		$pbeSpinner;

	jetpack_post_by_email = {
		init: function() {
			$pbeEnable.click( jetpack_post_by_email.enable );
			$pbeRegenerate.click( jetpack_post_by_email.regenerate );
			$pbeDisable.click( jetpack_post_by_email.disable );
		},

		enable: function() {
			$pbeEnable.attr( 'disabled', 'disabled' );
			$pbeError.fadeOut();
			$pbeSpinner.fadeIn();

			jetpack_post_by_email.send_request(
				{ post_by_email_address: 'create' },
				jetpack_post_by_email.handle_enabled
			);
		},

		handle_enabled: function( response ) {
			$pbeRegenerate.removeAttr( 'disabled' );
			$pbeDisable.removeAttr( 'disabled' );

			if ( response.code === 'success' ) {
				$pbeEnable.fadeOut( 400, function() {
					$pbeEnable.removeAttr( 'disabled' );
					$pbeEmail.val( response.post_by_email_address );
					$pbeInfo.fadeIn();
				} );
			} else {
				$pbeError.text( jetpack_post_by_email.parse_error_message( response ) );
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

			jetpack_post_by_email.send_request(
				{ post_by_email_address: 'regenerate' },
				jetpack_post_by_email.handle_regenerated
			);
		},

		handle_regenerated: function( response ) {
			if ( response.code === 'success' ) {
				$pbeEmailWrapper.fadeOut( 400, function() {
					$pbeEmail.val( response.post_by_email_address );
					$pbeEmailWrapper.fadeIn();
				} );
			} else {
				$pbeError.text( jetpack_post_by_email.parse_error_message( response ) );
				$pbeError.fadeIn();
			}

			$pbeRegenerate.removeAttr( 'disabled' );
			$pbeDisable.removeAttr( 'disabled' );
			$pbeSpinner.fadeOut();
		},

		disable: function() {
			$pbeRegenerate.attr( 'disabled', 'disabled' );
			$pbeDisable.attr( 'disabled', 'disabled' );
			$pbeError.fadeOut();
			$pbeSpinner.fadeIn();

			jetpack_post_by_email.send_request(
				{ post_by_email_address: 'delete' },
				jetpack_post_by_email.handle_disabled
			);
		},

		handle_disabled: function( response ) {
			if ( response.code === 'success' ) {
				$pbeEnable.removeAttr( 'disabled' );
				$pbeInfo.fadeOut( 400, function() {
					$pbeRegenerate.removeAttr( 'disabled' );
					$pbeDisable.removeAttr( 'disabled' );
					$pbeEnable.fadeIn();
				} );
			} else {
				$pbeRegenerate.removeAttr( 'disabled' );
				$pbeDisable.removeAttr( 'disabled' );

				$pbeError.text( jetpack_post_by_email.parse_error_message( response ) );
				$pbeError.fadeIn();
			}

			$pbeSpinner.fadeOut();
		},

		send_request: function( data, callback ) {
			jQuery
				.ajax( {
					url: '/wp-json/jetpack/v4/settings/',
					method: 'post',
					beforeSend: function( xhr ) {
						xhr.setRequestHeader( 'X-WP-Nonce', pbeVars.rest_nonce );
					},
					data: JSON.stringify( data ),
					contentType: 'application/json',
					dataType: 'json',
				} )
				.always( callback );
		},

		parse_error_message: function( response ) {
			if ( response.responseText ) {
				var data = JSON.parse( response.responseText );

				if ( data.message ) {
					return data.message.replace( /^.*?:/, '' );
				}
			}

			return '';
		},
	};

	$( function() {
		$pbeDisable = $( '#jp-pbe-disable' );
		$pbeEmail = $( '#jp-pbe-email' );
		$pbeEmailWrapper = $( '#jp-pbe-email-wrapper' );
		$pbeEnable = $( '#jp-pbe-enable' );
		$pbeError = $( '#jp-pbe-error' );
		$pbeInfo = $( '#jp-pbe-info' );
		$pbeRegenerate = $( '#jp-pbe-regenerate' );
		$pbeSpinner = $( '#jp-pbe-spinner' );

		jetpack_post_by_email.init();
	} );
} )( jQuery );
