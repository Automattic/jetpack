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
			'stats'             :   jitmL10n.stats_msgs,
			'jitm_stats_url'    :   jitmL10n.jitm_stats_url,
			'enabledModules'    :   []
		};

		initEvents();

	});

	///////////////////////////////////////
	// FUNCTIONS
	///////////////////////////////////////

	function initEvents() {

		var module_slug, success_msg, fail_msg, hide_msg,
			$body = $( 'body' );

		// On dismiss of JITM admin notice
		$body.on( 'click', '.jp-jitm .dismiss', function() {
			var $self = $( this );

			// hide the notice
			$self.closest( '.jp-jitm' ).hide();

			// ajax request to save dismiss and never show again
			data.jitmActionToTake = 'dismiss';
			module_slug = $self.data( 'module' );
			data.jitmModule = module_slug;

			$.post( jitmL10n.ajaxurl, data, function ( response ) {
				if ( true === response.success ) {
					//console.log('successfully dismissed for ever')
				}
			});
		});

		$body.on( 'click', '.jp-jitm .activate', function() {

			var $self = $( this ),
				$jitm = $self.closest( '.jp-jitm' );
			$jitm.find( '.button' ).addClass( 'hide' );
			$jitm.find( '.j-spinner' ).toggleClass( 'hide' );
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
					var $msg = $jitm.find( '.msg' );
					$msg.html( success_msg );
					$jitm.find( '.j-spinner' ).add( '#jetpack-wordpressdotcom' ).toggleClass( 'hide' );
					if ( 'manage' !== data.jitmModule ) {
						hide_msg = setTimeout( function () {
							$jitm.hide( 'slow' );
						}, 5000 );
					}
					$jitm.find( '.show-after-enable.hide' ).removeClass( 'hide' );
					data.enabledModules.push( module_slug );
				} else {
					$jitm.html( '<p><span class="icon"></span>' + fail_msg + '</p>' );
				}
			});

		});

		$body.on( 'click', '.jp-jitm .launch', function() {
			data.jitmActionToTake = 'launch';
			module_slug = $(this).data( 'module' );
			data.jitmModule = module_slug;
			// ajax request to save click in stat
			$.post( jitmL10n.ajaxurl, data );
		} );

		$body.on( 'click', '#jetpack-wordpressdotcom', function() {
			//Log user heads to wordpress.com/plugins
			new Image().src = data.jitm_stats_url;
		});

		// Display Photon JITM after user started uploading an image.
		if ( $( '#tmpl-jitm-photon' ).length > 0 ) {
			wp.Uploader.queue.on( 'add', function ( e ) {
				if ( -1 === $.inArray( 'photon', data.enabledModules ) ) {
					if ( 'image' === e.attributes.type ) {
						var jitmTemplate = wp.template( 'jitm-photon' ),
							$menu = wp.media.frame.$el.find( '.media-menu' ),
							$jitm;
						if ( $menu.length > 0 ) {
							$jitm = $menu.append( jitmTemplate() ).find( '.jp-jitm' );

							// JITM is visible to user, track it.
							data.jitmActionToTake = 'viewed';
							data.jitmModule = $jitm.data( 'track' );
							$.post( jitmL10n.ajaxurl, data );
						}
					} else {
						$( '.media-menu' ).find( '.jp-jitm' ).remove();
					}
				}
			} );
		}
	}

})(jQuery, jitmL10n);