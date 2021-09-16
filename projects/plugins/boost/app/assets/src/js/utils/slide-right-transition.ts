/**
 * A svelte transition object to animate slide-right enter/exit
 *
 * @param {HTMLElement} node  - URL to remove GET parameter from
 * @param {Object}      param - An object containing {delay, duration, easing} to override defaults.
 */

export type SlideRightParams = {
	delay: number;
	duration: number;
	easing: Function;
};

/**
 * External dependencies
 */
import { cubicInOut } from 'svelte/easing';

export default function ( node: HTMLElement, params: SlideRightParams ): Object {
	const existingTransform = getComputedStyle( node ).transform.replace( 'none', '' );

	return {
		delay: params.delay || 0,
		duration: params.duration || 2000,
		easing: params.easing || cubicInOut,
		css: ( t, u ) => `transform: ${ existingTransform } translateX(${ u * 100 }%)`,
	};
}
