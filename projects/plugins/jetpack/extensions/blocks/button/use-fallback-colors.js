import { useLayoutEffect, useState } from '@wordpress/element';

export default function useFallbackColors( textRef ) {
	const [ fallbacks, setFallbacks ] = useState();

	useLayoutEffect( () => {
		// If the textRef is not available or the fallback colors are already set, do nothing.
		if (
			! textRef.current ||
			( fallbacks?.fallbackTextColor && fallbacks?.fallbackBackgroundColor )
		) {
			return;
		}

		const fallbackBackgroundColor = getComputedStyle( textRef.current ).backgroundColor;
		const fallbackTextColor = getComputedStyle( textRef.current ).color;

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

		// Disable reason, this shouldn't re-run when `fallbackColors` is updated.
		// textRef is a ref, so doesn't need to be included in the dependency array.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return fallbacks;
}
