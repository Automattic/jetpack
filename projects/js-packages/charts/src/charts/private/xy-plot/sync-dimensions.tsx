import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import { useIsomorphicLayoutEffect } from '../../../hooks';

type SyncDimensionsProps = {
	width: number;
	height: number;
	margin: { top: number; right: number; bottom: number; left: number };
};

/**
 * Hands XYChart's size to its scales before paint. Render it as a child of `XYChart`.
 *
 * XYChart syncs a new size in a passive effect, so a resized svg would paint one frame with the old scales.
 *
 * @param props        - Component props.
 * @param props.width  - The width passed to `XYChart`.
 * @param props.height - The height passed to `XYChart`.
 * @param props.margin - The margin passed to `XYChart`.
 * @return Nothing; it only updates the chart's data context.
 */
export function SyncDimensions( { width, height, margin }: SyncDimensionsProps ) {
	const { setDimensions } = useContext( DataContext );

	// No deps: visx's setter bails out unless a value changed, and `margin` is a fresh object each render.
	useIsomorphicLayoutEffect( () => {
		if ( setDimensions && width > 0 && height > 0 ) {
			setDimensions( { width, height, margin } );
		}
	} );

	return null;
}
