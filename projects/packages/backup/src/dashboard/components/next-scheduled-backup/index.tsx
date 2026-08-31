import { __, sprintf } from '@wordpress/i18n';
import { Skeleton, Text } from '@wordpress/ui';
import { useNextBackupSchedule } from '../../hooks/use-backup-schedule';
import { useSiteSize } from '../../hooks/use-site-size';
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
 * Legacy's "Modify" link is deliberately absent: it points at Calypso, and whether this
 * dashboard links out there at all is open (JETPACK-2329). Its Tracks event goes with it.
 *
 * On a half-hour timezone this deliberately disagrees with legacy, which throws the
 * minutes away and reports a window the site does not have.
 *
 * @return The rendered line, a placeholder, or nothing.
 */
export default function NextScheduledBackup() {
	const schedule = useNextBackupSchedule();
	// The same `/site/backup/size` query the storage section and "Back up now" already
	// read, shared through `useSiteSizeQuery` rather than issued again.
	const { backupsStopped, isLoading: stoppedIsLoading } = useSiteSize();

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
		// Left as `Text`'s default `<span>`: a `<p>` would come into reach of
		// `@wordpress/ui`'s unlayered global-CSS defense — see `style.scss`.
		<Text variant="body-sm" className="jpb-text-muted jpb-next-scheduled-backup">
			{ sprintf(
				/* translators: %1$s is the formatted date (e.g. "Oct 22"); %2$s is a time range (e.g. "10:00-10:59 AM"). */
				__( 'Next full backup: %1$s, %2$s.', 'jetpack-backup-pkg' ),
				schedule.nextBackupDate,
				schedule.timeRange
			) }
		</Text>
	);
}
