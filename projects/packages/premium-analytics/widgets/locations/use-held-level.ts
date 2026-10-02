/**
 * External dependencies
 */
import { useState } from '@wordpress/element';

type Level< Row > = {
	data: Row[];
	hasComparison: boolean;
};

type SettledLevel< Row > = Level< Row > & {
	drillKey: string;
	paramsKey: string;
};

type HeldLevelArgs< Row > = Level< Row > & {
	isLoading: boolean;
	drillDownPath: unknown;
	reportParams: unknown;
};

/**
 * Keep the last settled level on screen while a drill-down loads the next one.
 *
 * Held whole rather than read off `data`: with a comparison, the two queries land separately
 * and mix levels. A params change is not a drill-down and still gets the skeleton.
 */
export default function useHeldLevel< Row >( {
	data,
	hasComparison,
	isLoading,
	drillDownPath,
	reportParams,
}: HeldLevelArgs< Row > ): Level< Row > & { isHeld: boolean } {
	const drillKey = JSON.stringify( drillDownPath ?? null );
	const paramsKey = JSON.stringify( reportParams );
	const [ settled, setSettled ] = useState< SettledLevel< Row > | null >( null );

	// `data` must keep its reference across renders, or this sets state on every one.
	if (
		! isLoading &&
		( settled?.drillKey !== drillKey || settled.paramsKey !== paramsKey || settled.data !== data )
	) {
		setSettled( { drillKey, paramsKey, data, hasComparison } );
	}

	if (
		isLoading &&
		settled &&
		settled.paramsKey === paramsKey &&
		settled.drillKey !== drillKey &&
		settled.data.length > 0
	) {
		return { data: settled.data, hasComparison: settled.hasComparison, isHeld: true };
	}

	return { data, hasComparison, isHeld: false };
}
