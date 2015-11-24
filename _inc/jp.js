/* global wp, jetpackL10n, jQuery */

(function( $, modules, currentVersion, jetpackL10n ) {

	///////////////////////////////////////
	// INIT
	///////////////////////////////////////

	var originPoint,
		data;

	$( document ).ready(function () {

		data = {
			'jumpstartModules'      : jetpackL10n.jumpstart_modules,
			'jumpstartModSlug'      : jetpackL10n.jumpstart_modules,
			'jumpstartNonce'        : jetpackL10n.activate_nonce,
			'jumpstartStatsURLS'    : jetpackL10n.jumpstart_stats_urls,
			'nuxAdminStatsURLS'     : jetpackL10n.admin_stats_urls,
			'showJumpstart'         : jetpackL10n.show_jumpstart,
			'adminNonce'            : jetpackL10n.admin_nonce
		};

		initEvents();
		loadModules( 'Performance-Security', 'mod-nux', '#nux-performance-security' );
		loadModules( 'Traffic', 'mod-nux', '#nux-traffic' );
		if('1' === data.showJumpstart) {
			loadModules( 'Jumpstart', 'mod-jumpstart', '#jp-config-list' );
		}

		/*
		We are listening to see if we need to refresh the data.
		We'd need to refresh the data only if the page is navigated to
		via the back or forward browser buttons.  We do this so the
		browser cache isn't out of sync with the real data generated by the
		AJAX event.
		 */
		onload = function() {
			if ( window.location.hash.substr( '#refresh' ) ) {
				refreshData();
			}
		};

		jumpStartAJAX();
		adminAJAX();
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
			$( 'body' ).css( 'overflow', 'auto' );
			return false;
		});

		$( window ).on( 'keydown', function( e ) {
			// If pressing ESC close the modal
			if ( 27 === e.keyCode ) {
				$( '.shade, .modal' ).hide();
				$( '.manage-right' ).removeClass( 'show' );
				originPoint.focus();
				$( '.modal' )[0].removeAttribute( 'tabindex' );
				$( 'body' ).css( 'overflow', 'auto' );
			}
		});
	}

	function initEvents () {
		// Only show module table if Jumpstart isn't there
		if ( ! data.showJumpstart ) {
			$( '.nux-intro' ).show();
		}

		// Show preconfigured list of features to enable via "Jump-start"
		$( '.jp-config-list-btn' ).click(function(){
			$( '#jp-config-list' ).toggle();
			recalculateModuleHeights();

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

		// This function will track the number of clicks on the "See the other X Jetpack features"
		$( '.full-features-btn' ).click( function() {
			new Image().src = data.nuxAdminStatsURLS.learnmore+'-full-features-btn';
		});
	}

	function initModalEvents() {
		var $modal = $( '.modal' );
		$( '.module h3, .feature a, .configs a, .more-info, .feat h4' ).on( 'click keypress', function (e) {
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

			// Disallow scroll
			$( 'body' ).css( 'overflow', 'hidden' );

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


		// Render modules.  Don't show active in Jumpstart.
		for ( i = 0; i < renderingmodules.length; i++ ) {
			if ( 'Jumpstart' === prop && ! renderingmodules[i].activated ) {
				html += wp.template( template )( renderingmodules[i] );
			} else if ( 'Jumpstart' !== prop )  {
				html += wp.template( template )( renderingmodules[i] );
			}
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

		// Apply new height plus 20 pixels
		module.css( 'height', ( parseInt( tallest, 10 ) + 5 ) + 'px' );
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
			data.action = 'jetpack_jumpstart_ajax';

			$.post( jetpackL10n.ajaxurl, data, function (response) {
				// If there's no response, something bad happened
				if ( ! response ) {
					//console.log( 'Option "jetpack_dismiss_jumpstart" not updated.' );
				}

				window.location.hash = 'refresh';
			});

			$( '.nux-intro' ).show();

			// Log Jump Start event in MC Stats
			new Image().src = data.jumpstartStatsURLS.dismiss;

			return false;
		});

		// Activate all Jump-start modules
		$( '#jump-start' ).click(function () {
			var module, dataName, configURL, checkBox;

			$( '.jumpstart-spinner' ).show().css( 'display', 'block' );
			$( '#jump-start' ).hide();
			$( '.dismiss-jumpstart' ).hide();

			data.jumpStartActivate = 'jump-start-activate';
			data.action = 'jetpack_jumpstart_ajax';

			$( '#jp-config-list' ).hide();

			$.post( jetpackL10n.ajaxurl, data, function (response) {
				// If there's no response, option 'sharing-services' was not updated.
				if ( ! response ) {
					//console.log( 'Option "sharing-services" not updated. Either you already had sharing buttons enabled, or something is broken.' );
				}

				module = data.jumpstartModules;

				// Only target Jump Start modules
				_.each( module, function( mod ) {
					dataName = $( 'label[for="active-' + mod.module_slug + '"]' + '.plugin-action__label' );
					configURL = mod.configure_url;
					checkBox = $( 'input[id="active-' + mod.module_slug + '"]' );
					
					$( '#toggle-' + mod.module_slug ).addClass( 'activated' );
					dataName.html( 'ACTIVE' );
					$( checkBox ).prop( 'checked', true );
				});

				$( '.jumpstart-spinner, .jstart, #jumpstart-cta, .manage-cta-inactive' ).hide();
				$( '.jumpstart-message, .manage-cta-active' ).toggle();
				$( '#jump-start-area' ).delay( 5000 ).hide( 600 );

				// Log Jump Start event in MC Stats
				new Image().src = data.jumpstartStatsURLS.jumpstarted;

				$( '.nux-intro' ).show();

				window.location.hash = 'refresh';
			});

			return false;
		});

		/*
			RESET EVERYTHING (for testing only)
			@todo remove
		 */

		$( '#jump-start-deactivate' ).click(function () {
			$( '.jumpstart-spinner' ).show();

			data.jumpStartDeactivate = 'jump-start-deactivate';
			data.action = 'jetpack_jumpstart_ajax';

			$.post( jetpackL10n.ajaxurl, data, function ( response ) {
				//$('#jumpstart-cta').html(response);
				$( '#deactivate-success' ).html( response );
				$( '.jumpstart-spinner' ).hide();
				window.location.hash = '';

			});

			return false;
		});
	}

	/*
	Handles the module activation ajax actions
	 */
	function adminAJAX() {
		$( '.nux-in' ).on( 'keypress click', '.form-toggle', function( e ){
			if ( e.which !== 13 && e.type !== 'click' ) {
				return;
			}
			var thisElementId = e.target.id,
				thisLabel = $( 'label[for="' + thisElementId + '"]' + '.plugin-action__label'),
				index;

			data.action         = 'jetpack_admin_ajax';
			data.thisModuleSlug = thisElementId.replace( 'active-', '' );
			data.toggleModule   = 'nux-toggle-module';

			index = $( '#toggle-' + data.thisModuleSlug ).data( 'index' );

			thisLabel.hide();
			$( '.module-spinner-' + data.thisModuleSlug ).show();

			$.post( jetpackL10n.ajaxurl, data, function ( response ) {
				if ( 0 !== response ) {

					// Log NUX Admin event in MC Stats
					if( true === response.activated ){
						new Image().src = data.nuxAdminStatsURLS.enabled+','+'enabled-'+data.thisModuleSlug;
					}else{
						new Image().src = data.nuxAdminStatsURLS.deactivated+','+'deactivated-'+data.thisModuleSlug;
					}

					$( '.module-spinner-' + response.module ).hide();

					// This is a hacky way around not showing the config link when activated.
					response.noConfig = _.indexOf( [ 'photon', 'enhanced-distribution' ], response.module );

					// Preserves the modal index so it can be rendered properly after the data has changed
					response.index = index;

					$( '#toggle-' + response.module ).replaceWith( wp.template( 'mod-nux' )( response ) );

					// Refreshes the modal element data
					_.extend( _.findWhere( modules, { module: response.module } ), response );

					// Manual element alteration for Manage, since it's not part of the template
					if ( 'manage' === data.thisModuleSlug ) {
						if ( response.activated ) {
							thisLabel.show().html( 'ACTIVE' );
							$( '#manage-row' ).addClass( 'activated' );
						} else {
							thisLabel.show().html( 'INACTIVE' );
							$( '#manage-row' ).removeClass( 'activated' );
						}

						$( '.manage-cta-inactive' ).toggle();
						$( '.manage-cta-active' ).toggle();
						return;
					}

					initModalEvents();
					window.location.hash = 'refresh';
				}

			}, 'json' );
		});
	}

	/*
	This function will refresh any data elements that we've
	changed via AJAX.  Necessary when page is visited via back/forward
	browsing.
	 */
	function refreshData() {
		// Clean up
		$( '#nux-performance-security, #nux-traffic' ).empty();
		$( '#jump-start-area' ).hide();
		$( '.nux-intro' ).show();

		data.action      = 'jetpack_admin_ajax_refresh';
		data.refreshData = 'refresh';
		$.post( jetpackL10n.ajaxurl, data, function ( response ) {
			modules = _.values( response );
			loadModules( 'Performance-Security', 'mod-nux', '#nux-performance-security' );
			loadModules( 'Traffic', 'mod-nux', '#nux-traffic' );
		}, 'json' );
	}
})( jQuery, jetpackL10n.modules, jetpackL10n.currentVersion, jetpackL10n );
