// ==========================================================================
// SVG sprite loading and caching
// This file should be at the top of the body to avoid a flash
// Usage: loadSprite('https://cdn.com/path/to/sprite.svg', 'sprite-id');
// The second argument is optional but prevents loading twice
// ==========================================================================

( function () {
	const loadSprite = function ( url, id ) {
		if ( typeof url !== 'string' ) {
			return;
		}

		const body = document.body;
		const prefix = 'cache-';
		const hasId = typeof id === 'string';
		let isCached = false;

		// Check for *actual* storage support
		const cacheSupported = ( function () {
			if ( ! hasId ) {
				return false;
			}
			const test = '___test';
			try {
				localStorage.setItem( test, test );
				localStorage.removeItem( test );
				return true;
			} catch ( e ) {
				return false;
			}
		} )();

		/**
		 * Insert SVG sprite into the DOM
		 *
		 * @param {object} container - The svg container.
		 * @param {string} data - The svg data.
		 */
		function updateSprite( container, data ) {
			// Inject content
			container.innerHTML = data;

			// Inject the SVG to the body
			body.insertBefore( container, body.childNodes[ 0 ] );
		}

		// Only load once
		if ( ! hasId || document.querySelectorAll( '#' + id ).length === 0 ) {
			// Create container
			const container = document.createElement( 'div' );
			container.setAttribute( 'hidden', '' );

			if ( hasId ) {
				container.setAttribute( 'id', id );
			}

			// Check in cache
			if ( cacheSupported ) {
				const cached = localStorage.getItem( prefix + id );
				isCached = cached !== null;

				if ( isCached ) {
					const data = JSON.parse( cached );
					updateSprite( container, data.content );
				}
			}

			// ReSharper disable once InconsistentNaming
			const xhr = new XMLHttpRequest();

			// XHR for Chrome/Firefox/Opera/Safari
			if ( 'withCredentials' in xhr ) {
				xhr.open( 'GET', url, true );
			}
			// Not supported
			else {
				return;
			}

			// Once loaded, inject to container and body
			xhr.onload = function () {
				if ( cacheSupported ) {
					localStorage.setItem(
						prefix + id,
						JSON.stringify( {
							content: xhr.responseText,
						} )
					);
				}

				updateSprite( container, xhr.responseText );
			};

			xhr.send();
		}
	};
	loadSprite(
		'https://widgets.wp.com/calypso-happychat/images/gridicons-506499ddac13811fee8e.svg',
		'gridicons'
	);
} )();
