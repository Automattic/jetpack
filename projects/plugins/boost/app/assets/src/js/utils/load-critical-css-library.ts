import { __, sprintf } from '@wordpress/i18n';

let loadLibraryPromise: Promise< void >;

/**
 * Ensure the Critical CSS generator library is loaded.
 */
export async function loadCriticalCssLibrary(): Promise< void > {
	if ( loadLibraryPromise ) {
		return loadLibraryPromise;
	}

	loadLibraryPromise = new Promise< void >( ( resolve, reject ) => {
		const scriptUrl =
			// eslint-disable-next-line camelcase
			Jetpack_Boost.site.assetPath + '/critical-css-gen.js?ver=' + Jetpack_Boost.version;
		const scriptTag = document.createElement( 'script' );
		scriptTag.src = scriptUrl;

		scriptTag.addEventListener( 'error', () =>
			reject(
				new Error(
					sprintf(
						/* translators: %s refers to Critical CSS Gen library script url. */
						__( 'Failed to load Critical CSS library at %s', 'jetpack-boost' ),
						scriptUrl
					)
				)
			)
		);
		const timeout = setTimeout( () => {
			reject(
				new Error(
					sprintf(
						/* translators: %s refers to Critical CSS Gen library script url. */
						__( 'Timeout while loading Critical CSS library at %s', 'jetpack-boost' ),
						scriptUrl
					)
				)
			);
		}, 60000 );

		scriptTag.addEventListener( 'load', () => {
			clearTimeout( timeout );
			resolve();
		} );

		document.body.appendChild( scriptTag );
	} );

	return loadLibraryPromise;
}
