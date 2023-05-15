let wpcomApiRequestTracker;

( function ( $ ) {
	let api;

	wpcomApiRequestTracker = api = {
		// The element that we will pad to prevent the debug bar
		// from overlapping the bottom of the page.
		body: undefined,

		init: function init() {
			// If we're not in the admin, pad the body.
			api.body = $( document.body );

			api.toggle.init();
			api.tabs();
			api.actions.init();
			api.updateAdminBarTitle();
		},

		updateAdminBarTitle: function () {
			/* eslint-disable no-undef */
			if ( typeof wpcom_api_request_tracker_count === 'undefined' ) {
				setTimeout( api.updateAdminBarTitle, 100 );
			} else {
				const newTitle =
					$( '#wp-admin-bar-wpcom-api-request-tracker .ab-item' ).html() +
					' (<strong>' +
					wpcom_api_request_tracker_count +
					'</strong>)';
				$( '#wp-admin-bar-wpcom-api-request-tracker .ab-item' ).html( newTitle );
			}
			/* eslint-enable no-undef */
		},

		isVisible: function isVisible() {
			return api.body.hasClass( 'wpcom-api-request-tracker-visible' );
		},

		toggle: {
			init: function init() {
				$( '#wp-admin-bar-wpcom-api-request-tracker' ).on( 'click', function ( event ) {
					event.preventDefault();

					// Click on submenu item.
					if ( event.target.hash ) {
						const $menuLink = $( event.target.rel );

						// Open/close debug bar.
						if ( ! api.isVisible() ) {
							api.toggle.visibility();
						} else if ( $menuLink.hasClass( 'current' ) ) {
							$menuLink.removeClass( 'current' );
							api.toggle.visibility();

							return;
						}

						// Deselect other tabs and hide other panels.
						$( '.debug-menu-target' ).hide().trigger( 'wpcom-api-request-tracker-hide' );
						$( '.debug-menu-link' ).removeClass( 'current' );

						$menuLink.addClass( 'current' );
						$( event.target.hash ).show().trigger( 'wpcom-api-request-tracker-show' );
					} else {
						api.toggle.visibility();
					}
				} );
			},
			visibility: function visibility( show ) {
				show = typeof show === 'undefined' ? ! api.isVisible() : show;

				// Show/hide the debug bar.
				api.body.toggleClass( 'wpcom-api-request-tracker-visible', show );

				// Press/unpress the button.
				$( this ).toggleClass( 'active', show );
			},
		},

		tabs: function tabs() {
			const debugMenuLinks = $( '.debug-menu-link' ),
				debugMenuTargets = $( '.debug-menu-target' );

			debugMenuLinks.on( 'click', function ( event ) {
				const $this = $( this );

				event.preventDefault();

				if ( $this.hasClass( 'current' ) ) {
					return;
				}

				// Deselect other tabs and hide other panels.
				debugMenuTargets.hide().trigger( 'wpcom-api-request-tracker-hide' );
				debugMenuLinks.removeClass( 'current' );

				// Select the current tab and show the current panel.
				$this.addClass( 'current' );
				// The hashed component of the href is the id that we want to display.
				$( '#' + this.href.substr( this.href.indexOf( '#' ) + 1 ) )
					.show()
					.trigger( 'wpcom-api-request-tracker-show' );
			} );
		},

		actions: {
			init: function init() {
				const actions = $( '#wpcom-api-request-tracker-actions' );

				// Close the panel with the esc key if it's open.
				$( document ).on( 'keydown', function ( event ) {
					const key = event.key || event.which || event.keyCode;

					if ( 27 /* esc */ === key && api.isVisible() ) {
						event.preventDefault();
						api.actions.close();
					}
				} );

				$( '.maximize', actions ).on( 'click', api.actions.maximize );
				$( '.restore', actions ).on( 'click', api.actions.restore );
				$( '.close', actions ).on( 'click', api.actions.close );
			},
			maximize: function maximize() {
				api.body.removeClass( 'wpcom-api-request-tracker-partial' );
				api.body.addClass( 'wpcom-api-request-tracker-maximized' );
			},
			restore: function restore() {
				api.body.removeClass( 'wpcom-api-request-tracker-maximized' );
				api.body.addClass( 'wpcom-api-request-tracker-partial' );
			},
			close: function close() {
				api.toggle.visibility( false );
			},
		},
	};

	$( wpcomApiRequestTracker.init );
} )( jQuery );
