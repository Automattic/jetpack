import { Button } from '@automattic/jetpack-components';
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { OVERVIEW_UPGRADE_EVENT } from '../../../../_inc/overview/lib/upgrade-bridge';
import InterstitialModalCTA from './features/upgrade-cta/interstitial-modal-cta';
import { recordBoostEvent } from './lib/utils/analytics';
import type { UpgradeSlotRequest } from '../../../../_inc/overview/lib/upgrade-bridge';

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
