import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link, Skeleton, Text } from '@wordpress/ui';
import { useAnalytics } from '../../hooks/use-analytics';
import { useNextBackupSchedule } from '../../hooks/use-backup-schedule';
import { useSiteSuffix } from '../../hooks/use-connection';
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
 * Legacy's "Modify" link comes with it, and so does its Tracks event. This is the one
 * Calypso destination the modernized dashboard keeps (JETPACK-2329):
 * `cloud.jetpack.com/settings` is the only place a backup's time can be changed, and
 * there is no schedule-editing UI here to send the reader to instead.
 *
 * On a half-hour timezone this deliberately disagrees with legacy, which throws the
 * minutes away and reports a window the site does not have.
 *
 * @return The rendered line, a placeholder, or nothing.
 */
export default function NextScheduledBackup() {
	const { tracks } = useAnalytics();
	const site = useSiteSuffix();
	const schedule = useNextBackupSchedule();
	// The same `/site/backup/size` query the storage section and "Back up now" already
	// read, shared through `useSiteSizeQuery` rather than issued again.
	const { backupsStopped, isLoading: stoppedIsLoading } = useSiteSize();

	const onModifyClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_schedule_modify_click' );
	}, [ tracks ] );

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

	// The key is omitted rather than passed as undefined. `getRedirectUrl` walks its args
	// with `for…in`, so a present-but-undefined `site` is encoded — the link would carry
	// the literal string `undefined` — and its mere presence also suppresses the helper's
	// own site fallback. See `gates/no-backup-plan.tsx`.
	const modifyUrl = getRedirectUrl( 'backup-plugin-schedule-time-setting', site ? { site } : {} );

	return (
		// The row is the `Text`, rendered as a `<div>`, so the sentence and the link are
		// sized together the way legacy sizes its row — a link left to inherit wp-admin's
		// 13px would sit a step larger than the caption beside it. A `<div>` rather than a
		// `<p>` because `@wordpress/ui`'s global-CSS defense is unlayered and matches `p`
		// at (0,1,1), which would drop the class-selector margin below silently.
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
			<Link openInNewTab href={ modifyUrl } onClick={ onModifyClick }>
				{ __( 'Modify', 'jetpack-backup-pkg' ) }
			</Link>
		</Text>
	);
}
