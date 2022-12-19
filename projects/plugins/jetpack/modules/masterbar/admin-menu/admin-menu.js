/* global ajaxurl, jetpackAdminMenu */

( function () {
	function init() {
		var adminbar = document.querySelector( '#wpadminbar' );
		var wpwrap = document.querySelector( '#wpwrap' );
		var adminMenu = document.querySelector( '#adminmenu' );
		var dismissClass = 'dismissible-card__close-icon';

		if ( ! adminbar ) {
			return;
		}

		function setAriaExpanded( value ) {
			var anchors = adminbar.querySelectorAll( '#wp-admin-bar-blog a' );
			for ( var i = 0; i < anchors.length; i++ ) {
				anchors[ i ].setAttribute( 'aria-expanded', value );
			}
		}

		setFocusOnActiveMenuItem();
		setAriaExpanded( 'false' );

		var adminbarBlog = adminbar.querySelector( '#wp-admin-bar-blog' );
		// Toggle sidebar when toggle is clicked.
		if ( adminbarBlog ) {
			adminbarBlog.addEventListener( 'click', function ( event ) {
				event.preventDefault();

				// Close any open toolbar submenus.
				var hovers = adminbar.querySelectorAll( '.hover' );
				for ( var i = 0; i < hovers.length; i++ ) {
					hovers[ i ].classList.remove( 'hover' );
				}

				wpwrap.classList.toggle( 'wp-responsive-open' );
				if ( wpwrap.classList.contains( 'wp-responsive-open' ) ) {
					setAriaExpanded( 'true' );
					var first = document.querySelector( '#adminmenu a' );
					if ( first ) {
						first.focus();
					}
				} else {
					setAriaExpanded( 'false' );
				}
			} );
		}

		if ( adminMenu ) {
			var collapseButton = adminMenu.querySelector( '#collapse-button' );
			// Nav-Unification feature:
			// Saves the sidebar state in server when "Collapse menu" is clicked.
			// This is needed so that we update WPCOM for this preference in real-time.
			if ( collapseButton ) {
				collapseButton.addEventListener( 'click', function ( event ) {
					// Let's the core event listener be triggered first.
					setTimeout( function () {
						saveSidebarIsExpanded( event.target.parentNode.ariaExpanded );
					}, 50 );
				} );
			}

			adminMenu.addEventListener( 'click', function ( event ) {
				if (
					event.target.classList.contains( dismissClass ) ||
					event.target.closest( '.' + dismissClass )
				) {
					event.preventDefault();

					const siteNotice = document.getElementById( 'toplevel_page_site-notices' );
					if ( siteNotice ) {
						siteNotice.style.display = 'none';
					}

					const jitmDismissButton = event.target;

					makeAjaxRequest(
						'POST',
						ajaxurl,
						'application/x-www-form-urlencoded; charset=UTF-8',
						'id=' +
							encodeURIComponent( jitmDismissButton.dataset.feature_id ) +
							'&feature_class=' +
							encodeURIComponent( jitmDismissButton.dataset.feature_class ) +
							'&action=jitm_dismiss' +
							'&_ajax_nonce=' +
							jetpackAdminMenu.jitmDismissNonce
					);
				}
			} );

			makeAjaxRequest(
				'GET',
				ajaxurl + '?action=upsell_nudge_jitm&_ajax_nonce=' + jetpackAdminMenu.upsellNudgeJitm,
				undefined,
				null,
				function ( xhr ) {
					try {
						if ( xhr.readyState === XMLHttpRequest.DONE ) {
							if ( xhr.status === 200 && xhr.responseText ) {
								adminMenu
									.querySelector( '#toplevel_page_site_card' )
									.insertAdjacentHTML( 'afterend', xhr.responseText );
							}
						}
					} catch ( error ) {
						// On failure, we just won't display an upsell nudge
					}
				}
			);
		}

		if ( jetpackAdminMenu.isAtomic ) {
			document.querySelectorAll( 'li.wp-has-submenu.wp-not-current-submenu' ).forEach( function ( el ) {
				const submenu = el.querySelector( '.wp-submenu' );
				const linkElement = el.querySelector( 'a' );

				el.addEventListener( 'mouseover', function() {
					submenu.style.display = null;
					submenu.style.top = '-1px';
					if ( ! isElementInViewport( submenu ) ) {
						// Repoisition the submenu to the top of the menu item.
						submenu.style.top = ( linkElement.clientHeight - submenu.clientHeight ) + 'px';
					}
					linkElement.focus();
				} );

				el.addEventListener( 'mouseleave', function() {
					submenu.style.display = 'none';
					submenu.style.top = null;
					if ( document.activeElement === linkElement ) {
						linkElement.blur();
					}
				} );
			} );
		}
	}

	function isElementInViewport( el ) {
		var rect = el.getBoundingClientRect();

		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			// Tries to primarily use the window viewport, but if that's not available, uses the documentElement.
			// The innerWidth attribute must return the viewport width including the size of a rendered scroll bar (if any), or zero if there is no viewport.
			rect.bottom <= ( window.innerHeight || document.documentElement.clientHeight ) &&
			rect.right <= ( window.innerWidth || document.documentElement.clientWidth )
		);
	}

	function makeAjaxRequest( method, url, contentType, body = null, callback = null ) {
		var xhr = new XMLHttpRequest();
		xhr.open( method, url, true );
		xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
		if ( contentType ) {
			xhr.setRequestHeader( 'Content-Type', contentType );
		}
		xhr.withCredentials = true;
		if ( callback ) {
			xhr.onreadystatechange = function () {
				callback( xhr );
			};
		}
		xhr.send( body );
	}

	function saveSidebarIsExpanded( expanded ) {
		makeAjaxRequest(
			'POST',
			ajaxurl,
			'application/x-www-form-urlencoded; charset=UTF-8',
			'action=sidebar_state&expanded=' + expanded
		);
	}

	function setFocusOnActiveMenuItem() {
		var currentMenuItem = document.querySelector( '.wp-submenu .current > a' );

		if ( ! currentMenuItem ) {
			return;
		}

		currentMenuItem.focus( { preventScroll: true } );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
