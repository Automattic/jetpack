import { __ } from '@wordpress/i18n';
import { getSoftwareActionLabels } from './labels';
import { fixThreat, ignoreThreat, isThreatBusy, unignoreThreat } from './threat-actions';
import type { ScanThreat } from './types';
import type { Action } from '@wordpress/dataviews';

/**
 * A row's DataViews actions: primary ones show on hover, and the ⋯ menu lists them all.
 *
 * @param open   - Opens a threat in the inspector.
 * @param canAct - Whether the site's plan can fix and ignore threats.
 * @return The actions.
 */
export function getThreatRowActions(
	open: ( item: ScanThreat ) => void,
	canAct: boolean
): Action< ScanThreat >[] {
	const link =
		( key: 'update' | 'deactivate' | 'details' ) =>
		( [ item ]: ScanThreat[] ) => {
			const url = item?.extension?.actions?.[ key ];
			if ( url ) {
				window.open( url, key === 'details' ? '_blank' : '_self', 'noopener' );
			}
		};
	const hasLink = ( key: 'update' | 'deactivate' | 'details' ) => ( item: ScanThreat ) =>
		!! item.extension?.actions?.[ key ];

	return [
		{
			id: 'view',
			label: __( 'View', 'jetpack-protect-pkg' ),
			isPrimary: true,
			callback: ( [ item ] ) => item && open( item ),
		},
		{
			id: 'auto-fix',
			label: __( 'Auto-fix', 'jetpack-protect-pkg' ),
			isPrimary: true,
			isEligible: item =>
				canAct && !! item.fixable && item.status !== 'ignored' && item.status !== 'fixed',
			callback: ( [ item ] ) => item && ! isThreatBusy( item.id ) && fixThreat( item ),
		},
		{
			id: 'unignore',
			label: __( 'Unignore', 'jetpack-protect-pkg' ),
			isPrimary: true,
			isEligible: item => canAct && item.status === 'ignored',
			callback: ( [ item ] ) => item && ! isThreatBusy( item.id ) && unignoreThreat( item ),
		},
		{
			id: 'update',
			label: ( [ item ] ) => ( item ? getSoftwareActionLabels( item ).update : '' ),
			isEligible: hasLink( 'update' ),
			callback: link( 'update' ),
		},
		{
			id: 'deactivate',
			label: ( [ item ] ) => ( item ? getSoftwareActionLabels( item ).deactivate : '' ),
			isEligible: hasLink( 'deactivate' ),
			callback: link( 'deactivate' ),
		},
		{
			id: 'wordpress-org',
			label: __( 'View on WordPress.org', 'jetpack-protect-pkg' ),
			isEligible: hasLink( 'details' ),
			callback: link( 'details' ),
		},
		{
			id: 'ignore',
			label: __( 'Ignore', 'jetpack-protect-pkg' ),
			isEligible: item => canAct && item.status !== 'ignored' && item.status !== 'fixed',
			callback: ( [ item ] ) => item && ! isThreatBusy( item.id ) && ignoreThreat( item ),
		},
	];
}
