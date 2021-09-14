/**
 * A svelte transition object to animate slide-right enter/exit
 *
 * @param {HTMLElement} node  - URL to remove GET parameter from
 * @param {Object}      param - An object containing {delay, duration, easing} to override defaults.
 */

/**
 * External dependencies
 */
import { cubicInOut } from 'svelte/easing';

export default function ( node, params ) {
	const existingTransform = getComputedStyle( node ).transform.replace( 'none', '' );

	return {
		delay: params.delay || 0,
		duration: params.duration || 2000,
		easing: params.easing || cubicInOut,
		css: ( t, u ) => `transform: ${ existingTransform } translateX(${ u * 100 }%)`,
	};
}
