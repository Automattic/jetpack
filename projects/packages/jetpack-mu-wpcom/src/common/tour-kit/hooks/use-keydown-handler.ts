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

	const focusTourContainer = useCallback( () => {
		(
			tourContainerRef.current?.querySelector( '.tour-kit-frame__container' ) as HTMLElement
		 )?.focus();
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
						// focus the container after minimizing so the user can dismiss it
						focusTourContainer();
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
		[ onEscape, onArrowRight, onArrowLeft, isActiveElementOutsideTourContainer, focusTourContainer ]
	);

	// when clicking on the container, if the target is not a focusable element,
	// force focus on the first children so keyboard navigation works
	const handleTourContainerClick = useCallback(
		( event: MouseEvent ) => {
			const isFocusable = ( element: HTMLElement ) => {
				const focusableElements = [ 'A', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT' ];

				// Check if the element is focusable by its tag or has a tabindex >= 0
				return focusableElements.includes( element?.tagName ) || element?.tabIndex >= 0;
			};

			if ( isFocusable( event.target as HTMLElement ) ) {
				return;
			}

			focusTourContainer();
		},
		[ focusTourContainer ]
	);

	useEffect( () => {
		const tourContainer = tourContainerRef.current;

		document.addEventListener( 'keydown', handleKeydown );
		tourContainer?.addEventListener( 'click', handleTourContainerClick );

		return () => {
			document.removeEventListener( 'keydown', handleKeydown );
			tourContainer?.removeEventListener( 'click', handleTourContainerClick );
		};
	}, [ handleKeydown, handleTourContainerClick, tourContainerRef ] );
};

export default useKeydownHandler;
