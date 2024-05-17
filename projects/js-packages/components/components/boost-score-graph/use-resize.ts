import { throttle } from '@wordpress/compose';
import React, { useEffect } from 'react';
import uPlot from 'uplot';

const THROTTLE_DURATION = 400; // in ms

/**
 * Custom hook to handle resizing of uPlot charts.
 *
 * @param {React.RefObject<uPlot>} uplotRef - The ref object for the uPlot instance.
 * @param {React.RefObject<HTMLDivElement>} containerRef - The ref object for the container div.
 */
export default function useResize(
	uplotRef: React.RefObject< uPlot >,
	containerRef: React.RefObject< HTMLDivElement >
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
