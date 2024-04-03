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
	const autoScrollEnabled = useRef( false );
	const ignoreScroll = useRef( false );
	const ignoreScrollTimeout = useRef( null );
	const doingAutoScroll = useRef( false );
	const scrollElementRef = useRef( null );

	const getScrollParent = useCallback( element => {
		// if we have it on ref already, don't scavenge the dom, just return it
		if ( scrollElementRef.current ) {
			return scrollElementRef.current;
		}

		if ( element == null ) {
			return null;
		}

		let parent = element.parentElement;
		while ( parent ) {
			const { overflow } = window.getComputedStyle( parent );

			if ( overflow.split( ' ' ).every( o => o === 'auto' || o === 'scroll' ) ) {
				return parent;
			}

			// If parent is body, it's the one with the scroll event
			if ( parent.nodeName === 'BODY' ) {
				return parent;
			}

			parent = parent.parentElement;
		}

		return document.body;
	}, [] );

	const enableIgnoreScroll = useCallback( () => {
		ignoreScroll.current = true;
	}, [] );

	const disableIgnoreScroll = useCallback( () => {
		ignoreScroll.current = false;
	}, [] );

	const userScrollHandler = useCallback( () => {
		if ( autoScrollEnabled.current && ! doingAutoScroll.current ) {
			if ( ! ignoreScroll.current ) {
				enableIgnoreScroll();
			}

			clearTimeout( ignoreScrollTimeout.current );

			ignoreScrollTimeout.current = setTimeout( () => {
				disableIgnoreScroll();
			}, 1000 );
		}
	}, [ disableIgnoreScroll, enableIgnoreScroll ] );

	const enableAutoScroll = useCallback( () => {
		autoScrollEnabled.current = true;
		debug( 'enabling auto scroll' );
	}, [] );

	const disableAutoScroll = useCallback( () => {
		autoScrollEnabled.current = false;
		debug( 'disabling auto scroll' );
	}, [] );

	const snapToBottom = useCallback( () => {
		if ( ! autoScrollEnabled.current || ignoreScroll.current ) {
			return;
		}

		const lastParagraph = contentRef?.current?.firstElementChild?.lastElementChild;

		if ( lastParagraph ) {
			doingAutoScroll.current = true;
			lastParagraph?.scrollIntoView( { block: 'center', inline: 'center', behavior: 'smooth' } );
			setTimeout( () => {
				doingAutoScroll.current = false;
			}, 1000 );
		}
	}, [ contentRef ] );

	useEffect( () => {
		const parent = getScrollParent( blockRef.current );
		debug( 'effect event added', parent );

		parent.onscroll = userScrollHandler;

		// cleanup
		return () => {
			parent.onscroll = null;
		};
	}, [ blockRef, getScrollParent, userScrollHandler ] );

	return {
		snapToBottom,
		enableAutoScroll,
		disableAutoScroll,
	};
};

export default useAutoScroll;
