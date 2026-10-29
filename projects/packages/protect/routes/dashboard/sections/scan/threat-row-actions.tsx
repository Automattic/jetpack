import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { DeleteSoftwareModal, getDeleteTitle } from './delete-software';
import { FixDeleteModal, getDeleteFixTitle } from './fix-delete-confirmation';
import { getSoftwareActionLabels } from './labels';
import { useCanIgnore } from './store';
import {
	fixThreats,
	ignoreThreats,
	isDeleteFix,
	refocusRow,
	unignoreThreat,
	useGetThreatBusy,
} from './threat-actions';
import type { ScanThreat } from './types';
import type { Action } from '@wordpress/dataviews';

type LinkKey = 'update' | 'deactivate' | 'details';

type OpenThreat = ( item: ScanThreat ) => void;

/**
 * A row's DataViews actions: primary ones show as buttons without hovering, and the ⋯ menu lists them all.
 *
 * @param open      - Opens a threat in the inspector.
 * @param canAct    - Whether the site's plan can fix and ignore threats.
 * @param canIgnore - Whether the host lets the site ignore threats.
 * @param getBusy   - Gets the action running on a threat.
 * @param onBulk    - Offers Auto-fix and Ignore on selected rows; gets the threats either starts on.
 * @return The actions.
 */
function getThreatRowActions(
	open: OpenThreat,
	canAct: boolean,
	canIgnore: boolean,
	getBusy: ReturnType< typeof useGetThreatBusy >,
	onBulk?: ( items: ScanThreat[] ) => void
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
		( start: ( items: ScanThreat[], open: OpenThreat ) => unknown ) => ( items: ScanThreat[] ) => {
			const [ item ] = items;
			if ( item ) {
				start( items, open );
				setTimeout( () => refocusRow( item ) );
			}
		};
	const canFix = ( item: ScanThreat ) =>
		canAct && !! item.fixable && item.status !== 'ignored' && item.status !== 'fixed';

	const actions: Action< ScanThreat >[] = [
		{
			id: 'view',
			label: __( 'View', 'jetpack-protect-pkg' ),
			isPrimary: true,
			callback: ( [ item ] ) => item && open( item ),
		},
		// `auto-fix` and `auto-fix-delete` are mutually exclusive by isDeleteFix.
		{
			id: 'auto-fix',
			label: __( 'Auto-fix', 'jetpack-protect-pkg' ),
			isPrimary: true,
			isEligible: item =>
				canFix( item ) &&
				! isDeleteFix( item ) &&
				// Like Protect, which leaves these out of fixing all threats.
				! ( item.fixable && item.fixable.extras?.isBulkFixable === false ),
			supportsBulk: !! onBulk,
			// Not awaited: a fix can take minutes, and its snackbar follows it.
			callback: locking( ( items, from ) => {
				onBulk?.( items );
				fixThreats( items, from );
			} ),
		},
		{
			id: 'auto-fix-delete',
			label: __( 'Auto-fix', 'jetpack-protect-pkg' ),
			isPrimary: true,
			isEligible: item => canFix( item ) && isDeleteFix( item ),
			modalHeader: ( [ item ] ) => ( item ? getDeleteFixTitle( item ) : '' ),
			RenderModal: FixDeleteModal,
		},
		{
			id: 'unignore',
			label: __( 'Unignore', 'jetpack-protect-pkg' ),
			isPrimary: true,
			isEligible: item => canAct && item.status === 'ignored',
			callback: locking( ( [ item ], from ) => unignoreThreat( item, from ) ),
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
			isEligible: item =>
				canAct && canIgnore && item.status !== 'ignored' && item.status !== 'fixed',
			supportsBulk: !! onBulk,
			callback: locking( ( items, from ) => {
				onBulk?.( items );
				ignoreThreats( items, from );
			} ),
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
 * @param onBulk - Offers Auto-fix and Ignore on selected rows; gets the threats either starts on.
 * @return The actions.
 */
export function useThreatRowActions(
	open: OpenThreat,
	canAct: boolean,
	onBulk?: ( items: ScanThreat[] ) => void
): Action< ScanThreat >[] {
	const canIgnore = useCanIgnore();
	const getBusy = useGetThreatBusy();
	return useMemo(
		() => getThreatRowActions( open, canAct, canIgnore, getBusy, onBulk ),
		[ open, canAct, canIgnore, getBusy, onBulk ]
	);
}
