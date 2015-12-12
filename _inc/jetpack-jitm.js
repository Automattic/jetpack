/* global jitmL10n, jQuery */

(function($, jitmL10n) {

	///////////////////////////////////////
	// INIT
	///////////////////////////////////////

	var data;

	$(document).ready(function () {

		data = {
			'action'            :   'jitm_ajax',
			'jitmNonce'         :   jitmL10n.jitm_nonce,
			'photon'            :   jitmL10n.photon_msgs,
			'manage'            :   jitmL10n.manage_msgs,
			'jitm_stats_url'    :   jitmL10n.jitm_stats_url
		};

		initEvents();

	});

	///////////////////////////////////////
	// FUNCTIONS
	///////////////////////////////////////

	function initEvents() {

		var module_slug, success_msg, fail_msg, hide_msg;

		// On dismiss of JITM admin notice
		$( '.jp-jitm .dismiss' ).click( function() {
			// hide the notice
			$( '.jp-jitm' ).hide();

			// ajax request to save dismiss and never show again
			data.jitmActionToTake = 'dismiss';
			module_slug = $(this).data( 'module' );
			data.jitmModule = module_slug;

			$.post( jitmL10n.ajaxurl, data, function ( response ) {
				if ( true === response.success ) {
					//console.log('successfully dismissed for ever')
				}
			});
		});

		$( '.jp-jitm .activate' ).click(function() {

			var $self = $( this );
			$( '.button' ).addClass( 'hide' );
			$( '.j-spinner' ).toggleClass( 'hide' );
			data.jitmActionToTake = 'activate';

			// get the module we're working with using the data-module attribute
			module_slug = $self.data( 'module' );
			// Check if there's a custom success message, otherwise use default.
			success_msg = $self.data( 'module-success' ) ? $self.data( 'module-success' ) : data[module_slug].success;
			fail_msg = data[module_slug].fail;

			data.jitmModule = module_slug;

			// since 2.8 ajaxurl is always defined in the admin header and points to admin-ajax.php
			$.post( jitmL10n.ajaxurl, data, function ( response ) {
				// If there's no response, something bad happened
				if ( true === response.success ) {
					var $msg = $( '.msg' );
					$msg.html( success_msg );
					$( '#jetpack-wordpressdotcom, .j-spinner' ).toggleClass( 'hide' );
					if ( 'manage' !== data.jitmModule ) {
						hide_msg = setTimeout( function () {
							$( '.jp-jitm' ).hide( 'slow' );
						}, 5000 );
					}
					$msg.closest( '.jp-jitm' ).find( '.show-after-enable.hide' ).removeClass( 'hide' );
				} else {
					$( '.jp-jitm' ).html( '<p><span class="icon"></span>' + fail_msg + '</p>' );
				}
			});

		});

		$( '.jp-jitm .launch' ).click(function() {
			data.jitmActionToTake = 'launch';
			module_slug = $(this).data( 'module' );
			data.jitmModule = module_slug;
			// ajax request to save click in stat
			$.post( jitmL10n.ajaxurl, data );
		} );

		$( '#jetpack-wordpressdotcom' ).click(function() {
			//Log user heads to wordpress.com/plugins
			new Image().src = data.jitm_stats_url;
		});
	}

})(jQuery, jitmL10n);