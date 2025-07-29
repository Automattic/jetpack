import { useCallback } from 'react';

interface UseAnnotationKeyboardNavigationProps {
	selectedIndex: number | undefined;
	setSelectedIndex: ( index: number | undefined ) => void;
	isNavigating: boolean;
	setIsNavigating: ( navigating: boolean ) => void;
	overlayRef: React.RefObject< HTMLDivElement >;
	/**
	 * Total number of interactive annotations
	 */
	totalInteractiveAnnotations: number;
	/**
	 * Callback to activate/click an annotation (open popover)
	 */
	onActivateAnnotation?: ( index: number ) => void;
}

export const useAnnotationKeyboardNavigation = ( {
	selectedIndex,
	setSelectedIndex,
	isNavigating,
	setIsNavigating,
	overlayRef,
	totalInteractiveAnnotations,
	onActivateAnnotation,
}: UseAnnotationKeyboardNavigationProps ) => {
	// Focus management for when overlay gets focus
	const onOverlayFocus = useCallback( () => {
		// If not already navigating, start navigation from first annotation
		if ( ! isNavigating && totalInteractiveAnnotations > 0 ) {
			setIsNavigating( true );
			setSelectedIndex( 0 );
		}
	}, [ isNavigating, totalInteractiveAnnotations, setIsNavigating, setSelectedIndex ] );

	// Reset navigation when overlay loses focus
	const onOverlayBlur = useCallback( () => {
		setIsNavigating( false );
		setSelectedIndex( undefined );
	}, [ setIsNavigating, setSelectedIndex ] );

	// Handle keyboard navigation
	const onOverlayKeyDown = useCallback(
		( event: React.KeyboardEvent< HTMLDivElement > ) => {
			if ( totalInteractiveAnnotations === 0 ) return;

			// Keep focus on overlay if Tab is pressed (exit navigation)
			if ( event.key === 'Tab' ) {
				overlayRef.current?.focus();
				setSelectedIndex( undefined );
				setIsNavigating( false );
				return;
			}

			const currentSelectedIndex = selectedIndex === undefined ? -1 : selectedIndex;

			// Navigate past the end (exit navigation)
			if (
				currentSelectedIndex + 1 >= totalInteractiveAnnotations &&
				[ 'ArrowRight' ].includes( event.key )
			) {
				overlayRef.current?.focus();
				setSelectedIndex( undefined );
				setIsNavigating( false );
				return;
			}

			event.preventDefault();

			if ( [ 'ArrowRight' ].includes( event.key ) ) {
				setIsNavigating( true );
				setSelectedIndex( ( currentSelectedIndex + 1 ) % totalInteractiveAnnotations );
			} else if ( [ 'ArrowLeft' ].includes( event.key ) ) {
				setIsNavigating( true );
				setSelectedIndex(
					( currentSelectedIndex - 1 + totalInteractiveAnnotations ) % totalInteractiveAnnotations
				);
			} else if ( event.key === 'Enter' || event.key === ' ' ) {
				// Activate the current annotation (open popover)
				if ( selectedIndex !== undefined && onActivateAnnotation ) {
					onActivateAnnotation( selectedIndex );
				}
			} else if ( event.key === 'Escape' ) {
				setSelectedIndex( undefined );
				setIsNavigating( false );
				overlayRef.current?.focus();
			}
		},
		[
			totalInteractiveAnnotations,
			selectedIndex,
			setSelectedIndex,
			setIsNavigating,
			overlayRef,
			onActivateAnnotation,
		]
	);

	// Provide activation function for external use
	const activateAnnotation = useCallback(
		( index: number ) => {
			if ( index >= 0 && index < totalInteractiveAnnotations ) {
				setIsNavigating( true );
				setSelectedIndex( index );
				if ( onActivateAnnotation ) {
					onActivateAnnotation( index );
				}
			}
		},
		[ totalInteractiveAnnotations, setIsNavigating, setSelectedIndex, onActivateAnnotation ]
	);

	return {
		onOverlayFocus,
		onOverlayBlur,
		onOverlayKeyDown,
		activateAnnotation,
	};
};
