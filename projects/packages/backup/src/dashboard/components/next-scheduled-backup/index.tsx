import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Skeleton, Text } from '@wordpress/ui';
import { useAnalytics } from '../../hooks/use-analytics';
import { useNextBackupSchedule } from '../../hooks/use-backup-schedule';
import { useSiteSize } from '../../hooks/use-site-size';
import BackupScheduleDialog from '../backup-schedule-dialog';
import './style.scss';

/**
 * The one line that answers "when does the next one run?".
 *
 * Ported from legacy's `js/components/next-scheduled-backup.tsx`. Legacy's gate came in
 * two halves: `overview.tsx` holds the backup-state half, this file holds
 * `! backupsStopped` below.
 *
 * The msgid is legacy's character for character, so the two dashboards share one
 * GlotPress entry. Its positional `%1$s` / `%2$s` spelling is load-bearing —
 * `@tannin/sprintf` reads a digit not followed by `$` as a min-width specifier and fills
 * the rest in source order, so dropping the `$` swaps date and time under any
 * translation that reorders them.
 *
 * Legacy's "Modify" link went to `cloud.jetpack.com/settings`; here it opens
 * `<BackupScheduleDialog>` instead (JETPACK-2636), keeping legacy's Tracks event.
 *
 * On a half-hour timezone this deliberately disagrees with legacy, which throws the
 * minutes away and reports a window the site does not have.
 *
 * @return The rendered line, a placeholder, or nothing.
 */
export default function NextScheduledBackup() {
	const { tracks } = useAnalytics();
	const schedule = useNextBackupSchedule();
	const [ isDialogOpen, setIsDialogOpen ] = useState( false );
	const [ announcement, setAnnouncement ] = useState( '' );
	// The same `/site/backup/size` query the storage section and "Back up now" already
	// read, shared through `useSiteSizeQuery` rather than issued again.
	const { backupsStopped, isLoading: stoppedIsLoading } = useSiteSize();

	const onModifyClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_schedule_modify_click' );
		setAnnouncement( '' );
		setIsDialogOpen( true );
	}, [ tracks ] );

	const onDialogClose = useCallback( ( saved: boolean ) => {
		setIsDialogOpen( false );
		if ( saved ) {
			setAnnouncement( __( 'Daily backup time changed.', 'jetpack-backup-pkg' ) );
		}
	}, [] );

	// Both reads, or the line appears and then retracts: a site whose backups have
	// stopped would promise a run for as long as `/size` takes to say otherwise.
	if ( schedule.isLoading || stoppedIsLoading ) {
		return <Skeleton className="jpb-next-scheduled-backup__placeholder" />;
	}

	// Legacy derives this flag client-side from `StorageUsageLevels.Full`; this dashboard
	// uses WordPress.com's server-side `backups_stopped` (JETPACK-2300). "Back up now" is
	// already disabled from the server flag, so deriving this one differently would let
	// the page disable the button and promise a backup in the same breath.
	if ( backupsStopped || ! schedule.hasSchedule ) {
		return null;
	}

	return (
		// The `Text` is the row, so sentence and link are sized together rather than the
		// link inheriting wp-admin's 13px. A `<div>` not a `<p>`: `@wordpress/ui`'s
		// unlayered global-CSS defense matches `p` at (0,1,1) and drops the margin below.
		<Text variant="body-sm" className="jpb-next-scheduled-backup" render={ <div /> }>
			{ /* Only the sentence is de-emphasized; a muted link would read as a
			     disabled one. */ }
			<span className="jpb-text-muted">
				{ sprintf(
					/* translators: %1$s is the formatted date (e.g. "Oct 22"); %2$s is a time range (e.g. "10:00-10:59 AM"). */
					__( 'Next full backup: %1$s, %2$s.', 'jetpack-backup-pkg' ),
					schedule.nextBackupDate,
					schedule.timeRange
				) }
			</span>{ ' ' }
			<Link
				render={ <button type="button" /> }
				className="jpb-link-button"
				aria-label={ __( 'Modify daily backup time', 'jetpack-backup-pkg' ) }
				onClick={ onModifyClick }
			>
				{ __( 'Modify', 'jetpack-backup-pkg' ) }
			</Link>
			{ /* `aria-live`, not only the role: the dialog `aria-hidden`s everything else but this. */ }
			<span className="jpb-visually-hidden" role="status" aria-live="polite">
				{ announcement }
			</span>
			{ isDialogOpen && (
				<BackupScheduleDialog
					scheduledHour={ schedule.scheduledHour }
					scheduledBy={ schedule.scheduledBy }
					onClose={ onDialogClose }
				/>
			) }
		</Text>
	);
}
