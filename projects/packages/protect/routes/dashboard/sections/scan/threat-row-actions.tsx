import { useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { DeleteSoftwareModal, getDeleteTitle } from './delete-software';
import { FixDeleteModal, getDeleteFixTitle } from './fix-delete-confirmation';
import { getUpdateFixTitle, makeFixUpdateModal } from './fix-update-confirmation';
import { getSoftwareActionLabels } from './labels';
import { useCanIgnore } from './store';
import {
	fixThreats,
	getBulkRun,
	ignoreThreats,
	isDeleteFix,
	isUpdateFix,
	refocusRow,
	unignoreThreat,
	useGetThreatBusy,
} from './threat-actions';
import type { ScanThreat } from './types';
import type { Action } from '@wordpress/dataviews';

type LinkKey = 'update' | 'deactivate' | 'details';

type OpenThreat = ( item: ScanThreat ) => void;

type FixUpdateModal = ReturnType< typeof makeFixUpdateModal >;

const NO_THREATS: ScanThreat[] = [];

type GetBusy = ReturnType< typeof useGetThreatBusy >;

const canFix = ( item: ScanThreat, canAct: boolean ) =>
	canAct && !! item.fixable && item.status !== 'ignored' && item.status !== 'fixed';

/*
 * DataViews can't disable an action for one row, so a busy row keeps only View. A deleting row
 * keeps them, since hiding Delete would close its open modal; deleteSoftware refuses a repeat.
 */
const isLocked = ( item: ScanThreat, getBusy: GetBusy ) => {
	const busy = getBusy( item.id );
	return !! busy && busy !== 'deleting';
};

/**
 * The selected threats each bulk Auto-fix is given, and the delete fixes neither takes.
 *
 * @param selected - The selected threats.
 * @param canAct   - Whether the site's plan can fix threats.
 * @param getBusy  - Gets the action running on a threat.
 * @return The groups.
 */
function getBulkFixGroups( selected: ScanThreat[], canAct: boolean, getBusy: GetBusy ) {
	const fixes = selected.filter( item => canFix( item, canAct ) && ! isLocked( item, getBusy ) );
	const others = fixes.filter( item => ! isDeleteFix( item ) );
	return {
		deletes: fixes.filter( isDeleteFix ),
		plain: others.filter( item => ! isUpdateFix( item ) ),
		updates: others.filter( isUpdateFix ),
	};
}

/**
 * The selected threats bulk Auto-fix leaves out: delete fixes, and fixes Scan runs only on their own.
 *
 * @param selected - The selected threats.
 * @param canAct   - Whether the site's plan can fix threats.
 * @param getBusy  - Gets the action running on a threat.
 * @return The threats left out, which need fixing one at a time.
 */
export function getLeftOutOfBulkFix(
	selected: ScanThreat[],
	canAct: boolean,
	getBusy: GetBusy
): ScanThreat[] {
	const { deletes, plain, updates } = getBulkFixGroups( selected, canAct, getBusy );
	const leftOut = ( group: ScanThreat[] ) => {
		const run = getBulkRun( group );
		return group.filter( item => ! run.includes( item ) );
	};
	return [ ...deletes, ...leftOut( plain ), ...leftOut( updates ) ];
}

/**
 * A row's DataViews actions: primary ones show as buttons without hovering, and the ⋯ menu lists them all.
 *
 * @param open      - Opens a threat in the inspector.
 * @param canAct    - Whether the site's plan can fix and ignore threats.
 * @param canIgnore - Whether the host lets the site ignore threats.
 * @param getBusy   - Gets the action running on a threat.
 * @param FixUpdate - The confirmation for fixes that update software.
 * @param selected  - The selected threats, which the bulk Auto-fix actions are labeled for.
 * @param onBulk    - Offers Auto-fix and Ignore on selected rows; gets the threats either starts on.
 * @return The actions.
 */
function getThreatRowActions(
	open: OpenThreat,
	canAct: boolean,
	canIgnore: boolean,
	getBusy: GetBusy,
	FixUpdate: FixUpdateModal,
	selected: ScanThreat[],
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
	const { plain: selectedPlain, updates: selectedUpdates } = getBulkFixGroups(
		selected,
		canAct,
		getBusy
	);
	// Both bulk Auto-fix buttons show then, so the update one names its count even for one.
	const isMixed = selectedUpdates.length > 0 && selectedPlain.length > 0;
	const isSelectedUpdates = ( items: ScanThreat[] ) =>
		isMixed && items.every( item => selectedUpdates.some( other => other.id === item.id ) );

	const actions: Action< ScanThreat >[] = [
		{
			id: 'view',
			label: __( 'View', 'jetpack-protect-pkg' ),
			isPrimary: true,
			callback: ( [ item ] ) => item && open( item ),
		},
		// The Auto-fix actions are mutually exclusive: delete and update fixes confirm first.
		{
			id: 'auto-fix',
			label: __( 'Auto-fix', 'jetpack-protect-pkg' ),
			isPrimary: true,
			isEligible: item => canFix( item, canAct ) && ! isDeleteFix( item ) && ! isUpdateFix( item ),
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
			isEligible: item => canFix( item, canAct ) && isDeleteFix( item ),
			modalHeader: ( [ item ] ) => ( item ? getDeleteFixTitle( item ) : '' ),
			RenderModal: FixDeleteModal,
		},
		{
			id: 'auto-fix-update',
			label: items =>
				items.length > 1 || isSelectedUpdates( items )
					? sprintf(
							/* translators: %d is a number of plugin and theme updates, one or more. */
							_n(
								'Auto-fix %d update',
								'Auto-fix %d updates',
								getBulkRun( items ).length,
								'jetpack-protect-pkg'
							),
							getBulkRun( items ).length
						)
					: __( 'Auto-fix', 'jetpack-protect-pkg' ),
			isPrimary: true,
			isEligible: item => canFix( item, canAct ) && isUpdateFix( item ),
			// A batch of updates Scan runs only on their own starts nothing, but without Ignore it keeps them selectable.
			supportsBulk:
				!! onBulk &&
				( ! canIgnore || selectedUpdates.length < 2 || getBulkRun( selectedUpdates ).length > 0 ),
			modalHeader: items => getUpdateFixTitle( items ),
			RenderModal: FixUpdate,
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

	return actions.map( action =>
		action.id === 'view'
			? action
			: {
					...action,
					isEligible: item =>
						! isLocked( item, getBusy ) && ( action.isEligible?.( item ) ?? true ),
				}
	);
}

/**
 * A threats table's row actions, updated as actions on its threats start and finish.
 *
 * @param open     - Opens a threat in the inspector.
 * @param canAct   - Whether the site's plan can fix and ignore threats.
 * @param onBulk   - Offers Auto-fix and Ignore on selected rows; gets the threats either starts on.
 * @param selected - The selected threats, for a list with bulk actions.
 * @return The actions.
 */
export function useThreatRowActions(
	open: OpenThreat,
	canAct: boolean,
	onBulk?: ( items: ScanThreat[] ) => void,
	selected: ScanThreat[] = NO_THREATS
): Action< ScanThreat >[] {
	const canIgnore = useCanIgnore();
	const getBusy = useGetThreatBusy();
	// Kept apart from the actions, which change with every fix, so an open confirmation isn't remounted.
	const FixUpdate = useMemo( () => makeFixUpdateModal( onBulk ), [ onBulk ] );
	return useMemo(
		() => getThreatRowActions( open, canAct, canIgnore, getBusy, FixUpdate, selected, onBulk ),
		[ open, canAct, canIgnore, getBusy, FixUpdate, selected, onBulk ]
	);
}
