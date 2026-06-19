/**
 * MediaImage
 *
 * A thin wrapper over `<img>` that renders an optional focal point as an inline
 * `object-position`, so the visible crop (under `object-fit: cover`) keeps the
 * focal point in view.
 *
 * The crop model is "focal point at the center of the crop, clamped to the
 * image edges" — the same model image CDNs use when they generate the cropped
 * share image. CSS `object-position` percentages are *alignment*, not centering
 * (they only match a centered crop at 50%), so we remap the focal point into the
 * `object-position` value that reproduces a centered crop. The remap needs the
 * image's natural aspect ratio and the rendered box's aspect ratio, both read
 * from the element itself, so callers pass only a `focalPoint`.
 *
 * Before those sizes are known (initial render, or a non-layout environment like
 * tests) it falls back to the raw focal point; the value is corrected once the
 * image loads.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FocalPoint } from '../../types';

export type MediaImageProps = React.ImgHTMLAttributes< HTMLImageElement > & {
	/**
	 * The focal point to keep in view, both axes 0-1. Omitted → centered.
	 */
	focalPoint?: FocalPoint;
};

const clamp = ( value: number ) => Math.min( Math.max( value, 0 ), 1 );

/**
 * Remaps one axis of a focal point into the `object-position` fraction that
 * reproduces a centered-and-clamped crop, given that axis's overflow ratio.
 *
 * @param {number} focal - The focal coordinate on the overflowing axis (0-1).
 * @param {number} ratio - Visible fraction of the image on that axis (boxShorter / imageLonger).
 * @return {number} The object-position fraction (0-1).
 */
const remapAxis = ( focal: number, ratio: number ): number => {
	// No overflow on this axis → object-position has no effect; pass through.
	if ( ratio >= 1 ) {
		return focal;
	}

	return clamp( ( focal - ratio / 2 ) / ( 1 - ratio ) );
};

/**
 * Converts a focal point into the `object-position` point that reproduces a
 * centered-and-clamped crop under `object-fit: cover`.
 *
 * @param {FocalPoint} focalPoint  - The focal point, both axes 0-1.
 * @param {number}     imageAspect - The image's natural aspect ratio (w/h).
 * @param {number}     boxAspect   - The rendered box's aspect ratio (w/h).
 * @return {FocalPoint} The object-position point, both axes 0-1.
 */
export const focalPointToObjectPosition = (
	focalPoint: FocalPoint,
	imageAspect: number,
	boxAspect: number
): FocalPoint => {
	if ( imageAspect < boxAspect ) {
		// Image is taller than the box → height overflows → remap the y axis.
		return { x: focalPoint.x, y: remapAxis( focalPoint.y, imageAspect / boxAspect ) };
	}

	if ( imageAspect > boxAspect ) {
		// Image is wider than the box → width overflows → remap the x axis.
		return { x: remapAxis( focalPoint.x, boxAspect / imageAspect ), y: focalPoint.y };
	}

	// Same aspect → the image fills the box exactly → focal point is irrelevant.
	return focalPoint;
};

export const MediaImage: React.FC< MediaImageProps > = ( {
	focalPoint,
	style,
	onLoad,
	...props
} ) => {
	const ref = useRef< HTMLImageElement >( null );
	const [ aspects, setAspects ] = useState< { image: number; box: number } | null >( null );

	const measure = useCallback( () => {
		const el = ref.current;

		if ( ! el ) {
			return;
		}

		const { naturalWidth, naturalHeight, clientWidth, clientHeight } = el;

		if ( naturalWidth && naturalHeight && clientWidth && clientHeight ) {
			setAspects( { image: naturalWidth / naturalHeight, box: clientWidth / clientHeight } );
		}
	}, [] );

	useEffect( () => {
		measure();

		const el = ref.current;

		if ( ! el || typeof ResizeObserver === 'undefined' ) {
			return;
		}

		const observer = new ResizeObserver( measure );
		observer.observe( el );

		return () => observer.disconnect();
	}, [ measure ] );

	const handleLoad = useCallback(
		( event: React.SyntheticEvent< HTMLImageElement > ) => {
			measure();
			onLoad?.( event );
		},
		[ measure, onLoad ]
	);

	// Until the sizes are known, fall back to the raw focal point; it's corrected
	// on load. With sizes, remap to reproduce a centered-and-clamped crop.
	const position =
		focalPoint && aspects
			? focalPointToObjectPosition( focalPoint, aspects.image, aspects.box )
			: focalPoint;

	const focalPointStyle = position
		? { objectPosition: `${ position.x * 100 }% ${ position.y * 100 }%` }
		: undefined;

	return (
		// Callers supply `alt` via props (often through a spread), so the rule
		// can't see the literal here.
		// eslint-disable-next-line jsx-a11y/alt-text
		<img
			{ ...props }
			ref={ ref }
			onLoad={ handleLoad }
			style={ focalPointStyle || style ? { ...style, ...focalPointStyle } : undefined }
		/>
	);
};
