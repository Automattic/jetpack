import { Button } from '@automattic/jetpack-components';
import { queryClient } from '@automattic/jetpack-react-data-sync-client';
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { observeLegacyModulesState } from '../../../../_inc/overview/lib/modules-state-bridge';
import { OVERVIEW_UPGRADE_EVENT } from '../../../../_inc/overview/lib/upgrade-bridge';
import { recordBoostEvent, recordBoostEventAndRedirect } from './lib/utils/analytics';
import type { MouseEvent } from 'react';
import type { UpgradeSlotRequest } from '../../../../_inc/overview/lib/upgrade-bridge';

observeLegacyModulesState( queryClient );

async function handleUpgrade( event: MouseEvent< HTMLAnchorElement > ) {
	if ( event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ) {
		recordBoostEvent( 'performance_history_upgrade_cta_click', {} );
		return;
	}
	event.preventDefault();
	await recordBoostEventAndRedirect(
		'admin.php?page=my-jetpack#/add-boost',
		'performance_history_upgrade_cta_click'
	);
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
			<Button href="admin.php?page=my-jetpack#/add-boost" onClick={ handleUpgrade }>
				{ __( 'Upgrade now', 'jetpack-boost' ) }
			</Button>
		);
	} );
} );
