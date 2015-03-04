/* global wp, jetpackL10n, jQuery */

(function( $, modules, currentVersion, jetpackL10n ) {

	///////////////////////////////////////
	// INIT
	///////////////////////////////////////

	var originPoint;

	$( document ).ready(function () {
		initEvents();
		loadModules( 'recommended', 'mod-recommended', '.modules' );
		loadModules( 'jumpstart', 'mod-jumpstart', '#jp-config-list' );
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
		$('#jp-config-list-btn').click(function(){
			$('#jp-config-list').toggle();
		});

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
			map = [],
			result = [],
			val = '',
			i,
			length,
			renderingmodules = [];

		// create the map
		for ( i = 0, length = modules.length; i < length; i++ ) {
			if( modules[i]['module_tags'].map(function(item) { return item.toLowerCase(); }).indexOf(prop) !== -1 ) {
				val = modules[i]['name'].toLowerCase();
				map.push( {
					index: i,
					value: val
				});
			}
		}

		// copy values in right order
		for ( i = 0, length = map.length; i < length; i++ ) {
			result.push( modules[map[i].index] );
			result[i].index =  i; // make sure we set the index to the right order
		}

		// Replace old object, with newly sorted object
		renderingmodules = result;

		// Render modules
		for ( i = 0; i < renderingmodules.length; i++ ) {

			renderingmodules[i].index = i;

			html += wp.template( template )( renderingmodules[i] );
		}

		$( location ).html( html );

		recalculateModuleHeights();
		initModalEvents();
	}

	function recalculateModuleHeights () {
		// Resize module heights based on screen resolution
		var module = $( '.module, .jp-support-column-left .widget-text' ),
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

	function jumpStartAJAX() {
		// Activate all Jump-start modules
		$('#jump-start').click(function () {
			$('.spinner').show();

			var data = {
				'action'            : 'jetpack_admin_ajax',
				'jumpstartModules'  : jetpackL10n.jumpstart_modules,
				'jumpStartActivate' : 'jump-start-activate',
				'jumpstartNonce'    : jetpackL10n.activate_nonce
			};

			$.post( jetpackL10n.ajaxurl, data, function (response) {
				console.log(data.jumpstartModules);

				$('.jp-config-status').html(response);
				$('.spinner').hide();
			});

			return false;
		});

		/*
			Deactivate (for testing only)
		 */
		$('#jump-start-deactivate').click(function () {
			$('.spinner').show();

			var data = {
				'action'              : 'jetpack_admin_ajax',
				'jumpstartModules'    : jetpackL10n.jumpstart_modules,
				'jumpStartDeactivate' : 'jump-start-deactivate',
				'jumpstartNonce'    : jetpackL10n.activate_nonce
			};

			$.post( jetpackL10n.ajaxurl, data, function (response) {
				console.log(data.jumpstartModules);

				$('.jp-config-status').html(response);
				$('.spinner').hide();
			});

			return false;
		});
	}

})( jQuery, jetpackL10n.modules, jetpackL10n.currentVersion, jetpackL10n );
