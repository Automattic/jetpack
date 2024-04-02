/**
 * External dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-ai-assistant:use-auto-scroll' );
const useAutoScroll = (
	blockRef: React.MutableRefObject< HTMLDivElement >,
	contentRef: React.MutableRefObject< HTMLDivElement >
) => {
	const scrollElementRef = useRef( null );
	const autoScrollEnabled = useRef( false );
	const ignoreScroll = useRef( false );

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
			parent = parent.parentElement;
		}

		return document.documentElement;
	}, [] );

	const userScrollHandler = useCallback( () => {
		if ( ignoreScroll.current ) {
			debug( 'scroll event skipped' );
			return;
		}
		debug( 'user scrolled, disabling auto' );
		// as the user scrolls, disable auto scroll
		// Note: need to dupe disableAutoScroll as both callbacks cannot depend on each other
		autoScrollEnabled.current = false;
		ignoreScroll.current = false;
		scrollElementRef.current?.removeEventListener( 'scroll', userScrollHandler );
		scrollElementRef.current = null;
	}, [] );

	const enableAutoScroll = useCallback( () => {
		autoScrollEnabled.current = true;
		ignoreScroll.current = true;
		scrollElementRef.current = getScrollParent( blockRef.current );
		scrollElementRef.current?.addEventListener( 'scroll', userScrollHandler );
		debug( 'enabling auto scroll' );
		debug( scrollElementRef.current );
		debug( contentRef.current );
	}, [ getScrollParent, blockRef, userScrollHandler, contentRef ] );

	const disableAutoScroll = useCallback( () => {
		autoScrollEnabled.current = false;
		ignoreScroll.current = false;
		scrollElementRef.current?.removeEventListener( 'scroll', userScrollHandler );
		scrollElementRef.current = null;
		debug( 'disabling auto scroll' );
	}, [ userScrollHandler ] );

	const preSuggestionPartialHandler = useCallback( () => {
		// bail early if we're not in auto scroll mode
		if ( ! autoScrollEnabled.current ) {
			return;
		}

		ignoreScroll.current = true;
	}, [] );

	const snapToBottom = useCallback(
		( extraOffset = 0 ) => {
			const bounds = contentRef.current?.getBoundingClientRect();
			const offset =
				( blockRef?.current?.lastChild instanceof HTMLElement
					? blockRef.current.lastChild.clientHeight
					: 80 ) + 40;

			if ( bounds?.bottom > window.innerHeight - offset || bounds?.top < 0 ) {
				scrollElementRef.current?.scrollBy(
					0,
					contentRef.current?.getBoundingClientRect().bottom -
						window.innerHeight +
						offset +
						extraOffset
				);
			}
		},
		[ blockRef, contentRef ]
	);

	const postSuggestionPartialHandler = useCallback( () => {
		// bail early if we're not in auto scroll mode
		if ( ! autoScrollEnabled.current ) {
			return;
		}

		// do the auto scroll
		snapToBottom();

		// this setTimeout here because setting the flag to skip the user scroll event
		// would get into a race condition with the event handler
		setTimeout( () => {
			ignoreScroll.current = false;
		}, 100 );
	}, [ snapToBottom ] );

	return {
		autoScrollEnabled,
		snapToBottom,
		enableAutoScroll,
		disableAutoScroll,
		preSuggestionPartialHandler,
		postSuggestionPartialHandler,
	};
};

export default useAutoScroll;
