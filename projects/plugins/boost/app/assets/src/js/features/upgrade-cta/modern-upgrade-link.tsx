import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { recordBoostEvent, recordBoostEventAndRedirect } from '$lib/utils/analytics';
import { upgradeHref } from '../../../../../../_inc/overview/lib/upgrade-bridge';
import type { TracksEventProperties } from '$lib/utils/analytics';
import type { MouseEvent } from 'react';

type ModernUpgradeLinkProps = {
	eventName: string;
	eventProperties: TracksEventProperties;
};

export default function ModernUpgradeLink( {
	eventName,
	eventProperties,
}: ModernUpgradeLinkProps ) {
	async function handleUpgrade( event: MouseEvent< HTMLAnchorElement > ) {
		if ( event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ) {
			recordBoostEvent( eventName, eventProperties );
			return;
		}

		event.preventDefault();
		await recordBoostEventAndRedirect( upgradeHref, eventName, eventProperties );
	}

	return (
		<Link href={ upgradeHref } onClick={ handleUpgrade }>
			{ __( 'Upgrade now', 'jetpack-boost' ) }
		</Link>
	);
}
