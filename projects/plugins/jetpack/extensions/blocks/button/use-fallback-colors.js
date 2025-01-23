import { useRefEffect } from '@wordpress/compose';
import { useState } from '@wordpress/element';

export default function useFallbackColors() {
	const [ fallbacks, setFallbacks ] = useState();

	const ref = useRefEffect( node => {
		const observer = new MutationObserver( () => {
			const fallbackBackgroundColor = getComputedStyle( node ).backgroundColor;
			const fallbackTextColor = getComputedStyle( node ).color;

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
