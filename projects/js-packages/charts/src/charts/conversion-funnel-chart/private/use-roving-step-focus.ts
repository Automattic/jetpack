import { useCallback, useRef, useState } from 'react';

const getTargetIndex = (
	key: string,
	index: number,
	count: number,
	isRtl: boolean
): number | undefined => {
	const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
	const previousKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

	switch ( key ) {
		case nextKey:
			return Math.min( index + 1, count - 1 );
		case previousKey:
			return Math.max( index - 1, 0 );
		case 'Home':
			return 0;
		case 'End':
			return count - 1;
		default:
			return undefined;
	}
};

/**
 * Roving tabindex for the funnel steps: one Tab stop, and arrow keys, Home and End move focus between steps.
 *
 * @param stepIds        - Step ids in visual order.
 * @param selectedStepId - The selected step, which holds the Tab stop until any step has taken focus.
 * @return Tab index, element registration, focus and key handlers for each step.
 */
export const useRovingStepFocus = ( stepIds: string[], selectedStepId: string | null ) => {
	const [ focusedStepId, setFocusedStepId ] = useState< string | null >( null );
	const stepElements = useRef( new Map< string, HTMLElement >() );

	const tabStopId =
		[ focusedStepId, selectedStepId ].find( id => id !== null && stepIds.includes( id ) ) ??
		stepIds[ 0 ];

	const getTabIndex = useCallback(
		( stepId: string ) => ( stepId === tabStopId ? 0 : -1 ),
		[ tabStopId ]
	);

	const setStepElement = useCallback( ( stepId: string, element: HTMLElement | null ) => {
		if ( element ) {
			stepElements.current.set( stepId, element );
		} else {
			stepElements.current.delete( stepId );
		}
	}, [] );

	const handleStepFocus = useCallback( ( stepId: string ) => {
		setFocusedStepId( stepId );
	}, [] );

	const handleNavigationKey = useCallback(
		( stepId: string, event: React.KeyboardEvent< HTMLElement > ) => {
			if ( event.altKey || event.ctrlKey || event.metaKey ) {
				return false;
			}

			const isRtl = getComputedStyle( event.currentTarget ).direction === 'rtl';
			const targetIndex = getTargetIndex(
				event.key,
				stepIds.indexOf( stepId ),
				stepIds.length,
				isRtl
			);
			if ( targetIndex === undefined ) {
				return false;
			}

			event.preventDefault();
			stepElements.current.get( stepIds[ targetIndex ] )?.focus();
			return true;
		},
		[ stepIds ]
	);

	return { getTabIndex, setStepElement, handleStepFocus, handleNavigationKey };
};
