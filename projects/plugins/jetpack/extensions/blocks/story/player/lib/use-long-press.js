import { useCallback, useEffect, useRef } from '@wordpress/element';

const useLongPress = callback => {
	const touchTimer = useRef();
	const targetElement = useRef();
	const savedCallback = useRef( callback );

	const preventGhostClick = useCallback( event => {
		if ( event.touches && event.touches.length === 1 ) {
			event.preventDefault();
		}
	}, [] );

	useEffect( () => {
		savedCallback.current = callback;
	}, [ callback ] );

	return {
		onTouchStart: useCallback( event => {
			if ( event.target ) {
				event.target.addEventListener( 'touchend', preventGhostClick, { passive: false } );
				targetElement.current = event.target;
			}
			touchTimer.current = setTimeout( () => {
				if ( savedCallback.current ) {
					savedCallback.current( true );
				}
				touchTimer.current = null;
			}, 200 );
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [] ),
		onTouchEnd: useCallback( event => {
			if ( ! touchTimer.current ) {
				if ( savedCallback.current ) {
					savedCallback.current( false );
				}
				// prevent triggering click events
				event.stopPropagation();
			} else {
				clearTimeout( touchTimer.current );
			}
			if ( targetElement.current ) {
				targetElement.current.removeEventListener( 'touchend', preventGhostClick );
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [] ),
	};
};

export default useLongPress;
