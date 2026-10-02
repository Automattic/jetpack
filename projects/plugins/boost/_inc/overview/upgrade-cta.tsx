import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { useEffect, useRef, useState } from 'react';
import { OVERVIEW_UPGRADE_EVENT, type UpgradeSlotRequest, upgradeHref } from './lib/upgrade-bridge';
import { canOfferUpgrade } from './lib/use-modules-state';

export default function UpgradeCTA() {
	const container = useRef< HTMLSpanElement >( null );
	const [ showFallbackLink, setShowFallbackLink ] = useState( false );
	useEffect( () => {
		if ( ! container.current ) {
			return;
		}
		const request: UpgradeSlotRequest = { container: container.current };
		window.dispatchEvent( new CustomEvent( OVERVIEW_UPGRADE_EVENT, { detail: request } ) );
		if ( ! request.unmount ) {
			setShowFallbackLink( true );
			return;
		}
		return () => request.unmount?.();
	}, [] );
	if ( ! canOfferUpgrade() ) {
		return null;
	}
	if ( showFallbackLink ) {
		return <Link href={ upgradeHref }>{ __( 'Upgrade now', 'jetpack-boost' ) }</Link>;
	}
	return <span ref={ container } />;
}
