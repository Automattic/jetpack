import { useLayoutEffect, useRef } from '@wordpress/element';
import type { RefObject } from 'react';

type Target< T > = RefObject< HTMLElement | null > | ( ( element: T ) => HTMLElement | null );

/**
 * Hand focus on when the returned ref's element unmounts while holding it.
 *
 * Without this, focus falls to `<body>` and the next Tab starts again from the top of the page.
 *
 * @param target - Where focus goes: a ref, or a function of the departing element. Keep it stable.
 * @return The ref for the element that may go away.
 */
export function useFocusHandoff< T extends HTMLElement >( target?: Target< T > ): RefObject< T > {
	const ref = useRef< T >( null );

	// A layout cleanup runs before React detaches the element, so focus is still inside it.
	useLayoutEffect( () => {
		const element = ref.current;
		return () => {
			if ( ! element?.contains( element.ownerDocument.activeElement ) ) {
				return;
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps -- Late on purpose: a target rendered after this element has no node at mount.
			const next = typeof target === 'function' ? target( element ) : target?.current;
			next?.focus();
		};
	}, [ target ] );

	return ref;
}
