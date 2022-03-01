/* global ajaxurl, jetpackAdminMenu */

( function () {
	function init() {
		var adminbar = document.querySelector( '#wpadminbar' );
		var wpwrap = document.querySelector( '#wpwrap' );
		var adminMenu = document.querySelector( '#adminmenu' );

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

			const jitmDismissButton = adminMenu.querySelector( '.dismissible-card__close-icon' );
			if ( jitmDismissButton ) {
				jitmDismissButton.addEventListener( 'click', function ( event ) {
					event.preventDefault();

					const siteNotice = document.getElementById( 'toplevel_page_site-notices' );
					if ( siteNotice ) {
						siteNotice.style.display = 'none';
					}

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
				} );
			}
		}
	}

	function makeAjaxRequest( method, url, contentType, body ) {
		var xhr = new XMLHttpRequest();
		xhr.open( method, url, true );
		xhr.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
		if ( contentType ) {
			xhr.setRequestHeader( 'Content-Type', contentType );
		}
		xhr.withCredentials = true;
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

		currentMenuItem.focus();
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
