/**
 * Protect Scan v2 — threats screen.
 *
 * Renders the upstream `<ThreatsDataViews />` against Protect's merged
 * active+history dataset from `useScanThreatsQuery`. Eligibility predicates
 * gate the per-row Fix / Ignore / Unignore actions, and the four `Render*Modal`
 * props supply Protect's body-only modal contents (the upstream
 * `ThreatsDataViews` provides the `<Modal>` wrapper). The empty slot is wired
 * in Phase 6, and the scan-status takeover lands in Phase 5.
 */
import { ThreatsDataViews } from '@automattic/jetpack-scan';
import { useCallback } from '@wordpress/element';
import { useScanThreatsQuery } from '../data/use-scan-threats-query';
import { useTrackEvent } from '../data/use-track-event';
import FixThreatModal from './fix-threat-modal';
import IgnoreThreatModal from './ignore-threat-modal';
import UnignoreThreatModal from './unignore-threat-modal';
import ViewDetailsModal from './view-details-modal';
import type { Threat } from '../data/types';

const PERSIST_KEY = 'jetpack-protect:scan:view';
const TRACK_PREFIX = 'jetpack_protect_scan_';

const isFixable = ( t: Threat ) => Boolean( t.fixable );
const isCurrent = ( t: Threat ) => t.status === 'current';
const isIgnored = ( t: Threat ) => t.status === 'ignored';

/**
 * Threats screen — wires Protect's merged active+history dataset into
 * the upstream `<ThreatsDataViews />` component.
 *
 * @return The threats screen.
 */
export default function ThreatsScreen() {
	const { data, isLoading, activeError } = useScanThreatsQuery();
	const trackEvent = useTrackEvent();

	const handleTrackEvent = useCallback(
		( name: string, properties?: Record< string, unknown > ) => {
			trackEvent( `${ TRACK_PREFIX }${ name }`, properties );
		},
		[ trackEvent ]
	);

	if ( isLoading ) {
		// Phase 6 replaces this with the skeleton state.
		return null;
	}

	if ( activeError ) {
		return (
			<div data-testid="protect-scan-v2-error">
				{ 'Couldn’t load your threats. Please try again.' }
			</div>
		);
	}

	return (
		<ThreatsDataViews
			data={ data }
			showStatusFilter={ true }
			filters={ [ { field: 'status', operator: 'isAny', value: [ 'current' ] } ] }
			persistKey={ PERSIST_KEY }
			isThreatEligibleForFix={ isFixable }
			isThreatEligibleForIgnore={ isCurrent }
			isThreatEligibleForUnignore={ isIgnored }
			RenderFixModal={ FixThreatModal }
			RenderIgnoreModal={ IgnoreThreatModal }
			RenderUnignoreModal={ UnignoreThreatModal }
			RenderViewModal={ ViewDetailsModal }
			onTrackEvent={ handleTrackEvent }
		/>
	);
}
