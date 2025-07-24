import { useCallback, useState } from 'react';

/**
 * Custom hook to manage funnel bar selection state and interactions
 * @return Object containing selection state and event handlers
 */
export const useFunnelSelection = () => {
	const [ clickedStep, setClickedStep ] = useState< string | null >( null );

	// Handle clicks within chart to deselect
	const handleChartClick = useCallback( () => {
		if ( clickedStep ) {
			setClickedStep( null );
		}
	}, [ clickedStep ] );

	// Handle chart keydown
	const handleChartKeyDown = useCallback(
		( event: React.KeyboardEvent ) => {
			if ( event.key === 'Escape' ) {
				handleChartClick();
			}
		},
		[ handleChartClick ]
	);

	// Handle bar click
	const handleBarClick = useCallback(
		( stepId: string, event: React.MouseEvent ) => {
			event.stopPropagation();
			if ( clickedStep === stepId ) {
				// If clicking the same step, deselect it
				setClickedStep( null );
			} else {
				// Otherwise, select this step
				setClickedStep( stepId );
			}
		},
		[ clickedStep ]
	);

	// Handle bar keydown
	const handleBarKeyDown = useCallback(
		( stepId: string, event: React.KeyboardEvent ) => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				event.preventDefault();
				if ( clickedStep === stepId ) {
					setClickedStep( null );
				} else {
					setClickedStep( stepId );
				}
			}
		},
		[ clickedStep ]
	);

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
		handleChartClick,
		handleChartKeyDown,
		handleBarClick,
		handleBarKeyDown,
		getStepState,
	};
};
