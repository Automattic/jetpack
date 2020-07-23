/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import {
	createElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { useResizeObserver as useResizeObserverWordpress } from '@wordpress/compose';

/**
 * Internal dependencies
 */

/*
 * Polyfill useResizeObserver in case gutenberg's version is too old
 * Adapted from https://github.com/FezVrasta/react-resize-aware
 * TODO: Remove this once WordPress v5.5 is released
 */
export default useResizeObserverWordpress ||
	( function () {
		function useOnResize( ref, onResize ) {
			const getTarget = () =>
				ref.current && ref.current.contentDocument && ref.current.contentDocument.defaultView;
			function run() {
				// trigger onResize event on mount to provide initial sizes
				onResize();
				const target = getTarget();
				target && target.addEventListener( 'resize', onResize );
			}
			useEffect( () => {
				if ( getTarget() ) {
					run();
				} else if ( ref.current && ref.current.addEventListener ) {
					ref.current.addEventListener( 'load', run );
				}

				// clean event listener on unmount
				return () => {
					// Ensure the target exists and is in fact an event listener
					// this fixes an issue where contentDocument.defaultView is not a real window object
					// as can be the case when used with React portals
					const target = getTarget();
					const isListener = target && typeof target.removeEventListener === 'function';

					isListener && target.removeEventListener( 'resize', onResize );
				};
			}, [] );
		}

		function ResizeListener( { onResize } ) {
			const ref = useRef();
			useOnResize( ref, () => onResize( ref ) );

			return (
				<iframe
					title="jetpack-resize-listener"
					style={ {
						display: 'block',
						opacity: 0,
						position: 'absolute',
						top: 0,
						left: 0,
						height: '100%',
						width: '100%',
						overflow: 'hidden',
						pointerEvents: 'none',
						zIndex: -1,
					} }
					src="about:blank"
					ref={ ref }
					aria-hidden={ true }
					tabIndex={ -1 }
					frameBorder={ 0 }
				/>
			);
		}

		const defaultReporter = target => ( {
			width: target != null ? target.offsetWidth : null,
			height: target != null ? target.offsetHeight : null,
		} );

		function useResizeAware( reporter = defaultReporter ) {
			const [ sizes, setSizes ] = useState( reporter( null ) );
			const onResize = useCallback( ref => setSizes( reporter( ref.current ) ), [ reporter ] );
			const resizeListenerNode = useMemo( () => <ResizeListener onResize={ onResize } />, [
				onResize,
			] );

			return [ resizeListenerNode, sizes ];
		}

		return useResizeAware;
	} )();
