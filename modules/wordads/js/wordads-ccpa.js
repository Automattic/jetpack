/**
 * Outputs Javascript to handle California IP detection, consent modal, and setting of default cookies.
 */
( function () {
	/* global ccpaSettings */

	// Minimal Mozilla Cookie library
	// https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie/Simple_document.cookie_framework
	var cookieLib = {
		getItem: function ( e ) {
			return (
				( e &&
					decodeURIComponent(
						document.cookie.replace(
							new RegExp(
								'(?:(?:^|.*;)\\s*' +
									encodeURIComponent( e ).replace( /[\-\.\+\*]/g, '\\$&' ) +
									'\\s*\\=\\s*([^;]*).*$)|^.*$'
							),
							'$1'
						)
					) ) ||
				null
			);
		},
		setItem: function ( e, o, n, t, r, i ) {
			if ( ! e || /^(?:expires|max\-age|path|domain|secure)$/i.test( e ) ) {
				return ! 1;
			}
			var c = '';
			if ( n ) {
				switch ( n.constructor ) {
					case Number:
						c = n === 1 / 0 ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT' : '; max-age=' + n;
						break;
					case String:
						c = '; expires=' + n;
						break;
					case Date:
						c = '; expires=' + n.toUTCString();
				}
			}
			return (
				( 'rootDomain' !== r && '.rootDomain' !== r ) ||
					( r =
						( '.rootDomain' === r ? '.' : '' ) +
						document.location.hostname.split( '.' ).slice( -2 ).join( '.' ) ),
				( document.cookie =
					encodeURIComponent( e ) +
					'=' +
					encodeURIComponent( o ) +
					c +
					( r ? '; domain=' + r : '' ) +
					( t ? '; path=' + t : '' ) +
					( i ? '; secure' : '' ) ),
				! 0
			);
		},
	};

	var setDefaultOptInCookie = function () {
		var value = ccpaSettings.defaultOptinCookieString;
		var domain =
			'.wordpress.com' === location.hostname.slice( -14 ) ? '.rootDomain' : location.hostname;
		cookieLib.setItem( 'usprivacy', value, 365 * 24 * 60 * 60, '/', domain );
	};

	var setCcpaAppliesCookie = function ( value ) {
		var domain =
			'.wordpress.com' === location.hostname.slice( -14 ) ? '.rootDomain' : location.hostname;
		cookieLib.setItem( 'ccpa_applies', value, 24 * 60 * 60, '/', domain );
	};

	var injectLoadingMessage = function () {
		var wrapper = document.createElement( 'div' );
		document.body.insertBefore( wrapper, document.body.firstElementChild );
		wrapper.outerHTML =
			'<div id="ccpa-loading" class="cleanslate ccpa__loading-wrapper">' +
			'<div class="ccpa__loading-overlay">' +
			'<span class="ccpa__loading-message">' +
			ccpaSettings.strings.pleaseWait +
			'...</span>' +
			'</div>' +
			'</div>';
	};

	var destroyModal = function () {
		var node = document.querySelector( '#ccpa-modal' );

		if ( node ) {
			node.parentElement.removeChild( node );
		}
	};

	var injectModal = function () {
		destroyModal();

		injectLoadingMessage();

		var request = new XMLHttpRequest();
		request.open(
			'GET',
			ccpaSettings.ajaxUrl + '?action=privacy_optout_markup&security=' + ccpaSettings.ajaxNonce,
			true
		);
		request.onreadystatechange = function () {
			if ( 4 === this.readyState ) {
				if ( 200 === this.status ) {
					document.getElementById( 'ccpa-loading' ).remove();
					var wrapper = document.createElement( 'div' );
					document.body.insertBefore( wrapper, document.body.firstElementChild );
					wrapper.outerHTML = this.response;
					document.getElementById( 'ccpa-opt-out' ).focus();

					var optOut = document.querySelector( '#ccpa-modal .opt-out' );
					optOut.addEventListener( 'click', function ( e ) {
						var post = new XMLHttpRequest();
						post.open( 'POST', ccpaSettings.ajaxUrl, true );
						post.setRequestHeader(
							'Content-Type',
							'application/x-www-form-urlencoded; charset=UTF-8'
						);
						post.onreadystatechange = function () {
							if ( 4 === this.readyState ) {
								if ( 200 === this.status ) {
									var result = JSON.parse( this.response );

									if ( result && result.success ) {
										// Note: Cooke is set in HTTP response from POST, so only need to update the toggle switch state.
										if ( result.data ) {
											e.target.parentNode.classList.add( 'is-checked' );
											e.target.parentNode.parentNode.classList.add( 'is-checked' );
										} else {
											e.target.parentNode.classList.remove( 'is-checked' );
											e.target.parentNode.parentNode.classList.remove( 'is-checked' );
										}
									}
								}
							}
						};
						post.send(
							'action=privacy_optout&optout=' +
								e.target.checked +
								'&security=' +
								ccpaSettings.ajaxNonce
						);
					} );

					// need to init status based on cookie
					var usprivacyCookie = cookieLib.getItem( 'usprivacy' );

					var optout = usprivacyCookie && 'Y' === usprivacyCookie[ 2 ];

					var toggle = document.querySelector( '#ccpa-modal .opt-out' );
					toggle.checked = optout;

					if ( optout ) {
						toggle.parentNode.classList.add( 'is-checked' );
						toggle.parentNode.parentNode.classList.add( 'is-checked' );
					}

					var buttons = document.querySelectorAll( '#ccpa-modal .components-button' );
					Array.prototype.forEach.call( buttons, function ( el ) {
						el.addEventListener( 'click', function () {
							destroyModal();
						} );
					} );
				}
			}
		};

		request.send();
	};

	var doNotSellCallback = function () {
		var dnsLinks = document.querySelectorAll( '.ccpa-do-not-sell' );

		if ( 0 === dnsLinks.length ) {
			return false;
		}

		Array.prototype.forEach.call( dnsLinks, function ( dnsLink ) {
			dnsLink.addEventListener( 'click', function ( e ) {
				e.preventDefault();

				if ( ! ccpaSettings.stylesLoaded ) {
					// Load wordads-ccpa.min.css
					var ccpaCss = document.createElement( 'link' );
					ccpaCss.rel = 'stylesheet';
					ccpaCss.type = 'text/css';
					ccpaCss.href = ccpaSettings.ccpaCssUrl;
					document.getElementsByTagName( 'HEAD' )[ 0 ].appendChild( ccpaCss );

					ccpaSettings.stylesLoaded = true;
				}

				injectModal();
			} );

			dnsLink.style.display = '';
		} );

		return true;
	};

	// Initialization.
	document.addEventListener( 'DOMContentLoaded', function () {
		// CCPA consent value storage.
		var usprivacyCookie = cookieLib.getItem( 'usprivacy' );

		if ( null !== usprivacyCookie ) {
			doNotSellCallback();
			return;
		}

		// Cache for geo location.
		var ccpaCookie = cookieLib.getItem( 'ccpa_applies' );

		if ( null === ccpaCookie ) {
			var request = new XMLHttpRequest();
			request.open( 'GET', 'https://public-api.wordpress.com/geo/', true );

			request.onreadystatechange = function () {
				if ( 4 === this.readyState ) {
					if ( 200 === this.status ) {
						var data = JSON.parse( this.response );
						var ccpa_applies = data[ 'region' ] && data[ 'region' ].toLowerCase() === 'california';

						setCcpaAppliesCookie( ccpa_applies );

						if ( ccpa_applies ) {
							if ( doNotSellCallback() ) {
								setDefaultOptInCookie();
							}
						}
					} else {
						setCcpaAppliesCookie( true );

						if ( doNotSellCallback() ) {
							setDefaultOptInCookie();
						}
					}
				}
			};

			request.send();
		} else {
			if ( ccpaCookie === 'true' ) {
				if ( doNotSellCallback() ) {
					setDefaultOptInCookie();
				}
			}
		}

		// Check for override for site admins.
		if ( 'true' === ccpaSettings.forceApplies ) {
			doNotSellCallback();
			return;
		}
	} );
} )();
