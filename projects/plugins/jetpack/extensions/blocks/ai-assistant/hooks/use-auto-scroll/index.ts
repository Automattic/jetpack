/**
 * External dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import debugFactory from 'debug';
import { useEffect } from 'react';

const debug = debugFactory( 'jetpack-ai-assistant:use-auto-scroll' );

const useAutoScroll = (
	blockRef: React.MutableRefObject< HTMLDivElement >,
	contentRef: React.MutableRefObject< HTMLDivElement >
) => {
	const scrollElementRef = useRef( null );
	const autoScrollEnabled = useRef( false );
	const ignoreScroll = useRef( false );
	const doingAutoScroll = useRef( false );

	const enableIgnoreScroll = useCallback( () => {
		debug( 'enabling ignore scroll' );
		ignoreScroll.current = true;
	}, [] );

	const userScrollHandler = useCallback( () => {
		if ( autoScrollEnabled.current && ! doingAutoScroll.current && ! ignoreScroll.current ) {
			enableIgnoreScroll();
		}
	}, [ enableIgnoreScroll ] );

	const enableAutoScroll = useCallback( () => {
		autoScrollEnabled.current = true;
		ignoreScroll.current = false;
		debug( 'enabling auto scroll' );
	}, [] );

	const disableAutoScroll = useCallback( () => {
		autoScrollEnabled.current = false;
		ignoreScroll.current = false;
		debug( 'disabling auto scroll' );
	}, [] );

	const snapToBottom = useCallback( () => {
		if ( ! autoScrollEnabled.current || ignoreScroll.current ) {
			return;
		}

		const lastParagraph = contentRef?.current?.firstElementChild?.lastElementChild;

		if ( lastParagraph ) {
			// Safari does not support scrollend event, so we don't use smooth scroll for it
			if ( 'onscrollend' in window ) {
				doingAutoScroll.current = true;
				scrollElementRef?.current?.addEventListener?.(
					'scrollend',
					() => {
						doingAutoScroll.current = false;
					},
					{ once: true }
				);
				lastParagraph?.scrollIntoView( { block: 'center', inline: 'center', behavior: 'smooth' } );
			} else if ( ! doingAutoScroll.current ) {
				// Just scroll in Safari after finishing the current one
				doingAutoScroll.current = true;
				lastParagraph?.scrollIntoView( { block: 'center', inline: 'center' } );
				setTimeout( () => {
					doingAutoScroll.current = false;
				}, 100 );
			}
		}
	}, [ contentRef ] );

	const getScrollParent = useCallback( el => {
		if ( el == null ) {
			return null;
		}

		// If we arrived to the body, we should stop since it's the last event handler
		if ( el.nodeName === 'BODY' ) {
			return el;
		}

		// Gutenberg on newest version run inside iframe, on that case the scroll parent is the iframe
		if ( el.ownerDocument !== document ) {
			return el.ownerDocument;
		}

		const { overflow } = window.getComputedStyle( el );

		if ( overflow.split( ' ' ).every( o => o === 'auto' || o === 'scroll' ) ) {
			return el;
		}

		if ( ! el.parentElement ) {
			return el;
		}

		return getScrollParent( el.parentElement );
	}, [] );

	useEffect( () => {
		const parent = getScrollParent( blockRef?.current?.parentElement );
		if ( parent ) {
			scrollElementRef.current = parent;
			parent?.addEventListener?.( 'scroll', userScrollHandler );
			debug( 'auto scroll effect event added' );
		}

		// cleanup
		return () => {
			parent?.removeEventListener?.( 'scroll', userScrollHandler );
		};
	}, [ blockRef, getScrollParent, userScrollHandler ] );

	return {
		snapToBottom,
		enableAutoScroll,
		disableAutoScroll,
	};
};

export default useAutoScroll;
