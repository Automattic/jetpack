import { useCallback, useState } from 'react';

/**
 * Custom hook to manage funnel bar selection state and interactions
 * @param hideTooltip - Function to hide tooltip when selection is cleared
 * @return Object containing selection state and event handlers
 */
export const useFunnelSelection = ( hideTooltip?: () => void ) => {
	const [ clickedStep, setClickedStep ] = useState< string | null >( null );

	// Handle bar click
	const handleBarClick = useCallback(
		( stepId: string ) => {
			if ( clickedStep === stepId ) {
				// If clicking the same step, deselect it
				setClickedStep( null );
				hideTooltip?.();
			} else {
				// Otherwise, select this step
				setClickedStep( stepId );
			}
		},
		[ clickedStep, hideTooltip ]
	);

	// Handle bar keydown
	const handleBarKeyDown = useCallback(
		( stepId: string, event: React.KeyboardEvent ) => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				if ( clickedStep === stepId ) {
					setClickedStep( null );
					hideTooltip?.();
				} else {
					setClickedStep( stepId );
				}
			} else if ( event.key === 'Escape' ) {
				event.preventDefault();
				setClickedStep( null );
				hideTooltip?.();
			}
		},
		[ clickedStep, hideTooltip ]
	);

	// Clear selection (for chart-level click)
	const clearSelection = useCallback( () => {
		setClickedStep( null );
		hideTooltip?.();
	}, [ hideTooltip ] );

	// Get step state helpers
	const getStepState = useCallback(
		( stepId: string ) => ( {
			isClicked: clickedStep === stepId,
			isBlurred: clickedStep !== null && clickedStep !== stepId,
		} ),
		[ clickedStep ]
	);

	return {
		clickedStep,
		handleBarClick,
		handleBarKeyDown,
		clearSelection,
		getStepState,
	};
};
