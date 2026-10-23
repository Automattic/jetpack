import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DeleteSoftwareModal, getDeleteTitle } from './delete-software';
import { getSoftwareActionLabels } from './labels';
import { fixThreat, ignoreThreat, unignoreThreat, useGetThreatBusy } from './threat-actions';
import type { ScanThreat } from './types';
import type { Action } from '@wordpress/dataviews';

type LinkKey = 'update' | 'deactivate' | 'details';

/**
 * A row's DataViews actions: primary ones show on hover, and the ⋯ menu lists them all.
 *
 * @param open    - Opens a threat in the inspector.
 * @param canAct  - Whether the site's plan can fix and ignore threats.
 * @param getBusy - Gets the action running on a threat.
 * @return The actions.
 */
function getThreatRowActions(
	open: ( item: ScanThreat ) => void,
	canAct: boolean,
	getBusy: ReturnType< typeof useGetThreatBusy >
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

	const actions: Action< ScanThreat >[] = [
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
			callback: ( [ item ] ) => item && fixThreat( item, open ),
		},
		{
			id: 'unignore',
			label: __( 'Unignore', 'jetpack-protect-pkg' ),
			isPrimary: true,
			isEligible: item => canAct && item.status === 'ignored',
			callback: ( [ item ] ) => item && unignoreThreat( item, open ),
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
			id: 'delete',
			label: softwareLabel( 'delete' ),
			modalHeader: ( [ item ] ) => ( item ? getDeleteTitle( item ) : '' ),
			isEligible: item => !! item.extension?.actions?.delete,
			RenderModal: DeleteSoftwareModal,
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
			callback: ( [ item ] ) => item && ignoreThreat( item, open ),
		},
	];

	/*
	 * DataViews can't disable an action for one row, so a busy row keeps only View. A deleting row
	 * keeps them, since hiding Delete would close its open modal; deleteSoftware refuses a repeat.
	 */
	const isLocked = ( item: ScanThreat ) => {
		const busy = getBusy( item.id );
		return !! busy && busy !== 'deleting';
	};
	return actions.map( action =>
		action.id === 'view'
			? action
			: {
					...action,
					isEligible: item => ! isLocked( item ) && ( action.isEligible?.( item ) ?? true ),
				}
	);
}

/**
 * A threats table's row actions, updated as actions on its threats start and finish.
 *
 * @param open   - Opens a threat in the inspector.
 * @param canAct - Whether the site's plan can fix and ignore threats.
 * @return The actions.
 */
export function useThreatRowActions(
	open: ( item: ScanThreat ) => void,
	canAct: boolean
): Action< ScanThreat >[] {
	const getBusy = useGetThreatBusy();
	return useMemo( () => getThreatRowActions( open, canAct, getBusy ), [ open, canAct, getBusy ] );
}
