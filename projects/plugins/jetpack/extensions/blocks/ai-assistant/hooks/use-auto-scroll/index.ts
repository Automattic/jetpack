/**
 * External dependencies
 */
import { useCallback, useRef, useEffect } from '@wordpress/element';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-ai-assistant:use-auto-scroll' );

const useAutoScroll = (
	blockRef: React.MutableRefObject< HTMLElement | null >,
	contentRef?: React.MutableRefObject< HTMLElement >,
	useBlockAsTarget: boolean = false
) => {
	const scrollElementRef = useRef< HTMLElement | Document | null >( null );
	const styledScrollElementRef = useRef< HTMLElement | null >( null );
	const autoScrollEnabled = useRef( false );
	const ignoreScroll = useRef( false );
	const startedAutoScroll = useRef( false );
	const doingAutoScroll = useRef( false );
	const scrollElementOriginalStyle = useRef< { scrollPadding: string; scrollMargin: string } >( {
		scrollPadding: '',
		scrollMargin: '',
	} );

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
		startedAutoScroll.current = false;
		doingAutoScroll.current = false;
		scrollElementRef.current?.addEventListener( 'scroll', userScrollHandler );
		debug( 'enabling auto scroll' );
	}, [ userScrollHandler ] );

	const disableAutoScroll = useCallback( () => {
		autoScrollEnabled.current = false;
		ignoreScroll.current = false;
		startedAutoScroll.current = false;
		doingAutoScroll.current = false;
		scrollElementRef.current?.removeEventListener( 'scroll', userScrollHandler );

		// Reset scroll padding and margin
		if ( styledScrollElementRef.current?.style ) {
			styledScrollElementRef.current.style.scrollPadding =
				scrollElementOriginalStyle.current.scrollPadding;
			styledScrollElementRef.current.style.scrollMargin =
				scrollElementOriginalStyle.current.scrollMargin;
		}

		scrollElementRef.current = null;
		debug( 'disabling auto scroll' );
	}, [ userScrollHandler ] );

	const snapToBottom = useCallback( () => {
		if ( ! autoScrollEnabled.current || ignoreScroll.current ) {
			return;
		}

		const lastParagraph = useBlockAsTarget
			? blockRef?.current
			: contentRef?.current?.firstElementChild?.lastElementChild;

		if ( lastParagraph && ! doingAutoScroll.current ) {
			startedAutoScroll.current = true;
			doingAutoScroll.current = true;

			scrollElementRef?.current?.removeEventListener?.( 'scroll', userScrollHandler );
			lastParagraph?.scrollIntoView( { block: 'end', inline: 'end' } );

			setTimeout( () => {
				doingAutoScroll.current = false;
				scrollElementRef?.current?.addEventListener?.( 'scroll', userScrollHandler );
			}, 200 );
		}
	}, [ blockRef, contentRef, useBlockAsTarget, userScrollHandler ] );

	const getScrollParent = useCallback(
		( el: HTMLElement | null | undefined ): HTMLElement | Document | null => {
			if ( el == null ) {
				return null;
			}

			// If we arrived to the body, we should stop since it's the last event handler
			if ( el?.nodeName === 'BODY' ) {
				return el;
			}

			// Gutenberg on newest version run inside iframe, on that case the scroll parent is the iframe
			if ( el?.ownerDocument !== document ) {
				return el.ownerDocument;
			}

			const { overflow } = window.getComputedStyle( el );

			if ( overflow.split( ' ' ).every( o => o === 'auto' || o === 'scroll' ) ) {
				return el;
			}

			if ( ! el?.parentElement ) {
				return el;
			}

			return getScrollParent( el?.parentElement );
		},
		[]
	);

	useEffect( () => {
		const parent = getScrollParent( blockRef?.current?.parentElement );

		if ( ! scrollElementRef.current && parent ) {
			scrollElementRef.current = parent;
			styledScrollElementRef.current =
				parent instanceof HTMLElement ? parent : parent.documentElement;

			// Save the original scroll padding and margin
			scrollElementOriginalStyle.current = {
				scrollPadding: styledScrollElementRef.current.style.scrollPadding,
				scrollMargin: styledScrollElementRef.current.style.scrollMargin,
			};

			// Add scroll padding and margin to avoid the content to be hidden by the fixed input bar
			styledScrollElementRef.current.style.scrollPadding = '80px';
			styledScrollElementRef.current.style.scrollMargin = '10px';
		}
	}, [ blockRef, getScrollParent ] );

	return {
		snapToBottom,
		enableAutoScroll,
		disableAutoScroll,
	};
};

export default useAutoScroll;
