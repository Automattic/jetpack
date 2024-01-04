import { useEffect } from '@wordpress/element';

export function usePrefetchAssets( sources: string[] ): void {
	useEffect( () => {
		sources.forEach( src => {
			if ( src.includes( 'images' ) || src.includes( '.png' ) ) {
				new window.Image().src = src;
			}

			if ( src.includes( 'video' ) || src.includes( '.mp4' ) ) {
				const video = document.createElement( 'video' );
				video.src = src;
			}
		} );
	}, [ sources ] );
}
