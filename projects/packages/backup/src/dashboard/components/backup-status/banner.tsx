import { ProgressBar } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import { ContactSupportLine } from './index';
import './style.scss';
import type { BackupsState } from '../../types/backup';

type Props = {
	/** Completion of the running backup, 0–100. */
	progress: number;
};

/**
 * Strip shown above the activity list while a backup runs on a site that
 * already has restore points.
 *
 * Deliberately non-destructive: the legacy dashboard replaces its whole
 * body whenever a backup is in flight, which hides a perfectly usable
 * list of restore points for the several minutes a routine backup takes.
 * Here the list stays, and the running backup is reported alongside it.
 *
 * @param props          - Component props.
 * @param props.progress - Completion of the running backup, 0–100.
 * @return The rendered banner.
 */
export default function BackupStatusBanner( { progress }: Props ) {
	return (
		<Stack className="jpb-backup-status-banner" direction="row" align="center" gap="md">
			{ /*
			 * The live region is deliberately just this line, not the row.
			 * What is worth announcing is that a backup started; the
			 * percentage is already exposed by the native `<progress>` the
			 * bar renders, and wrapping the row would re-announce it on
			 * every poll — dozens of interruptions over the minutes a
			 * backup runs, which is exactly what the ARIA practices warn
			 * against for frequently-updating values. This text does not
			 * change while the banner is mounted, so it speaks once.
			 */ }
			<Text variant="body-sm" aria-live="polite">
				{ __( 'Your backup will be ready soon', 'jetpack-backup-pkg' ) }
			</Text>
			{ /*
			 * Named because neither the line above nor the percentage beside it
			 * is associated with the bar — see `tests/progress-bar-names.test.tsx`.
			 */ }
			<ProgressBar
				className="jpb-backup-status-banner__bar"
				value={ progress }
				aria-label={ __( 'Backing up your site', 'jetpack-backup-pkg' ) }
			/>
			<Text variant="body-sm" className="jpb-text-muted">
				{ sprintf(
					/* translators: %d: how much of the running backup is complete, as a percentage. */
					__( '%d%%', 'jetpack-backup-pkg' ),
					progress
				) }
			</Text>
		</Stack>
	);
}

/**
 * Strip shown when the site's backups are failing but the takeover panel
 * has stood down.
 *
 * `replacesOverview()` was quietly doing two jobs: deciding whether the
 * panel takes the body over, *and* — because only that panel carries the
 * support link — deciding whether the reader is told their backups are
 * failing at all. Every case where the takeover correctly steps aside
 * therefore also dropped the message. Two of those exist: restore points
 * are still listed from earlier in the retention window, and the activity
 * request failed so we cannot know either way. In both, "we can't back
 * your site up" is exactly what the reader came to find out.
 *
 * Splitting the two jobs keeps the takeover conservative — the short
 * `/backups` window really can be wrong about `no-good-backups` — without
 * paying for that caution in silence.
 *
 * @param props       - Component props.
 * @param props.state - Derived backup state.
 * @return The rendered banner, or null when the state needs no report.
 */
export function BackupTroubleBanner( { state }: { state: BackupsState } ) {
	// Written as two whole returns rather than one banner with ternaries
	// inside it. Partly because they say different things — `will-retry`
	// is not yet a problem the reader has to solve, since WPCOM retries on
	// its own, while `no-good-backups` is the state where nothing arrives
	// unless someone intervenes — and partly because a `__()` call chosen
	// by a ternary is a msgid-extraction hazard: the minifier factors the
	// shared call out of the conditional and leaves `__( cond ? a : b )`,
	// which is no longer a string literal.
	if ( state === 'will-retry' ) {
		return (
			<Stack className="jpb-backup-trouble-banner" direction="column" gap="xs" role="status">
				<Text variant="body-sm">
					{ __(
						"Your latest backup didn't complete. We'll try again shortly.",
						'jetpack-backup-pkg'
					) }
				</Text>
			</Stack>
		);
	}

	if ( state !== 'no-good-backups' ) {
		return null;
	}

	return (
		<Stack className="jpb-backup-trouble-banner" direction="column" gap="xs" role="status">
			<Text variant="body-sm">
				{
					/* translators: sentence form of the takeover panel's heading, which is the same words without the full stop. The two render in mutually exclusive situations — this one is a line of body copy, that one a title — so both spellings are wanted. */
					__( "We're having trouble backing up your site.", 'jetpack-backup-pkg' )
				}
			</Text>
			<Text variant="body-sm">
				<ContactSupportLine />
			</Text>
		</Stack>
	);
}
