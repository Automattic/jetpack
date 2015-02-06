/* global wp, jetpackL10n, jQuery */

(function( $, modules, currentVersion, jetpackL10n ) {

	///////////////////////////////////////
	// INIT
	///////////////////////////////////////

	var originPoint;

	$( document ).ready(function () {
		initEvents();
		filterModules( 'introduced' );
		loadModules();
		updateModuleCount();
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

	function filterModules( prop ) {

		// Mapping prior to sorting improves performance by over 50%
		var map = [],
			result = [],
			val = '',
			i,
			length;

		// create the map
		for ( i = 0, length = modules.length; i < length; i++ ) {

			// Prep value
			if ( 'name' === prop ) {
				val = modules[i][prop].toLowerCase();
			} else {
				val = parseInt( modules[i][prop].replace( '0:', '' ) * 10, 10 );
			}

			map.push( {
				index: i,
				value: val
			});
		}

		// sort the map
		map.sort(function( a, b ) {
			if ( 'name' === prop ) {
				return a.value > b.value ? 1 : -1;
			} else {
				return b.value > a.value ? 1 : -1;
			}
		});

		// copy values in right order
		for ( i = 0, length = map.length; i < length; i++ ) {
			result.push( modules[map[i].index] );
			result[i].index =  i; // make sure we set the index to the right order
		}

		// Replace old object, with newly sorted object
		modules = result;

		// If all modules are already showing, make sure they stay expanded
		if ( ! $( '.load-more' ).is( ':visible' ) ) {
			$( '.module' ).fadeIn();
		}
	}

	function filterModulesByCategory() {
		var categories,
			c, i, catId;

		// First alphabatize the modules
		filterModules( 'name' );

		// Add category containers
		$( '.modules' ).html( wp.template( 'category' )( {} ) );

		// Loop through adding sections for each category
		for ( i = 0; i < modules.length; i++ ) {
			// Get categories
			categories = modules[i].module_tags;

			// Loop through each individual category
			for ( c = 0; c < categories.length; c++ ) {
				// Add modules to the correct categories
				catId = 'category-' + categories[c].toLowerCase().replace( '.', '' ).replace( / /g, '-' );
				$( '.' + catId + ' .clear' ).before( wp.template( 'mod' )( modules[i] ) );
			}
		}

		recalculateModuleHeights();
		initModalEvents();
	}

	function initEvents () {
		// DOPS toggle
		$( '#a8c-service-toggle, .dops-close' ).click(function() {
			$( '.a8c-dops' ).toggleClass( 'show' );
			$( '#a8c-service-toggle .genericon' ).toggleClass( 'genericon-downarrow' ).toggleClass( 'genericon-uparrow' );
			return false;
		});

		// Load more
		$( '.load-more' ).click(function() {
			showAllModules();
			return false;
		});

		// Module filtering
		$( '#newest, #category, #alphabetical' ).on( 'click', function () {
			var $this = $( this ),
				prop = $this.data( 'filter' );

			// Reset selected filter
			$( '.jp-filter a' ).removeClass( 'selected' );
			$this.addClass( 'selected' );

			if ( 'cat' === prop ) {
				filterModulesByCategory();
			} else {
				// Rearrange modules
				filterModules( prop );

				// Reload the DOM based on this new sort order
				loadModules();
			}

			showAllModules();
			return false;
		});

		// Search modules
		$( '#jetpack-search' ).on( 'keyup search', function() {
			var term = $( this ).val();
			searchModules( term );
		});
		// prevent the form from
		$( '#module-search' ).on( 'submit', function( event ) {
			event.preventDefault();
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

		// Close shade toggle
		closeShadeToggle();

		// Show specific category of modules
		$( '.showFilter a' ).on( 'click', function () {
			$( '.showFilter a' ).removeClass( 'active' );
			$( this ).addClass( 'active' );

			// TODO Do sorting here

			return false;
		});
	}

	function initModalEvents() {
		var $modal = $( '.modal' );
		$( '.module, .feature a, .configs a' ).on( 'click keypress', function (e) {
			// Only show modal on enter when keypress recorded (accessibility)
			if ( e.keyCode && 13 !== e.keyCode ) {
				return;
			}

			e.preventDefault();

			$( '.shade' ).show();

			// Show loading message on init
			$modal.html( wp.template( 'modalLoading' )( {} ) ).fadeIn();

			// Load & populate with content
			var $this = $( this ),
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

	function loadModules() {
		var html = '',
			featuredModules = [],
			featuredModulesIndex,
			i;

		if ( $( '.configure' ).length !== 0 ) {
			// Config page
			for ( i = 0; i < modules.length; i++ ) {
				html += wp.template( 'modconfig' )( modules[i] );
			}

			$( 'table tbody' ).html( html );
		} else {
			// Array of featured modules
			$( '.feature a.f-img' ).each(function() {
				featuredModules.push($( this ).data( 'module' ));
			});

			// About page
			for ( i = 0; i < modules.length; i++ ) {
				if ( currentVersion.indexOf( modules[i].introduced ) === 0 ) {
					modules[i]['new'] = true;
				}

				// Add data-index to featured modules
				featuredModulesIndex = featuredModules.indexOf( modules[i].module );
				if ( featuredModulesIndex > -1 ) {
					$( '.feature' ).eq( featuredModulesIndex ).find( 'a' ).data( 'index', i );
				}

				modules[i].index = i;

				html += wp.template( 'mod' )( modules[i] );
			}

			$( '.modules' ).html( html );

			recalculateModuleHeights();
			initModalEvents();
		}
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

	function searchModules( term ) {
		var html = '', i, lowercaseDesc, lowercaseName, lowercaseTerm;
		for ( i = 0; i < modules.length; i++ ) {
			lowercaseDesc = modules[i].description.toLowerCase();
			lowercaseName = modules[i].name.toLowerCase();
			lowercaseTerm = term.toLowerCase();
			if ( lowercaseName.indexOf( lowercaseTerm ) !== -1 || lowercaseDesc.indexOf( lowercaseTerm ) !== -1 ) {
				html += wp.template( 'mod' )( modules[i] );
			}
			$( '.modules' ).html( html );
		}
		if ( '' === html ) {
			$( '.modules' ).text( jetpackL10n.no_modules_found.replace( '{term}', term ) );
		}
		recalculateModuleHeights();
		initModalEvents();
	}

	function showAllModules() {
		$( '.module' ).fadeIn();
		$( '.load-more' ).hide();
	}

	function updateModuleCount () {
		$( '.load-more' ).text( jetpackL10n.view_all_features );
	}

})( jQuery, jetpackL10n.modules, jetpackL10n.currentVersion, jetpackL10n );
