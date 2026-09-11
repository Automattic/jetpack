import { Button } from '@automattic/jetpack-components';
import { queryClient } from '@automattic/jetpack-react-data-sync-client';
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { observeLegacyModulesState } from '../../../../_inc/overview/lib/modules-state-bridge';
import { OVERVIEW_UPGRADE_EVENT } from '../../../../_inc/overview/lib/upgrade-bridge';
import InterstitialModalCTA from './features/upgrade-cta/interstitial-modal-cta';
import { recordBoostEvent } from './lib/utils/analytics';
import type { UpgradeSlotRequest } from '../../../../_inc/overview/lib/upgrade-bridge';

observeLegacyModulesState( queryClient );

function handleUpgrade() {
	recordBoostEvent( 'performance_history_upgrade_cta_click', {} );
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
			<InterstitialModalCTA
				identifier="historical-performance"
				customModalTrigger={
					<Button onClick={ handleUpgrade }>{ __( 'Upgrade now', 'jetpack-boost' ) }</Button>
				}
			/>
		);
	} );
} );
