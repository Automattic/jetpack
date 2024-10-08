/* eslint-disable jsdoc/require-param */
/**
 * External Dependencies
 */
import { useEffect, useCallback } from '@wordpress/element';

interface Props {
	onEscape?: () => void;
	onArrowRight?: () => void;
	onArrowLeft?: () => void;
	tourContainerRef: React.MutableRefObject< null | HTMLElement >;
}

/**
 * A hook the applies the respective callbacks in response to keydown events.
 */
const useKeydownHandler = ( {
	onEscape,
	onArrowRight,
	onArrowLeft,
	tourContainerRef,
}: Props ): void => {
	const isActiveElementOutsideTourContainer = useCallback( (): boolean => {
		return !! (
			tourContainerRef.current &&
			! tourContainerRef.current.contains( tourContainerRef.current.ownerDocument.activeElement )
		);
	}, [ tourContainerRef ] );

	const handleKeydown = useCallback(
		( event: KeyboardEvent ) => {
			let handled = false;

			switch ( event.key ) {
				case 'Escape':
					if ( onEscape ) {
						if ( isActiveElementOutsideTourContainer() ) {
							return;
						}

						onEscape();
						handled = true;
					}
					break;
				case 'ArrowRight':
					if ( onArrowRight ) {
						if ( isActiveElementOutsideTourContainer() ) {
							return;
						}

						onArrowRight();
						handled = true;
					}
					break;
				case 'ArrowLeft':
					if ( onArrowLeft ) {
						if ( isActiveElementOutsideTourContainer() ) {
							return;
						}

						onArrowLeft();
						handled = true;
					}
					break;
				default:
					break;
			}

			if ( handled ) {
				event.preventDefault();
				event.stopPropagation();
			}
		},
		[ isActiveElementOutsideTourContainer, onEscape, onArrowRight, onArrowLeft ]
	);

	useEffect( () => {
		document.addEventListener( 'keydown', handleKeydown );

		return () => {
			document.removeEventListener( 'keydown', handleKeydown );
		};
	}, [ handleKeydown ] );
};

export default useKeydownHandler;
