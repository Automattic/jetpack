import { useEffect, useRef } from 'react';
import { OVERVIEW_UPGRADE_EVENT, type UpgradeSlotRequest } from './lib/upgrade-bridge';
import { isMyJetpackAvailable, isSiteOnline } from './lib/use-modules-state';

export default function UpgradeCTA() {
	const container = useRef< HTMLDivElement >( null );
	useEffect( () => {
		if ( ! container.current ) {
			return;
		}
		const request: UpgradeSlotRequest = { container: container.current };
		window.dispatchEvent( new CustomEvent( OVERVIEW_UPGRADE_EVENT, { detail: request } ) );
		return () => request.unmount?.();
	}, [] );
	// The upgrade flow lives in My Jetpack, which offline and filtered-off sites cannot open.
	if ( ! isSiteOnline() || ! isMyJetpackAvailable() ) {
		return null;
	}
	return <div ref={ container } />;
}
