import { useCallback, useState } from 'react';

/**
 * Custom hook to manage funnel step selection state
 * @param hideTooltip - Function to hide tooltip when selection is cleared
 * @return Object containing selection state and its setters
 */
export const useFunnelSelection = ( hideTooltip?: () => void ) => {
	const [ selectedStepId, setSelectedStepId ] = useState< string | null >( null );

	const clearSelection = useCallback( () => {
		setSelectedStepId( null );
		hideTooltip?.();
	}, [ hideTooltip ] );

	const getStepState = useCallback(
		( stepId: string ) => ( {
			isSelected: selectedStepId === stepId,
			isBlurred: selectedStepId !== null && selectedStepId !== stepId,
		} ),
		[ selectedStepId ]
	);

	return {
		selectedStepId,
		selectStep: setSelectedStepId,
		clearSelection,
		getStepState,
	};
};
