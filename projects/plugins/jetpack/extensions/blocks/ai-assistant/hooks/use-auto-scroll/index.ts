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

			if ( parent.parentElement ) {
				parent = parent.parentElement;
			} else {
				// If there's no parent, we're at the top of the DOM
				// just return the document element
				return parent;
			}
		}

		return document.documentElement;
	}, [] );

	const userScrollHandler = useCallback( () => {
		debug( 'user scrolled, disabling auto' );
		if ( autoScrollEnabled.current && ! doingAutoScroll.current ) {
			debug( 'user scrolled, disabling auto' );
			ignoreScroll.current = true;
		}
	}, [] );

	const userScrollEndHandler = useCallback( () => {
		ignoreScroll.current = false;
		if ( autoScrollEnabled.current ) {
			debug( 'user stopped scrolling, enabling auto' );
		}
	}, [] );

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

		if ( ! lastParagraph ) {
			return;
		}

		doingAutoScroll.current = true;
		lastParagraph?.scrollIntoView( { block: 'center', inline: 'center', behavior: 'smooth' } );
		doingAutoScroll.current = false;
	}, [ contentRef ] );

	useEffect( () => {
		const parent = getScrollParent( blockRef.current );
		debug( 'effect event added', window.document, parent );
		parent.addEventListener( 'scroll', userScrollHandler );
		parent.addEventListener( 'scrollend', userScrollEndHandler );

		// cleanup
		return () => {
			parent.removeEventListener( 'scroll', userScrollHandler );
			parent.removeEventListener( 'scrollend', userScrollEndHandler );
		};
	}, [ blockRef, getScrollParent, userScrollEndHandler, userScrollHandler ] );

	return {
		snapToBottom,
		enableAutoScroll,
		disableAutoScroll,
	};
};

export default useAutoScroll;
