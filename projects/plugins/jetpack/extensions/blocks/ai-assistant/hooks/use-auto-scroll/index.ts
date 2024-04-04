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
	const startedAutoScroll = useRef( false );
	const doingAutoScroll = useRef( false );

	const enableIgnoreScroll = useCallback( () => {
		debug( 'enabling ignore scroll' );
		ignoreScroll.current = true;
	}, [] );

	const userScrollHandler = useCallback( () => {
		if ( autoScrollEnabled.current && startedAutoScroll.current && ! ignoreScroll.current ) {
			enableIgnoreScroll();
		}
	}, [ enableIgnoreScroll ] );

	const enableAutoScroll = useCallback( () => {
		autoScrollEnabled.current = true;
		ignoreScroll.current = false;
		scrollElementRef.current?.addEventListener( 'scroll', userScrollHandler );
		debug( 'enabling auto scroll' );
	}, [ userScrollHandler ] );

	const disableAutoScroll = useCallback( () => {
		autoScrollEnabled.current = false;
		ignoreScroll.current = false;
		startedAutoScroll.current = false;
		doingAutoScroll.current = false;
		scrollElementRef.current?.removeEventListener( 'scroll', userScrollHandler );
		scrollElementRef.current = null;
		debug( 'disabling auto scroll' );
	}, [ userScrollHandler ] );

	const snapToBottom = useCallback( () => {
		if ( ! autoScrollEnabled.current || ignoreScroll.current ) {
			return;
		}

		const lastParagraph = contentRef?.current?.firstElementChild?.lastElementChild;

		if ( lastParagraph && ! doingAutoScroll.current ) {
			startedAutoScroll.current = true;
			doingAutoScroll.current = true;

			scrollElementRef?.current?.removeEventListener( 'scroll', userScrollHandler );
			lastParagraph?.scrollIntoView( { block: 'center', inline: 'center' } );

			setTimeout( () => {
				doingAutoScroll.current = false;
				scrollElementRef?.current?.addEventListener( 'scroll', userScrollHandler );
			}, 200 );
		}
	}, [ contentRef, userScrollHandler ] );

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
		if ( ! scrollElementRef.current ) {
			scrollElementRef.current = parent;
		}
	}, [ blockRef, getScrollParent ] );

	return {
		snapToBottom,
		enableAutoScroll,
		disableAutoScroll,
	};
};

export default useAutoScroll;
