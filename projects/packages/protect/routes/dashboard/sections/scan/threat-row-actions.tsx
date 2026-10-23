import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DeleteSoftwareModal, getDeleteTitle } from './delete-software';
import { getSoftwareActionLabels } from './labels';
import { fixThreat, ignoreThreat, unignoreThreat, useGetThreatBusy } from './threat-actions';
import type { ScanThreat } from './types';
import type { Action } from '@wordpress/dataviews';

type LinkKey = 'update' | 'deactivate' | 'details';

type OpenThreat = ( item: ScanThreat ) => void;

/**
 * Focus a threat's row when focus was lost, as when the button that started its action goes away.
 *
 * @param item - The threat.
 */
function refocusRow( item: ScanThreat ) {
	const title = Array.from( document.querySelectorAll< HTMLElement >( '[data-threat-id]' ) ).find(
		element => element.dataset.threatId === String( item.id )
	);
	const { activeElement, body } = title?.ownerDocument ?? {};
	if ( title && ( ! activeElement || activeElement === body ) ) {
		title.focus();
	}
}

/**
 * A row's DataViews actions: primary ones show on hover, and the ⋯ menu lists them all.
 *
 * @param open    - Opens a threat in the inspector.
 * @param canAct  - Whether the site's plan can fix and ignore threats.
 * @param getBusy - Gets the action running on a threat.
 * @return The actions.
 */
function getThreatRowActions(
	open: OpenThreat,
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
	// Starting these locks the row, removing the clicked button and maybe its ⋯ menu.
	const locking =
		( start: ( item: ScanThreat, open: OpenThreat ) => unknown ) =>
		( [ item ]: ScanThreat[] ) => {
			if ( item ) {
				start( item, open );
				setTimeout( () => refocusRow( item ) );
			}
		};

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
			callback: locking( fixThreat ),
		},
		{
			id: 'unignore',
			label: __( 'Unignore', 'jetpack-protect-pkg' ),
			isPrimary: true,
			isEligible: item => canAct && item.status === 'ignored',
			callback: locking( unignoreThreat ),
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
			callback: locking( ignoreThreat ),
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
export function useThreatRowActions( open: OpenThreat, canAct: boolean ): Action< ScanThreat >[] {
	const getBusy = useGetThreatBusy();
	return useMemo( () => getThreatRowActions( open, canAct, getBusy ), [ open, canAct, getBusy ] );
}
