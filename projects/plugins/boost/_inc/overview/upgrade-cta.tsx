import { useEffect, useRef } from 'react';
import { OVERVIEW_UPGRADE_EVENT, type UpgradeSlotRequest } from './lib/upgrade-bridge';

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
	return <div ref={ container } />;
}
