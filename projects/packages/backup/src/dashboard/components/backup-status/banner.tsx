import { ProgressBar } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import './style.scss';

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
			<ProgressBar className="jpb-backup-status-banner__bar" value={ progress } />
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
