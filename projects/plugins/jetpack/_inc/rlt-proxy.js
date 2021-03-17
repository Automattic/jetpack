// listen for rlt authentication events and pass them to children of this document.
( function () {
	var currentToken;
	var parentOrigin;
	var iframeOrigins;
	var RLT_KEY = 'jetpack:wpcomRLT';

	// IE11 compat version that doesn't require on `new URL( src )`
	function getOriginFromUrl( url ) {
		var parser = document.createElement( 'a' );
		parser.href = url;
		return parser.origin;
	}

	// run on `load` for suitable iframes, this injects the current token if available
	function rltIframeInjector( event ) {
		if ( ! currentToken ) {
			return;
		}
		rltInjectToken(
			currentToken,
			event.target.contentWindow,
			getOriginFromUrl( event.target.src )
		);
	}

	// run on DOMContentLoaded or later
	function rltMonitorIframes() {
		// wait until suitable iframes are loaded before trying to inject the RLT
		var iframes = document.querySelectorAll( 'iframe' );
		for ( var i = 0; i < iframes.length; i++ ) {
			var iframe = iframes[ i ];
			if ( rltShouldAuthorizeIframe( iframe ) ) {
				iframe.addEventListener( 'load', rltIframeInjector );
			}
		}

		// listen for newly-created iframes, since some are injected dynamically
		var observer = new MutationObserver( function ( mutationsList ) {
			for ( var i = 0; i < mutationsList.length; i++ ) {
				var mutation = mutationsList[ i ];
				if ( mutation.type === 'childList' ) {
					for ( var j = 0; j < mutation.addedNodes.length; j++ ) {
						var node = mutation.addedNodes[ j ];
						if (
							node instanceof HTMLElement &&
							node.nodeName === 'IFRAME' &&
							rltShouldAuthorizeIframe( node )
						) {
							node.addEventListener( 'load', rltIframeInjector );
						}
					}
				}
			}
		} );

		observer.observe( document.body, { subtree: true, childList: true } );
	}

	// should we inject RLT into this iframe?
	function rltShouldAuthorizeIframe( iframe ) {
		if ( ! Array.isArray( iframeOrigins ) ) {
			return;
		}
		return iframeOrigins.indexOf( getOriginFromUrl( iframe.src ) ) >= 0;
	}

	function rltInvalidateWindowToken( token, target, origin ) {
		pm( {
			target: target,
			type: 'rltMessage',
			data: {
				event: 'invalidate',
				token: token,
				sourceOrigin: window.location.origin,
			},
			origin: origin,
		} );
	}

	/**
	 * PUBLIC METHODS
	 */
	window.rltInvalidateToken = function ( token, sourceOrigin ) {
		// invalidate in current context
		if ( token === currentToken ) {
			currentToken = null;
		}

		// remove from localstorage, but only if in a top level window, not iframe
		try {
			if ( window.location === window.parent.location && window.localStorage ) {
				if ( window.localStorage.getItem( RLT_KEY ) === token ) {
					window.localStorage.removeItem( RLT_KEY );
				}
			}
		} catch ( e ) {
			console.info(
				'localstorage access for invalidate denied - probably blocked third-party access',
				window.location.href
			);
		}

		// invalidate in iframes
		var iframes = document.querySelectorAll( 'iframe' );
		for ( var i = 0; i < iframes.length; i++ ) {
			var iframe = iframes[ i ];
			var iframeOrigin = getOriginFromUrl( iframe.src );
			if ( iframeOrigin !== sourceOrigin && rltShouldAuthorizeIframe( iframe ) ) {
				rltInvalidateWindowToken( token, iframe.contentWindow, iframeOrigin );
			}
		}

		// invalidate in parentt
		if ( parentOrigin && parentOrigin !== sourceOrigin && window.parent ) {
			rltInvalidateWindowToken( token, window.parent, parentOrigin );
		}
	};

	window.rltInjectToken = function ( token, target, origin ) {
		pm( {
			target: target,
			type: 'loginMessage',
			data: {
				event: 'login',
				success: true,
				type: 'rlt',
				token: token,
				sourceOrigin: window.location.origin,
			},
			origin: origin,
		} );
	};

	window.rltIsAuthenticated = function () {
		return !! currentToken;
	};

	window.rltGetToken = function () {
		return currentToken;
	};

	// store the token in localStorage
	window.rltStoreToken = function ( token ) {
		currentToken = token;
		try {
			if ( window.location === window.parent.location && window.localStorage ) {
				window.localStorage.setItem( RLT_KEY, token );
			}
		} catch ( e ) {
			console.info(
				'localstorage access denied - probably blocked third-party access',
				window.location.href
			);
		}
	};

	window.rltInitialize = function ( config ) {
		if ( ! config || typeof window.pm !== 'function' ) {
			return;
		}

		currentToken = config.token;
		iframeOrigins = config.iframeOrigins;
		parentOrigin = config.parentOrigin; // needed?

		// load token from localStorage if possible, but only in top level window
		try {
			if ( ! currentToken && window.location === window.parent.location && window.localStorage ) {
				currentToken = window.localStorage.getItem( RLT_KEY );
			}
		} catch ( e ) {
			console.info(
				'localstorage access denied - probably blocked third-party access',
				window.location.href
			);
		}

		// listen for RLT events from approved origins
		pm.bind( 'loginMessage', function ( event ) {
			if ( 'rlt' === event.type && event.token && event.token !== currentToken ) {
				// put into localStorage if running in top-level window (not iframe)
				rltStoreToken( event.token );

				// send to allowlisted iframes
				var iframes = document.querySelectorAll( 'iframe' );
				for ( var i = 0; i < iframes.length; i++ ) {
					var iframe = iframes[ i ];
					if ( rltShouldAuthorizeIframe( iframe ) ) {
						rltInjectToken( currentToken, iframe.contentWindow, getOriginFromUrl( iframe.src ) );
					}
				}

				// send to the parent, unless the event was sent _by_ the parent
				if ( parentOrigin && parentOrigin !== event.sourceOrigin && window.parent ) {
					rltInjectToken( currentToken, window.parent, parentOrigin );
				}
			}
		} );

		// listen for RLT events from approved origins
		pm.bind( 'rltMessage', function ( event ) {
			if ( 'invalidate' === event.event && event.token && event.token === currentToken ) {
				rltInvalidateToken( event.token );
			}
		} );

		if ( iframeOrigins ) {
			if ( document.readyState !== 'loading' ) {
				rltMonitorIframes();
			} else {
				window.addEventListener( 'DOMContentLoaded', rltMonitorIframes );
			}
		}
	};
} )();
