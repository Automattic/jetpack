import { formatNumber } from '@automattic/number-formatters';
import { useInstanceId } from '@wordpress/compose';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon, cloud, download as downloadIcon, rotateLeft } from '@wordpress/icons';
import { Link as RouterLink } from '@wordpress/route';
import { Button, Card, Link, ButtonLink, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import { announce } from '../../data/announce';
import { ACKNOWLEDGED_STATE_KEY, containingBackup } from '../../data/api/known-threats';
import { formatDateTime } from '../../data/date-format';
import { formatDuration } from '../../data/durations';
import { formatStorageSize } from '../../data/storage-units';
import { useBackupRuns } from '../../hooks/use-backup-runs';
import { useBackupsKnownThreats, useKnownThreats } from '../../hooks/use-known-threats';
import FileBrowser, { EMPTY_FILE_SELECTION } from '../file-browser';
import KnownThreatsWarning from '../known-threats';
import './style.scss';
import type { BackupRun } from '../../data/normalize/backup-runs';
import type { BackupActivityItem } from '../../types/activity';
import type { FileSelection } from '../file-browser';

type Props = {
	item: BackupActivityItem;
};

/**
 * Returns the appropriate "Download" header-label given how many items
 * the visitor has selected in the file browser. With zero we default to
 * the whole-backup download.
 *
 * The count is of *nameable* items — the entries the link can actually
 * carry — not of ticked rows. The two differ only when upstream gave an
 * entry no id, and in that case the whole-backup label is the true one.
 *
 * @param count - Number of selected items the download request can name.
 * @return Localized button label.
 */
function downloadLabel( count: number ): string {
	if ( count === 0 ) {
		return __( 'Download backup', 'jetpack-backup-pkg' );
	}
	return sprintf(
		/* translators: %s formatted count of selected items (files + opaque folders) */
		_n( 'Download %s selected item', 'Download %s selected items', count, 'jetpack-backup-pkg' ),
		formatNumber( count )
	);
}

/**
 * The site's size when a backup ran and how long it took, spelled out.
 *
 * @param run - The backup's run.
 * @return Localized text.
 */
function runText( run: BackupRun ): string {
	if ( run.siteSize === null ) {
		return sprintf(
			/* translators: %s: how long a backup ran, e.g. "28 minutes" */
			__( 'Took %s', 'jetpack-backup-pkg' ),
			formatDuration( run.duration, 'long' )
		);
	}
	if ( run.duration === null ) {
		return sprintf(
			/* translators: %s: the site's size when it was backed up, e.g. "4.2GB" */
			__( 'Site size at backup: %s', 'jetpack-backup-pkg' ),
			formatStorageSize( run.siteSize )
		);
	}
	return sprintf(
		/* translators: %1$s: the site's size when it was backed up, e.g. "4.2GB". %2$s: how long the backup ran, e.g. "28 minutes". */
		__( 'Site size at backup: %1$s · Took %2$s', 'jetpack-backup-pkg' ),
		formatStorageSize( run.siteSize ),
		formatDuration( run.duration, 'long' )
	);
}

/**
 * Right-pane detail card for a selected backup activity item.
 *
 * Shows the item's title header with Download / Restore actions linking to the
 * matching sibling routes, the backup's summary line, a timestamp by-line,
 * and the file browser. File selection state lives here so the Download
 * action can switch between "Download backup" and "Download %d selected
 * item" based on what the visitor has checked in the tree, and so its
 * link can carry that selection to the Download screen. Restore does
 * neither — see its call site.
 *
 * @param props      - Component props.
 * @param props.item - The selected backup activity item.
 * @return The rendered detail card.
 */
export default function BackupDetail( { item }: Props ) {
	const [ selection, setSelection ] = useState< FileSelection >( EMPTY_FILE_SELECTION );
	// Download only; Restore beside it is deliberately untouched by the selection.
	// One id per server-side download unit: files, plus unloaded folders standing
	// for their subtrees. Label and link are both built from this one list — the
	// tree can hold a selected entry upstream gave no `id`, so counting the tree
	// would promise a scoped download over a link carrying nothing.
	const [ selectedIds, setSelectedIds ] = useState< string[] >( [] );
	const run = useBackupRuns( [ item ] )( item );
	const knownThreats = useBackupKnownThreats( item.rewindId );
	const [ acknowledged, setAcknowledged ] = useState( false );
	// A different restore point needs its own acknowledgement.
	useEffect( () => setAcknowledged( false ), [ item.rewindId ] );
	const restoreBlocked = !! knownThreats && ! acknowledged;
	const restoreHintId = `jpb-backup-detail-restore-hint-${ useInstanceId( BackupDetail ) }`;
	const restoreHint = __(
		'To restore this backup, confirm that you understand it contains known threats.',
		'jetpack-backup-pkg'
	);

	// Focus stays on the checkbox, below Restore in the header; say where the restore it was blocking is.
	const handleAcknowledge = useCallback( ( next: boolean ) => {
		setAcknowledged( next );
		if ( next ) {
			announce(
				__(
					'You can now restore this backup with "Restore to this point", at the top of this panel.',
					'jetpack-backup-pkg'
				)
			);
		}
	}, [] );

	// FileBrowser rebuilds the array on every recompute, so a plain
	// setter would re-render this subtree on selections that changed
	// nothing. Returning `prev` unchanged lets React bail out instead.
	const handleSelectionIdsChange = useCallback( ( next: string[] ) => {
		setSelectedIds( prev =>
			prev.length === next.length && prev.every( ( id, index ) => id === next[ index ] )
				? prev
				: next
		);
	}, [] );

	// One comma-joined string rather than repeated params: the comma is
	// upstream's own separator between `ls` entries, so an id may already
	// carry one. Absent when nothing is ticked, so a whole-backup download
	// links exactly as it did before.
	const downloadSearch = useMemo(
		() => ( selectedIds.length > 0 ? { files: selectedIds.join( ',' ) } : undefined ),
		[ selectedIds ]
	);

	return (
		<Card.Root className="jpb-backup-detail">
			<Card.Header className="jpb-backup-detail__header">
				<Stack
					className="jpb-backup-detail__header-row"
					direction="row"
					align="center"
					justify="space-between"
				>
					<Stack
						className="jpb-backup-detail__header-title"
						direction="row"
						gap="xl"
						align="center"
					>
						<Icon icon={ cloud } size={ 24 } />
						<Text variant="body-xl" render={ <h2 /> } tabIndex={ -1 }>
							{ item.title }
						</Text>
					</Stack>
					<Stack
						className="jpb-backup-detail__header-actions"
						direction="row"
						gap="sm"
						align="center"
					>
						<Stack
							direction="row"
							gap="xs"
							align="center"
							render={
								<Link
									render={
										<RouterLink
											to={ `/download/${ item.rewindId }` }
											// Cast for the same reason `screens/overview.tsx` casts
											// its `navigate` call: nothing registers a typed route
											// tree, so TanStack's search types collapse to shapes a
											// plain object cannot satisfy.
											search={ downloadSearch as never }
										/>
									}
								/>
							}
						>
							<Icon icon={ downloadIcon } size={ 18 } />
							{ downloadLabel( selectedIds.length ) }
						</Stack>
						{ /*
						 * Deliberately not labelled from the file selection, and its
						 * link carries none.
						 *
						 * Download beside it now does both. The difference is that
						 * its count is keepable and this one is not: a restore
						 * point is restored whole, and there is no
						 * upstream shape for restoring a subset of files. So a
						 * count here could only ever promise a scope no layer can
						 * deliver, and the reader who trusts "Restore 3 selected
						 * items" confirms a full-site restore believing it is
						 * scoped.
						 */ }
						{ restoreBlocked ? (
							<>
								{ /* The warning's checkbox below shows why; screen readers get it from the description. */ }
								<Button variant="solid" disabled aria-describedby={ restoreHintId }>
									<Button.Icon icon={ rotateLeft } />
									<Text variant="body-md">
										{ __( 'Restore to this point', 'jetpack-backup-pkg' ) }
									</Text>
								</Button>
								<VisuallyHidden id={ restoreHintId }>{ restoreHint }</VisuallyHidden>
							</>
						) : (
							<ButtonLink
								variant="solid"
								render={
									<RouterLink
										to={ `/restore/${ item.rewindId }` }
										// Untyped route tree; see the download link above.
										{ ...( knownThreats
											? { state: { [ ACKNOWLEDGED_STATE_KEY ]: item.rewindId } as never }
											: {} ) }
									/>
								}
							>
								<ButtonLink.Icon icon={ rotateLeft } />
								{ /* Same size and line height as the button; only the weight drops, to Download's. */ }
								<Text variant="body-md">
									{ __( 'Restore to this point', 'jetpack-backup-pkg' ) }
								</Text>
							</ButtonLink>
						) }
					</Stack>
				</Stack>
			</Card.Header>
			<Card.Content
				className="jpb-backup-detail__body"
				render={ <Stack direction="column" gap="md" /> }
			>
				<Text variant="body-lg" className="jpb-backup-detail__stats" dir="auto">
					{ item.stats }
				</Text>
				<Text variant="body-md" className="jpb-text-muted jpb-backup-detail__by">
					<span>{ formatDateTime( item.publishedAt ) }</span>
					<span>
						{ createInterpolateElement(
							sprintf(
								/* translators: %s: actor name */
								__( 'By %s', 'jetpack-backup-pkg' ),
								'<Actor />'
							),
							{ Actor: <bdi>{ item.actor.name }</bdi> }
						) }
					</span>
				</Text>
				{ run && (
					<Text variant="body-sm" className="jpb-text-muted jpb-backup-detail__run">
						{ runText( run ) }
					</Text>
				) }
				{ knownThreats && (
					<KnownThreatsWarning
						threats={ knownThreats.threats }
						acknowledged={ acknowledged }
						onAcknowledge={ handleAcknowledge }
						restoreInsteadPeriod={ knownThreats.latestClean }
						restoreInsteadRewindId={ knownThreats.latestCleanRewindId }
					/>
				) }
				<FileBrowser
					rewindId={ item.rewindId }
					selection={ selection }
					onSelectionChange={ setSelection }
					onSelectionIdsChange={ handleSelectionIdsChange }
				/>
			</Card.Content>
		</Card.Root>
	);
}

/**
 * The known threats of the backup a restore point belongs to, or null when it has none.
 *
 * @param rewindId - The restore point's rewind id.
 * @return The threats and the newest clean backup, or null.
 */
function useBackupKnownThreats( rewindId: string ) {
	const { data: backups, isPending } = useBackupsKnownThreats();
	const backup = containingBackup( backups, rewindId );
	// The counts cover only the newest 100 backups, so an older one, or one the counts
	// couldn't be read for, is checked on its own, as the restore screen does.
	const check = backup ? ( backup.knownThreats?.flagged ?? 0 ) > 0 : ! isPending;
	const { data: threats } = useKnownThreats( rewindId, check );
	const warns = check && !! threats && threats.summary.flagged > 0;
	const { data: withCleanRewindId } = useBackupsKnownThreats( {
		withCleanRewindId: true,
		enabled: warns,
	} );

	if ( ! warns || ! threats ) {
		return null;
	}
	return {
		threats,
		latestClean: backups?.latest_without_known_threats ?? null,
		latestCleanRewindId: withCleanRewindId?.latest_without_known_threats_rewind_id ?? null,
	};
}
