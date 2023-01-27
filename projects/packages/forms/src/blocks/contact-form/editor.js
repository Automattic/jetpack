import apiFetch from '@wordpress/api-fetch';
import { childBlocks } from './child-blocks';
import registerJetpackBlock from './util/register-jetpack-block';
import { name, settings } from '.';

// Register middleware for @wordpress/api-fetch to indicate the fetch is coming from the editor.
apiFetch.use( ( options, next ) => {
	// Skip explicit cors requests.
	if ( options.mode === 'cors' ) {
		return next( options );
	}

	// If a URL is set, skip if it's not same-origin.
	// @see https://html.spec.whatwg.org/multipage/origin.html#same-origin
	if ( options.url ) {
		try {
			const url = new URL( options.url, location.href );
			if (
				url.protocol !== location.protocol ||
				url.hostname !== location.hostname ||
				url.port !== location.port
			) {
				return next( options );
			}
		} catch {
			// Huh? Skip it.
			return next( options );
		}
	}

	// Ok, add header.
	if ( ! options.headers ) {
		options.headers = {};
	}
	options.headers[ 'x-wp-api-fetch-from-editor' ] = 'true';
	return next( options );
} );

registerJetpackBlock( name, settings, childBlocks );
