import { queryClient } from '@automattic/jetpack-react-data-sync-client';
import { createRoot } from '@wordpress/element';
import {
	observeLegacyModulesState,
	observeLegacyOnboarding,
} from '../../../../_inc/overview/lib/modules-state-bridge';
import { OVERVIEW_UPGRADE_EVENT } from '../../../../_inc/overview/lib/upgrade-bridge';
import ModernUpgradeLink from './features/upgrade-cta/modern-upgrade-link';
import type { UpgradeSlotRequest } from '../../../../_inc/overview/lib/upgrade-bridge';

observeLegacyModulesState( queryClient );
observeLegacyOnboarding( queryClient );

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
			<ModernUpgradeLink
				eventName="performance_history_upgrade_cta_click"
				eventProperties={ {
					identifier: 'historical-performance',
					destination: 'interstitial',
				} }
			/>
		);
	} );
} );
