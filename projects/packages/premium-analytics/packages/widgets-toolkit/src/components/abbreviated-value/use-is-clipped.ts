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

// The box often sizes to its content, so once it shows shorter text it never
// grows again on its own; growth is watched on the ancestors that size it too.
const ANCESTORS_WATCHED = 4;

/** The box and the ancestors above it whose growth earns the text another try. */
function watchedBoxes( box: HTMLElement ): HTMLElement[] {
	const boxes = [ box ];
	for (
		let node = box.parentElement;
		node && node !== document.body && boxes.length <= ANCESTORS_WATCHED;
		node = node.parentElement
	) {
		boxes.push( node );
	}
	return boxes;
}

type Clip = { text: string; fontSize: string; widths: number[] };

/**
 * Whether `text`, rendered in the element the returned ref is on, gets clipped
 * by the nearest ancestor that hides overflow. Once clipped it stays so until
 * that box or one of its ancestors grows past the width it clipped at, or the
 * type changes size, so a shorter text swapped in cannot bounce back. Never
 * clipped where there is no ResizeObserver.
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
		const boxes = watchedBoxes( box );
		const widths = () => boxes.map( node => node.clientWidth );
		// A layout switch can shrink the type without widening any box, as the
		// metric tiles' compact layout does, so a type change earns a retry too.
		const fontSize = () => getComputedStyle( element ).fontSize;
		const check = () => {
			if ( isClipped ) {
				const at = clip as Clip;
				if (
					fontSize() !== at.fontSize ||
					widths().some( ( width, i ) => width > at.widths[ i ] )
				) {
					setClip( null );
				}
			} else if ( runsPast( element, box ) ) {
				setClip( { text, fontSize: fontSize(), widths: widths() } );
			}
		};
		check();
		const observer = new ResizeObserver( check );
		[ element, ...boxes ].forEach( node => observer.observe( node ) );
		return () => observer.disconnect();
	}, [ enabled, text, isClipped, clip ] );

	return [ ref, isClipped ] as const;
}
