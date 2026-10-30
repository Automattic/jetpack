/**
 * External dependencies
 */
import { useLayoutEffect, useRef, useState } from 'react';

/** The nearest ancestor that hides its overflow, where a long figure gets cut. */
function findClipBox( element: HTMLElement ): HTMLElement | null {
	for (
		let node = element.parentElement;
		node && node !== document.body;
		node = node.parentElement
	) {
		const { overflowX } = getComputedStyle( node );
		// jsdom reports an unset overflow as ''.
		if ( overflowX !== '' && overflowX !== 'visible' ) {
			return node;
		}
	}
	return null;
}

/** Whether the element's inline box runs past the content box of `box`, at either end. */
function runsPast( element: HTMLElement, box: HTMLElement ): boolean {
	const { left, right } = element.getBoundingClientRect();
	const { paddingLeft, paddingRight } = getComputedStyle( box );
	const px = ( length: string ) => parseFloat( length ) || 0;
	// From the padding edge (`clientLeft` is the border), which `clientWidth` spans.
	const paddingStart = box.getBoundingClientRect().left + box.clientLeft;
	const start = paddingStart + px( paddingLeft );
	const end = paddingStart + box.clientWidth - px( paddingRight );
	// A pixel of slack for subpixel rounding.
	return left < start - 1 || right > end + 1;
}

type Clip = { text: string; boxWidth: number };

/**
 * Whether `text`, rendered in the element the returned ref is on, gets clipped
 * by the nearest ancestor that hides overflow. Once clipped it stays so until
 * that ancestor grows past the width it clipped at, so a shorter text swapped
 * in cannot bounce back. Never clipped where there is no ResizeObserver.
 *
 * @param text    - The text being measured; a new text is measured afresh.
 * @param enabled - Skip measuring (and the layout it forces) when false.
 * @return The ref to attach to the text's element, and whether it is clipped.
 */
export function useIsClipped( text: string, enabled: boolean ) {
	const ref = useRef< HTMLSpanElement | null >( null );
	const [ clip, setClip ] = useState< Clip | null >( null );
	const isClipped = enabled && clip !== null && clip.text === text;

	useLayoutEffect( () => {
		const element = ref.current;
		if ( ! enabled || ! element || typeof ResizeObserver === 'undefined' ) {
			return;
		}
		const box = findClipBox( element );
		if ( ! box ) {
			return;
		}
		const check = () => {
			if ( isClipped ) {
				if ( box.clientWidth > ( clip as Clip ).boxWidth ) {
					setClip( null );
				}
			} else if ( runsPast( element, box ) ) {
				setClip( { text, boxWidth: box.clientWidth } );
			}
		};
		check();
		const observer = new ResizeObserver( check );
		observer.observe( box );
		return () => observer.disconnect();
	}, [ enabled, text, isClipped, clip ] );

	return [ ref, isClipped ] as const;
}
