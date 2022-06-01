/**
 * A svelte transition object to animate slide-right enter/exit
 *
 * @param {HTMLElement} node  - URL to remove GET parameter from
 * @param {Object}      param - An object containing {delay, duration, easing} to override defaults.
 */

type SlideRightParams = {
	delay: number;
	duration: number;
	easing: ( t: number ) => number;
};

export type SlideRightTransition = {
	delay: number;
	duration: number;
	easing: ( t: number ) => number;
	css: ( t: number, u: number ) => string;
};

import { cubicInOut } from 'svelte/easing';

export default function ( node: HTMLElement, params: SlideRightParams ): SlideRightTransition {
	const existingTransform = getComputedStyle( node ).transform.replace( 'none', '' );

	return {
		delay: params.delay || 0,
		duration: params.duration || 2000,
		easing: params.easing || cubicInOut,
		css: ( t: number, u: number ) => `transform: ${ existingTransform } translateX(${ u * 100 }%)`,
	};
}
