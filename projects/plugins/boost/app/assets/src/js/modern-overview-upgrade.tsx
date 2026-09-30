import { DataSyncProvider, queryClient } from '@automattic/jetpack-react-data-sync-client';
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import {
	observeLegacyModulesState,
	observeLegacyOnboarding,
} from '../../../../_inc/overview/lib/modules-state-bridge';
import { OVERVIEW_UPGRADE_EVENT, upgradeHref } from '../../../../_inc/overview/lib/upgrade-bridge';
import { licenseKeyHref, useCanRedeemLicenseKey } from './features/upgrade-cta/license-key-link';
import './modern-overview-upgrade.scss';
import { recordBoostEvent, recordBoostEventAndRedirect } from './lib/utils/analytics';
import type { MouseEvent } from 'react';
import type { UpgradeSlotRequest } from '../../../../_inc/overview/lib/upgrade-bridge';

observeLegacyModulesState( queryClient );
observeLegacyOnboarding( queryClient );

async function handleUpgrade( event: MouseEvent< HTMLAnchorElement > ) {
	const eventProperties = { identifier: 'historical-performance', destination: 'interstitial' };
	if ( event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ) {
		recordBoostEvent( 'performance_history_upgrade_cta_click', eventProperties );
		return;
	}
	event.preventDefault();
	await recordBoostEventAndRedirect(
		upgradeHref,
		'performance_history_upgrade_cta_click',
		eventProperties
	);
}

function OverviewLicenseKeyLink() {
	if ( ! useCanRedeemLicenseKey() ) {
		return null;
	}
	return <Link href={ licenseKeyHref }>{ __( 'Use license key', 'jetpack-boost' ) }</Link>;
}

window.addEventListener( OVERVIEW_UPGRADE_EVENT, ( event: Event ) => {
	const request = ( event as CustomEvent< UpgradeSlotRequest > ).detail;
	let disposed = false;
	let root: ReturnType< typeof createRoot > | undefined;

	// The slot mounts inside another React root; defer nested root updates until its commit completes.
	request.unmount = () => {
		disposed = true;
		queueMicrotask( () => root?.unmount() );
	};
	queueMicrotask( () => {
		if ( disposed ) {
			return;
		}
		root = createRoot( request.container );
		root.render(
			<DataSyncProvider>
				<span className="jb-modern-upgrade-actions">
					<Link href={ upgradeHref } onClick={ handleUpgrade }>
						{ __( 'Upgrade now', 'jetpack-boost' ) }
					</Link>
					<OverviewLicenseKeyLink />
				</span>
			</DataSyncProvider>
		);
	} );
} );
