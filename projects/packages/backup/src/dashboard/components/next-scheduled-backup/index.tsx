import { __, sprintf } from '@wordpress/i18n';
import { Skeleton, Text } from '@wordpress/ui';
import { useNextBackupSchedule } from '../../hooks/use-backup-schedule';
import { useSiteSize } from '../../hooks/use-site-size';
import './style.scss';

/**
 * The one line that answers "when does the next one run?".
 *
 * Ported from legacy's `js/components/next-scheduled-backup.tsx`, which
 * the modernized Overview had no equivalent of.
 *
 * Legacy's gate came in two halves and both are kept, in two places.
 * `overview.tsx` holds the backup-state half — the line mounts only for
 * `complete` and `in-progress`, and that comment explains why
 * `replacesOverview()` does not arrange it on its own. This file holds
 * the other half, `! backupsStopped`, below.
 *
 * **The msgid is legacy's, character for character**, so the two
 * dashboards share one GlotPress entry rather than asking translators
 * for the same sentence twice. Change one and the other has to change in
 * the same breath. Its placeholders are spelled positionally — `%1$s`
 * and `%2$s` — and that spelling is load-bearing: `@tannin/sprintf`,
 * which is what `@wordpress/i18n` uses, reads a digit *not* followed by
 * `$` as a min-width specifier, discards it, and fills what is left in
 * the order the placeholders appear. Drop the `$` and a translation that
 * puts the time first renders the date as the time and the time as the
 * date, in English-looking output that nobody reviewing English would
 * catch. `next-scheduled-backup.test.tsx` renders the line under exactly
 * such a translation.
 *
 * **Legacy's "Modify" link is deliberately absent.** It points at
 * `backup-plugin-schedule-time-setting`, which resolves to
 * `cloud.jetpack.com/settings` — so porting it would be this dashboard's
 * first outbound link to Calypso, and whether it links out to Calypso at
 * all is an open product question (JETPACK-2329). The
 * `jetpack_backup_schedule_modify_click` Tracks event legacy fires from
 * that link is absent for the same reason: no link, nothing to record.
 * Both come back together, here, once 2329 is decided.
 *
 * **On a half-hour timezone this reads differently from legacy, on
 * purpose.** At UTC+5:30 with a 10:00 UTC schedule, this says
 * "3:30-4:29 PM" and legacy says "3:00-3:59 PM". Legacy throws the
 * minutes away — it takes the integer local *hour* off its date and
 * rebuilds the range from that — so it reports a window the site does
 * not have. 15:30–16:29 is where the run actually falls, so the figure
 * here is the correct one; it just stops matching legacy for India,
 * Iran, Nepal, Newfoundland and parts of Australia. Whether the two
 * should be reconciled, and in which direction, is a product call.
 *
 * @return The rendered line, a placeholder, or nothing.
 */
export default function NextScheduledBackup() {
	const schedule = useNextBackupSchedule();
	// The same `/site/backup/size` query the storage section and the
	// "Back up now" button already read, shared through `useSiteSizeQuery`
	// rather than issued again — see that hook for why the definition is
	// shared rather than merely the key.
	const { backupsStopped, isLoading: stoppedIsLoading } = useSiteSize();

	// Both reads, because the line must not appear and then retract: a
	// site whose backups have stopped would otherwise promise a run at
	// 10:00 for as long as `/size` takes to say otherwise.
	if ( schedule.isLoading || stoppedIsLoading ) {
		return <Skeleton className="jpb-next-scheduled-backup__placeholder" />;
	}

	// Legacy gates this line on `! backupsStopped` too, but derives that
	// flag client-side from `StorageUsageLevels.Full`. This dashboard has
	// already settled on WordPress.com's server-side `backups_stopped`
	// instead (JETPACK-2300, `use-site-size.ts`), and the same answer has
	// to serve both readings: "Back up now" is disabled from the server
	// flag, so deriving this one differently would let the page disable
	// the button and promise a 10:00 backup in the same breath. The
	// server flag is also the one WordPress.com actually acts on, and it
	// needs only `/size` where the derivation needs `/policies` as well —
	// on a site with no retention policy there is no derivation to make.
	if ( backupsStopped || ! schedule.hasSchedule ) {
		return null;
	}

	return (
		// Left as `Text`'s default `<span>`, which every other muted line
		// on this dashboard also is. Rendering it as a `<p>` puts it in
		// reach of `@wordpress/ui`'s unlayered `p.p` global-CSS defense,
		// whose `margin: var( --_gcd-p-margin, 0 )` outranks a plain class
		// selector — see `style.scss`.
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
