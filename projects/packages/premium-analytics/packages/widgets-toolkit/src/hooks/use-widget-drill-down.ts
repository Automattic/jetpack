/**
 * External dependencies
 */
import { useCallback, useState } from 'react';

/**
 * Reusable selection state for widgets that drill down from a parent list.
 *
 * @return Drill-down selection state and actions.
 */
export function useWidgetDrillDown< T >() {
	const [ drillDownItem, setDrillDownItem ] = useState< T | null >( null );

	const drillDown = useCallback( ( item: T ) => {
		setDrillDownItem( item );
	}, [] );

	const resetDrillDown = useCallback( () => {
		setDrillDownItem( null );
	}, [] );

	return {
		drillDownItem,
		drillDown,
		resetDrillDown,
		isDrillDown: drillDownItem !== null,
	};
}
