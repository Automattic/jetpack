import { useEffect } from 'react';

/**
 * Goes into fullscreen mode when the component is loaded
 *
 */
export const useFullScreen = () => {
	useEffect( () => {
		const hasToolbarClass = document.documentElement.classList.contains( 'wp-toolbar' );

		document.body.classList.add( 'jetpack-admin-full-screen' );
		document.body.classList.add( 'is-wp-toolbar-disabled' );

		if ( hasToolbarClass ) {
			document.documentElement.classList.remove( 'wp-toolbar' );
		}

		return () => {
			document.body.classList.remove( 'jetpack-admin-full-screen' );
			document.body.classList.remove( 'is-wp-toolbar-disabled' );

			if ( hasToolbarClass ) {
				document.documentElement.classList.add( 'wp-toolbar' );
			}
		};
	} );
};
