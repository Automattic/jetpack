import { __ } from '@wordpress/i18n';
import { DeleteThemeModal } from './delete-software';
import { getSoftwareActionLabels } from './labels';
import { fixThreat, ignoreThreat, unignoreThreat } from './threat-actions';
import type { ScanThreat } from './types';
import type { Action } from '@wordpress/dataviews';

type LinkKey = 'update' | 'deactivate' | 'delete' | 'details';

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
		( key: LinkKey ) =>
		( [ item ]: ScanThreat[] ) => {
			const url = item?.extension?.actions?.[ key ];
			if ( url ) {
				window.open( url, key === 'details' ? '_blank' : '_self', 'noopener' );
			}
		};
	const softwareLabel =
		( key: 'update' | 'deactivate' | 'delete' ) =>
		( [ item ]: ScanThreat[] ) =>
			item ? getSoftwareActionLabels( item )[ key ] : '';
	const hasLink = ( key: LinkKey ) => ( item: ScanThreat ) => !! item.extension?.actions?.[ key ];

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
			callback: ( [ item ] ) => item && fixThreat( item ),
		},
		{
			id: 'unignore',
			label: __( 'Unignore', 'jetpack-protect-pkg' ),
			isPrimary: true,
			isEligible: item => canAct && item.status === 'ignored',
			callback: ( [ item ] ) => item && unignoreThreat( item ),
		},
		{
			id: 'update',
			label: softwareLabel( 'update' ),
			isEligible: hasLink( 'update' ),
			callback: link( 'update' ),
		},
		{
			id: 'deactivate',
			label: softwareLabel( 'deactivate' ),
			isEligible: hasLink( 'deactivate' ),
			callback: link( 'deactivate' ),
		},
		{
			id: 'delete-plugin',
			label: softwareLabel( 'delete' ),
			isEligible: item => item.extension?.type === 'plugins' && hasLink( 'delete' )( item ),
			// WordPress asks to confirm on the page this opens.
			callback: link( 'delete' ),
		},
		{
			id: 'delete-theme',
			label: softwareLabel( 'delete' ),
			modalHeader: __( 'Delete theme?', 'jetpack-protect-pkg' ),
			isEligible: item => item.extension?.type === 'themes' && hasLink( 'delete' )( item ),
			RenderModal: DeleteThemeModal,
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
			callback: ( [ item ] ) => item && ignoreThreat( item ),
		},
	];
}
