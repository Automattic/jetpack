import { useEffect } from '@wordpress/element';
import type { WpcomStep } from '../../../types';

/**
 * The hook to prefetch the assets of the tour
 *
 * @param steps - The steps that require assets.
 */
export default function usePrefetchTourAssets( steps: WpcomStep[] ): void {
	useEffect( () => {
		steps.forEach( step => {
			step.meta.imgSrc?.mobile && ( new window.Image().src = step.meta.imgSrc.mobile.src );
			step.meta.imgSrc?.desktop && ( new window.Image().src = step.meta.imgSrc.desktop.src );
		} );
	}, [ steps ] );
}
