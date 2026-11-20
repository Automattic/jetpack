import { useCallback } from '@wordpress/element';
import { useNavigate } from '@wordpress/route';
import { HISTORY_STATUS_PARAM, HISTORY_THREAT_PARAM } from './history/store';
import { CLOSED_INSPECTOR } from './inspector-params';
import { THREAT_PARAM } from './scan/store';
import type { ScanThreat } from './scan/types';

/**
 * The tab, list and inspector param that show a threat: Overview for an active one, else History.
 *
 * @param threat - The threat.
 * @return The search params.
 */
function getThreatPlace( threat: ScanThreat ): Record< string, string | undefined > {
	const id = String( threat.id );
	if ( threat.status === 'fixed' ) {
		return { tab: 'history', [ HISTORY_STATUS_PARAM ]: undefined, [ HISTORY_THREAT_PARAM ]: id };
	}
	if ( threat.status === 'ignored' ) {
		return { tab: 'history', [ HISTORY_STATUS_PARAM ]: 'ignored', [ THREAT_PARAM ]: id };
	}
	return { tab: undefined, [ THREAT_PARAM ]: id };
}

/**
 * Open a threat in its inspector, on the tab that lists it, closing any other inspector.
 *
 * @return Opens a threat.
 */
export default function useOpenThreat() {
	const navigate = useNavigate();
	return useCallback(
		( threat: ScanThreat ) =>
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					...CLOSED_INSPECTOR,
					...getThreatPlace( threat ),
				} ),
				// `@wordpress/route` types no route tree, so the navigate argument needs a cast.
			} as Parameters< typeof navigate >[ 0 ] ),
		[ navigate ]
	);
}
