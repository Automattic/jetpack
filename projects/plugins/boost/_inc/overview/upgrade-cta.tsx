import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { useEffect, useRef, useState } from 'react';
import { OVERVIEW_UPGRADE_EVENT, type UpgradeSlotRequest } from './lib/upgrade-bridge';
import { canOfferUpgrade } from './lib/use-modules-state';

export default function UpgradeCTA() {
	const container = useRef< HTMLSpanElement >( null );
	const [ isUnanswered, setIsUnanswered ] = useState( false );
	useEffect( () => {
		if ( ! container.current ) {
			return;
		}
		const request: UpgradeSlotRequest = { container: container.current };
		window.dispatchEvent( new CustomEvent( OVERVIEW_UPGRADE_EVENT, { detail: request } ) );
		if ( ! request.unmount ) {
			setIsUnanswered( true );
			return;
		}
		return () => request.unmount?.();
	}, [] );
	if ( ! canOfferUpgrade() ) {
		return null;
	}
	if ( isUnanswered ) {
		return (
			<Link href="admin.php?page=my-jetpack#/add-boost">
				{ __( 'Upgrade now', 'jetpack-boost' ) }
			</Link>
		);
	}
	return <span ref={ container } />;
}
