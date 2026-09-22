import { useEffect, useRef } from 'react';
import { OVERVIEW_UPGRADE_EVENT, type UpgradeSlotRequest } from './lib/upgrade-bridge';
import { canOfferUpgrade } from './lib/use-modules-state';

export default function UpgradeCTA() {
	const container = useRef< HTMLSpanElement >( null );
	useEffect( () => {
		if ( ! container.current ) {
			return;
		}
		const request: UpgradeSlotRequest = { container: container.current };
		window.dispatchEvent( new CustomEvent( OVERVIEW_UPGRADE_EVENT, { detail: request } ) );
		return () => request.unmount?.();
	}, [] );
	if ( ! canOfferUpgrade() ) {
		return null;
	}
	return <span ref={ container } />;
}
