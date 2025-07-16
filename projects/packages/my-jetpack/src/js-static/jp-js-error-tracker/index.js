/**
 * JPJSErrorTracker - Simplified JavaScript error tracking library
 * Captures all JavaScript errors and passes them to a callback
 * @param {object} global - The global object (window in browsers)
 */
( function ( global ) {
	/**
	 * JPJSErrorTracker constructor
	 * @param {Function} onError            - Callback function that receives error data
	 * @param {object}   options            - Configuration options
	 * @param {number}   options.throttleMs - Throttle time in milliseconds (default: 5000)
	 * @param {number}   options.maxErrors  - Maximum number of errors to track (default: 100)
	 */
	function JPJSErrorTracker( onError, options = {} ) {
		if ( typeof onError !== 'function' ) {
			throw new Error( 'JPJSErrorTracker requires an onError callback function' );
		}

		this.onError = onError;
		this.sessionId = this.generateSessionId();
		this.pageLoadTime = Date.now();
		this.errorCount = 0;
		this.throttledErrors = new Map();
		this.throttleMs = options.throttleMs || 5000;
		this.maxErrors = options.maxErrors || 100;
		this.errorHistory = [];

		this.init();
	}

	JPJSErrorTracker.prototype = {
		init: function () {
			this.setupErrorHandlers();
			this.setupResourceMonitoring();
			this.setupNetworkMonitoring();
			this.setupPerformanceMonitoring();
		},

		generateSessionId: function () {
			const timestamp = Date.now().toString();
			let randomPart = '';

			if ( typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues ) {
				const array = new Uint32Array( 3 );
				window.crypto.getRandomValues( array );
				randomPart = array.reduce( ( acc, val ) => acc + val.toString( 36 ), '' ).substring( 0, 9 );
			} else {
				randomPart = Math.random().toString( 36 ).substring( 2, 11 );
			}

			return 'jp_' + timestamp + '_' + randomPart;
		},

		setupErrorHandlers: function () {
			const self = this;

			// Window error handler
			const originalOnError = window.onerror;
			window.onerror = function ( message, source, line, col, error ) {
				self.captureError( {
					type: 'javascript',
					source: 'window.onerror',
					message: message,
					filename: source,
					lineno: line,
					colno: col,
					stack: error && error.stack,
					error: error,
				} );

				if ( originalOnError ) {
					return originalOnError.apply( this, arguments );
				}
				return false;
			};

			// Error event listener
			window.addEventListener( 'error', function ( event ) {
				if ( event.target !== window ) {
					// Resource error
					self.captureError( {
						type: 'resource',
						source: 'addEventListener',
						message: 'Resource failed to load: ' + self.getResourceName( event.target ),
						filename: event.target.src || event.target.href,
						element: event.target.tagName.toLowerCase(),
						lineno: null,
						colno: null,
						stack: null,
					} );
				}
			} );

			// Unhandled promise rejections
			window.addEventListener( 'unhandledrejection', function ( event ) {
				self.captureError( {
					type: 'promise',
					source: 'unhandledrejection',
					message: self.getPromiseErrorMessage( event.reason ),
					filename: 'Promise',
					lineno: null,
					colno: null,
					stack: event.reason && event.reason.stack,
					error: event.reason,
				} );

				event.preventDefault();
			} );
		},

		setupResourceMonitoring: function () {
			const self = this;

			document.addEventListener( 'DOMContentLoaded', function () {
				const resources = document.querySelectorAll( 'img, script[src], link[rel="stylesheet"]' );

				Array.from( resources ).forEach( function ( element ) {
					if ( ! element.hasAttribute( 'data-error-tracked' ) ) {
						element.setAttribute( 'data-error-tracked', 'true' );
						element.addEventListener( 'error', function () {
							self.captureError( {
								type: 'resource',
								source: 'DOMContentLoaded',
								message: 'Resource failed to load: ' + self.getResourceName( element ),
								filename: element.src || element.href,
								element: element.tagName.toLowerCase(),
								lineno: null,
								colno: null,
								stack: null,
							} );
						} );
					}
				} );
			} );
		},

		setupNetworkMonitoring: function () {
			const self = this;

			// Monitor fetch - prevent double-monkeypatching
			if ( window.fetch && ! window._jpOriginalFetch ) {
				window._jpOriginalFetch = window.fetch;
				window.fetch = function () {
					const args = arguments;
					const url = args[ 0 ];

					return window._jpOriginalFetch.apply( this, args ).catch( function ( error ) {
						self.captureError( {
							type: 'network',
							source: 'fetch',
							message: 'Fetch request failed: ' + self.getUrlForError( url ),
							filename: 'Network',
							url: url,
							lineno: null,
							colno: null,
							stack: error.stack,
							error: error,
						} );
						throw error;
					} );
				};
			}

			// Monitor XMLHttpRequest - prevent double-monkeypatching
			if ( window.XMLHttpRequest && ! window._jpOriginalXHR ) {
				window._jpOriginalXHR = window.XMLHttpRequest;
				window.XMLHttpRequest = function () {
					const xhr = new window._jpOriginalXHR();
					const originalOpen = xhr.open;
					const originalSend = xhr.send;
					let requestUrl = '';

					xhr.open = function ( method, url ) {
						requestUrl = url;
						return originalOpen.apply( this, arguments );
					};

					xhr.send = function () {
						xhr.addEventListener( 'error', function () {
							self.captureError( {
								type: 'network',
								source: 'XMLHttpRequest',
								message: 'XHR request failed: ' + self.getUrlForError( requestUrl ),
								filename: 'Network',
								url: requestUrl,
								lineno: null,
								colno: null,
								stack: null,
							} );
						} );
						return originalSend.apply( this, arguments );
					};

					return xhr;
				};
			}
		},

		setupPerformanceMonitoring: function () {
			const self = this;

			// Long task monitoring
			if ( 'PerformanceObserver' in window ) {
				try {
					const observer = new PerformanceObserver( function ( list ) {
						for ( const entry of list.getEntries() ) {
							if ( entry.entryType === 'longtask' && entry.duration > 50 ) {
								self.captureError( {
									type: 'performance',
									source: 'PerformanceObserver',
									message: 'Long task detected: ' + entry.duration.toFixed( 1 ) + 'ms',
									filename: 'Performance',
									duration: entry.duration,
									lineno: null,
									colno: null,
									stack: null,
								} );
							}
						}
					} );
					observer.observe( { entryTypes: [ 'longtask' ] } );
				} catch {
					// Performance observer not supported - silently ignore
				}
			}
		},

		getPromiseErrorMessage: function ( reason ) {
			if ( typeof reason === 'string' ) {
				return 'Promise rejected: ' + reason;
			}
			if ( reason && reason.message ) {
				return 'Promise rejected: ' + reason.message;
			}
			if ( reason && reason.toString ) {
				return 'Promise rejected: ' + reason.toString();
			}
			return 'Promise rejected with unknown reason';
		},

		getResourceName: function ( element ) {
			const src = element.src || element.href;
			if ( ! src ) return element.tagName.toLowerCase();

			const parts = src.split( '/' );
			const filename = parts[ parts.length - 1 ];
			return filename || src;
		},

		getUrlForError: function ( url ) {
			if ( typeof url === 'string' ) {
				return url.length > 100 ? url.substring( 0, 100 ) + '...' : url;
			}
			return String( url );
		},

		captureError: function ( errorData ) {
			// Simple throttling
			const errorKey =
				errorData.type +
				'|' +
				errorData.message +
				'|' +
				errorData.filename +
				'|' +
				errorData.lineno;
			const now = Date.now();

			if ( this.throttledErrors.has( errorKey ) ) {
				const lastTime = this.throttledErrors.get( errorKey );
				if ( now - lastTime < this.throttleMs ) {
					return;
				}
			}
			this.throttledErrors.set( errorKey, now );

			// Enrich error data
			const enrichedError = {
				...errorData,
				timestamp: now,
				sessionId: this.sessionId,
				url: window.location.href,
				userAgent: navigator.userAgent,
				viewport: {
					width: window.innerWidth,
					height: window.innerHeight,
				},
				timeFromPageLoad: now - this.pageLoadTime,
				errorCount: ++this.errorCount,
				location: {
					pathname: window.location.pathname,
					search: window.location.search,
					hash: window.location.hash,
					host: window.location.host,
				},
				browser: {
					language: navigator.language,
					platform: navigator.platform,
					cookieEnabled: navigator.cookieEnabled,
					onLine: navigator.onLine,
				},
				page: {
					title: document.title,
					referrer: document.referrer,
					readyState: document.readyState,
				},
			};

			// Add to error history with size limit
			this.errorHistory.push( enrichedError );
			if ( this.errorHistory.length > this.maxErrors ) {
				this.errorHistory.shift();
			}

			// Call the callback
			try {
				this.onError( enrichedError );
			} catch ( callbackError ) {
				// eslint-disable-next-line no-console
				console.error( 'JPJSErrorTracker: Error in onError callback:', callbackError );
			}
		},

		getErrorHistory: function () {
			return this.errorHistory.slice();
		},

		getErrorCount: function () {
			return this.errorCount;
		},

		clearErrors: function () {
			this.errorHistory = [];
			this.errorCount = 0;
			this.throttledErrors.clear();
		},

		cleanup: function () {
			// Restore original fetch if it was monkeypatched
			if ( window._jpOriginalFetch ) {
				window.fetch = window._jpOriginalFetch;
				delete window._jpOriginalFetch;
			}

			// Restore original XMLHttpRequest if it was monkeypatched
			if ( window._jpOriginalXHR ) {
				window.XMLHttpRequest = window._jpOriginalXHR;
				delete window._jpOriginalXHR;
			}

			// Clear errors
			this.clearErrors();
		},
	};

	// Export
	if ( typeof module !== 'undefined' && module.exports ) {
		module.exports = JPJSErrorTracker;
		// eslint-disable-next-line no-undef
	} else if ( typeof define === 'function' && define.amd ) {
		// eslint-disable-next-line no-undef
		define( [], function () {
			return JPJSErrorTracker;
		} );
	} else {
		global.JPJSErrorTracker = JPJSErrorTracker;
	}
} )( typeof window !== 'undefined' ? window : this );
