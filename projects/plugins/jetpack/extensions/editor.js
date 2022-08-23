import apiFetch from '@wordpress/api-fetch';
import analytics from '../_inc/client/lib/analytics';
import './extended-blocks';
import './shared/public-path';
import './shared/block-category';
import './shared/plan-upgrade-notification';
import './shared/stripe-connection-notification';
import './shared/external-media';
import './extended-blocks/core-embed';
import './extended-blocks/core-social-links';
import './extended-blocks/paid-blocks';
import './shared/styles/slideshow-fix.scss';
import './shared/styles/external-link-fix.scss';
// Register media source store to the centralized data registry.
import './store/media-source';
import './store/membership-products';

// @TODO Please make a shared analytics solution and remove this!
if (
	typeof window === 'object' &&
	typeof window.Jetpack_Editor_Initial_State === 'object' &&
	typeof window.Jetpack_Editor_Initial_State.tracksUserData === 'object' &&
	typeof window.Jetpack_Editor_Initial_State.wpcomBlogId !== 'undefined'
) {
	const { userid, username } = window.Jetpack_Editor_Initial_State.tracksUserData;
	analytics.initialize( userid, username, {
		blog_id: window.Jetpack_Editor_Initial_State.wpcomBlogId,
	} );
}

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
