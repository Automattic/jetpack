/**
 * External dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-ai-assistant:use-auto-scroll' );

// These are the events that we want to listen to in order to disable auto scroll
// The 'scroll' event does not play well with latest Gutenberg and its iframe, so we add the other events
const USER_STOP_EVENTS = [ 'scroll', 'wheel', 'touchmove', 'keyup' ];

const useAutoScroll = (
	blockRef: React.MutableRefObject< HTMLDivElement >,
	contentRef: React.MutableRefObject< HTMLDivElement >
) => {
	const scrollElementRef = useRef< HTMLElement | null >( null );
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

			if ( parent.parentElement ) {
				parent = parent.parentElement;
			} else {
				// If there's no parent, we're at the top of the DOM
				// just return the document element
				return parent;
			}
		}

		return document.body;
	}, [] );

	const userScrollHandler = useCallback( () => {
		if ( ignoreScroll.current ) {
			debug( 'scroll event skipped' );
			return;
		}

		debug( 'user stop event, disabling auto' );

		// as the user scrolls, disable auto scroll
		// Note: need to dupe disableAutoScroll as both callbacks cannot depend on each other
		autoScrollEnabled.current = false;
		ignoreScroll.current = false;

		USER_STOP_EVENTS.forEach( event => {
			scrollElementRef.current?.removeEventListener( event, userScrollHandler );
		} );

		scrollElementRef.current = null;
	}, [] );

	const enableAutoScroll = useCallback( () => {
		autoScrollEnabled.current = true;
		ignoreScroll.current = true;
		scrollElementRef.current = getScrollParent( blockRef.current );

		USER_STOP_EVENTS.forEach( event => {
			scrollElementRef.current?.addEventListener( event, userScrollHandler );
		} );

		debug( 'enabling auto scroll' );
		debug( scrollElementRef.current );
		debug( contentRef.current );
	}, [ getScrollParent, blockRef, userScrollHandler, contentRef ] );

	const disableAutoScroll = useCallback( () => {
		autoScrollEnabled.current = false;
		ignoreScroll.current = false;

		USER_STOP_EVENTS.forEach( event => {
			scrollElementRef.current?.removeEventListener( event, userScrollHandler );
		} );

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

	const snapToBottom = useCallback( () => {
		blockRef?.current?.scrollIntoView( { block: 'end', inline: 'end' } );
	}, [ blockRef ] );

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
