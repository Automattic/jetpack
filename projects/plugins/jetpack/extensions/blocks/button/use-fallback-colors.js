import { useRefEffect } from '@wordpress/compose';
import { useState } from '@wordpress/element';

/** @typedef {{ fallbackBackgroundColor: string, fallbackTextColor: string }} FallbackColors */

/**
 * Computes the fallback colors for a button block.
 * This hook returns the css colors for the block, which allows the contrast
 * checker to test colors that might be provided by the theme against colors
 * the user sets.
 *
 * @return {[FallbackColors, import('react').Ref]} An array with the fallback colors and a ref
 * to the button block.
 */
export default function useFallbackColors() {
	const [ fallbacks, setFallbacks ] = useState();

	const ref = useRefEffect( node => {
		const observer = new MutationObserver( () => {
			const computedStyle = getComputedStyle( node );
			const fallbackBackgroundColor = computedStyle.backgroundColor;
			const fallbackTextColor = computedStyle.color;

			// Don't update the fallback colors if they haven't changed.
			if (
				fallbackBackgroundColor === fallbacks?.fallbackBackgroundColor &&
				fallbackTextColor === fallbacks?.fallbackTextColor
			) {
				return;
			}

			setFallbacks( {
				fallbackBackgroundColor,
				fallbackTextColor,
			} );
		} );

		observer.observe( node, {
			attributeFilter: [ 'style', 'class' ],
		} );

		return () => {
			observer.disconnect();
		};
	}, [] );

	return [ fallbacks, ref ];
}
