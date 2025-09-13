import { throttle } from '@wordpress/compose';
import { useEffect } from 'react';
import uPlot from 'uplot';
import type { RefObject } from 'react';

const THROTTLE_DURATION = 400; // in ms

/**
 * Custom hook to handle resizing of uPlot charts.
 *
 * @param {RefObject<uPlot>}          uplotRef     - The ref object for the uPlot instance.
 * @param {RefObject<HTMLDivElement>} containerRef - The ref object for the container div.
 */
export default function useResize(
	uplotRef: RefObject< uPlot >,
	containerRef: RefObject< HTMLDivElement >
) {
	useEffect( () => {
		if ( ! uplotRef.current || ! containerRef.current ) {
			return;
		}

		const resizeChart = throttle( () => {
			// Repeat the check since resize can happen much later than event registration.
			if ( ! uplotRef.current || ! containerRef.current ) {
				return;
			}

			// Only update width, not height.
			uplotRef.current.setSize( {
				height: uplotRef.current.height,
				width: containerRef.current.clientWidth,
			} );
		}, THROTTLE_DURATION );
		resizeChart();
		window.addEventListener( 'resize', resizeChart );

		// Cleanup on unmount.
		return () => window.removeEventListener( 'resize', resizeChart );
	}, [ uplotRef, containerRef ] );
}
