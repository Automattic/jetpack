/**
 * Stands in for framer-motion: the comment editor's popovers and drawers render without animating.
 */

import { createElement, forwardRef, useEffect } from 'react';

const px = value => ( typeof value === 'number' ? `${ value }px` : value );
const components = new Map();

/**
 * A `motion.<tag>` that renders the plain tag. Framer's `x` and `y` style shorthands
 * place a popover, so they become a transform; the animation props are dropped.
 *
 * @param {string} tag - The element to render.
 * @return {object} The component.
 */
const motionComponent = tag =>
	forwardRef(
		(
			{
				initial,
				animate,
				exit,
				variants,
				transition,
				layout,
				whileHover,
				whileTap,
				onAnimationComplete,
				style: { x, y, originX, originY, ...style } = {},
				...props
			},
			ref
		) => {
			// Popover stays hidden until its entrance animation reports it is done.
			useEffect( () => onAnimationComplete?.(), [] );

			if ( x !== undefined || y !== undefined ) {
				style.transform = `translateX(${ px( x ?? 0 ) }) translateY(${ px( y ?? 0 ) })`;
			}

			return createElement( tag, { ...props, style, ref } );
		}
	);

// Cached, so a tag keeps one component and React never remounts it.
export const motion = new Proxy(
	{},
	{
		get: ( target, tag ) => {
			if ( ! components.has( tag ) ) {
				components.set( tag, motionComponent( tag ) );
			}

			return components.get( tag );
		},
	}
);

export const AnimatePresence = ( { children } ) => children;
export const useIsPresent = () => true;
export const cubicBezier = () => t => t;
