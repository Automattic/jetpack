/* global wp, jetpackL10n, jQuery */

(function( $, modules, currentVersion, jetpackL10n ) {

	///////////////////////////////////////
	// INIT
	///////////////////////////////////////

	var originPoint,
		data;

	$( document ).ready(function () {

		data = {
			'action'                : 'jetpack_admin_ajax',
			'jumpstartModules'      : jetpackL10n.jumpstart_modules,
			'jumpstartModSlug'      : jetpackL10n.jumpstart_modules,
			'jumpstartNonce'        : jetpackL10n.activate_nonce,
			'jumpstartStatsURLS'    : jetpackL10n.jumpstart_stats_urls,
			'showJumpstart'         : jetpackL10n.show_jumpstart
		};

		initEvents();
		loadModules( 'Recommended', 'mod-recommended', '.modules' );
		if('1' === data.showJumpstart) {
			loadModules( 'Jumpstart', 'mod-jumpstart', '#jp-config-list' );
		}
		jumpStartAJAX();
	});

	///////////////////////////////////////
	// FUNCTIONS
	///////////////////////////////////////

	function closeShadeToggle() {
		// Clicking outside modal, or close X closes modal
		$( '.shade, .modal .close' ).on( 'click', function () {
			$( '.shade, .modal' ).hide();
			$( '.manage-right' ).removeClass( 'show' );
			originPoint.focus();
			$( '.modal' )[0].removeAttribute( 'tabindex' );
			return false;
		});

		$( window ).on( 'keydown', function( e ) {
			// If pressing ESC close the modal
			if ( 27 === e.keyCode ) {
				$( '.shade, .modal' ).hide();
				$( '.manage-right' ).removeClass( 'show' );
				originPoint.focus();
				$( '.modal' )[0].removeAttribute( 'tabindex' );
			}
		});
	}

	function initEvents () {

		// Show preconfigured list of features to enable via "Jump-start"
		$( '.jp-config-list-btn' ).click(function(){
			$( '#jp-config-list' ).toggle();

			//Log Jump Start event "learn more" in MC Stats
			new Image().src = data.jumpstartStatsURLS.learnmore;
		});

		// Hide the successful connection message after a little bit
		setTimeout( function(){
			jQuery( '.jetpack-message:not( .stay-visible, .jetpack-err )' ).hide( 600 );
		}, 6000);

		// Modal events
		$( document ).ready(function () {
			initModalEvents();
		});

		// Debounce the resize event
		var pauseResize = false;
		window.onresize = function() {
			if ( !pauseResize ) {
				pauseResize = true;
				recalculateModuleHeights();
				setTimeout(function () {
					pauseResize = false;
				}, 100 );
			}
		};
	}

	function initModalEvents() {
		var $modal = $( '.modal' );
		$( '.module h3, .feature a, .configs a, .more-info' ).on( 'click keypress', function (e) {
			// Only show modal on enter when keypress recorded (accessibility)
			if ( e.keyCode && 13 !== e.keyCode ) {
				return;
			}

			e.preventDefault();

			$( '.shade' ).show();

			// Show loading message on init
			$modal.html( wp.template( 'modalLoading' )( {} ) ).fadeIn();
			// Load & populate with content
			var $this = $( this ).parent(),
				index = $this.data( 'index' ),
				name = $this.data( 'name' );
			
			$modal.empty().html( wp.template( 'modal' )( $.extend( modules[index], { name: name } ) ) );
			// Save the focused element, then shift focus to the modal window.
			originPoint = this;
			$modal[0].setAttribute( 'tabindex', '0' );
			$modal.focus();

			closeShadeToggle();

			// Modal header links
			$( '.modal header li a.title' ).on( 'click', function () {
				$( '.modal header li a.title' ).removeClass( 'active' );
				$( this ).addClass( 'active' );
				return false;
			});
		});
	}


	/*
	Load Modules for a template
	@param string: The module tag you'd like to filter by
	@param string: The template name
	@param string: The target element to display the template
	 */
	function loadModules( prop, template, location ) {
		// Mapping prior to sorting improves performance by over 50%
		var html = '',
			result = [],
			val = '',
			i,
			length,
			renderingmodules = [];

		// create the map
		for ( i = 0, length = modules.length; i < length; i++ ) {
			if( modules[i].feature.indexOf(prop) !== -1 ) {
				val = modules[i].name.toLowerCase();
				result.push( {
					index: i,
					value: val,
					order: modules[i].recommendation_order
				});
			}
		}

		// Sort modules by recommendation order
		result.sort(function( a, b ) {
			if (a.order === b.order ) {
				return 0;
			}
			return ( a.order < b.order ) ? -1 : 1;
		});

		// copy values in right order
		for ( i = 0, length = result.length; i < length; i++ ) {
			renderingmodules.push( modules[result[i].index] );
			renderingmodules[i].index =  result[i].index; // make sure we set the index to the right order*/
		}


		// Render modules
		for ( i = 0; i < renderingmodules.length; i++ ) {
			html += wp.template( template )( renderingmodules[i] );
		}

		$( location ).append( html );

		// track Jump Start views
		if('Jumpstart' === prop) {
			new Image().src = data.jumpstartStatsURLS.viewed;
		}

		recalculateModuleHeights();
		initModalEvents();
	}

	function recalculateModuleHeights () {
		// Resize module heights based on screen resolution
		var module = $( '.jp-jumpstart, .module, .jp-support-column-left .widget-text' ),
			tallest = 0,
			thisHeight;

		// Remove heights
		module.css( 'height', 'auto' );

		// Determine new height
		module.each(function() {

			thisHeight = $( this ).outerHeight();

			if ( thisHeight > tallest ) {
				tallest = thisHeight;
			}
		});

		// Apply new height
		module.css( 'height', tallest + 'px' );
	}

	/*
	Handles the jump start ajax requests.

	Dismissing the Jump Start area will set an option, so it will never be seen again
	Initiating Jump Start will activate all modules that are recommended and set a sharing options while doing so.
	For either request, if update_option has failed, look for an error in the console.
	@todo delete the "reset everything" call - meant for testing only.
	 */
	function jumpStartAJAX() {

		// Will dismiss the Jump Start area, and set wp option in callback
		$( '.dismiss-jumpstart' ).click(function(){
			$( '#jump-start-area' ).hide( 600 );

			data.disableJumpStart = true;

			$.post( jetpackL10n.ajaxurl, data, function (response) {
				// If there's no response, something bad happened
				if ( ! response ) {
					//console.log( 'Option "jetpack_dismiss_jumpstart" not updated.' );
				}
			});

			// Log Jump Start event in MC Stats
			new Image().src = data.jumpstartStatsURLS.dismiss;

			return false;
		});

		// Activate all Jump-start modules
		$( '#jump-start' ).click(function () {

			var module, dataName, configURL;

			$( '.spinner' ).show();

			data.jumpStartActivate = 'jump-start-activate';

			$( '#jp-config-list' ).hide();

			$.post( jetpackL10n.ajaxurl, data, function (response) {
				// If there's no response, option 'sharing-services' was not updated.
				if ( ! response ) {
					//console.log( 'Option "sharing-services" not updated. Either you already had sharing buttons enabled, or something is broken.' );
				}

				module = data.jumpstartModules;

				// Only target Jump Start modules
				_.each( module, function( mod ) {
					dataName = $( 'div[data-name="' + mod.module_name + '"]' );
					configURL = mod.configure_url;

					// Replace inactive content with active, provide config url
					_.find( dataName, function( div ) {
						$( div.children ).find( '.notconfigurable ').hide();
						$( div.children ).find( '.configurable ' ).replaceWith( '<a class="button alignright" data-name="' + mod.module_name + '" title="Configure" href="' + configURL + '">Configure</a>' );
						div.className += ' active';
					});
				});

				$( '.spinner, .jstart, #jumpstart-cta' ).hide();
				$( '.jumpstart-message, .miguel' ).toggle();

				// Log Jump Start event in MC Stats
				new Image().src = data.jumpstartStatsURLS.jumpstarted;

			});

			return false;
		});

		/*
			RESET EVERYTHING (for testing only)
			@todo remove
		 */

		$( '#jump-start-deactivate' ).click(function () {
			$( '.spinner' ).show();

			data.jumpStartDeactivate = 'jump-start-deactivate';

			$.post( jetpackL10n.ajaxurl, data, function ( response ) {
				//$('#jumpstart-cta').html(response);
				$( '#deactivate-success' ).html( response );
				$( '.spinner' ).hide();
			});

			return false;
		});
	}

})( jQuery, jetpackL10n.modules, jetpackL10n.currentVersion, jetpackL10n );
