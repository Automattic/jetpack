/**
 * External dependencies
 */
import { useState } from '@wordpress/element';

type Level< Row > = {
	data: Row[];
	hasComparison: boolean;
};

type SettledLevel< Row > = Level< Row > & {
	drillDepth: number;
	paramsKey: string;
};

type HeldLevelArgs< Row > = Level< Row > & {
	isLoading: boolean;
	drillDepth: number;
	reportParams: unknown;
};

/**
 * Keep the last settled level on screen while a deeper drill-down loads.
 *
 * Held whole rather than read off `data`: with a comparison, the two queries land separately
 * and mix levels.
 */
export default function useHeldLevel< Row >( {
	data,
	hasComparison,
	isLoading,
	drillDepth,
	reportParams,
}: HeldLevelArgs< Row > ): Level< Row > & { isHeld: boolean } {
	const paramsKey = JSON.stringify( reportParams );
	const [ settled, setSettled ] = useState< SettledLevel< Row > | null >( null );

	// `data` must keep its reference across renders, or this sets state on every one.
	if (
		! isLoading &&
		( settled?.drillDepth !== drillDepth ||
			settled.paramsKey !== paramsKey ||
			settled.data !== data )
	) {
		setSettled( { drillDepth, paramsKey, data, hasComparison } );
	}

	// Not going back up, where it would sit under the parent's trail, nor across a params change.
	if (
		isLoading &&
		settled &&
		settled.paramsKey === paramsKey &&
		drillDepth > settled.drillDepth &&
		settled.data.length > 0
	) {
		return { data: settled.data, hasComparison: settled.hasComparison, isHeld: true };
	}

	return { data, hasComparison, isHeld: false };
}
