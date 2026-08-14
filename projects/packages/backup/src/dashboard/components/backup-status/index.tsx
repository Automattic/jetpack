import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { ProgressBar } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { cloudUpload, error as errorIcon } from '@wordpress/icons';
import { EmptyState, Link, Text } from '@wordpress/ui';
import { useSiteSuffix } from '../../hooks/use-connection';
import './style.scss';
import type { BackupsState } from '../../types/backup';

type Props = {
	state: BackupsState;
	/** Completion of the running backup, 0–100. */
	progress: number;
};

/**
 * Whether this state should take over the Overview body entirely.
 *
 * A site with no usable restore point has nothing for the two-pane
 * layout to show — the activity list would render its own "No results"
 * and the detail pane would ask the reader to select a row that does not
 * exist. A backup running on a site that *does* have restore points is
 * the opposite case: the list stays useful, so that one gets a banner
 * instead and is handled by `<BackupStatusBanner>`.
 *
 * @param state           - Derived backup state.
 * @param isInitialBackup - Whether the site is still waiting for its first restore point.
 * @return True when the panel replaces the Overview body.
 */
export function replacesOverview( state: BackupsState, isInitialBackup: boolean ): boolean {
	if ( state === 'in-progress' ) {
		return isInitialBackup;
	}
	return state === 'no-backups' || state === 'will-retry' || state === 'no-good-backups';
}

/**
 * Full-width panel shown in place of the Overview body while the site
 * has no restore point to show.
 *
 * Covers the three first-run states — nothing recorded yet, a first
 * backup running, and a first attempt that failed and will be retried —
 * plus the "none of the attempts worked" state, which is the only one
 * that needs a way to reach support.
 *
 * Without this the modernized dashboard reads `/site/rewindable-activity`
 * only, which lists completed restore points, so every one of these
 * states renders as DataViews' bare "No results" — leaving a site whose
 * backups are failing indistinguishable from a healthy new one.
 *
 * @param props          - Component props.
 * @param props.state    - Derived backup state.
 * @param props.progress - Completion of the running backup, 0–100.
 * @return The rendered panel.
 */
export default function BackupStatusPanel( { state, progress }: Props ) {
	const siteSuffix = useSiteSuffix();

	if ( state === 'no-good-backups' ) {
		return (
			<EmptyState.Root className="jpb-backup-status">
				<EmptyState.Visual>
					<EmptyState.Icon icon={ errorIcon } />
				</EmptyState.Visual>
				<EmptyState.Title>
					{ __( "We're having trouble backing up your site", 'jetpack-backup-pkg' ) }
				</EmptyState.Title>
				<EmptyState.Description>
					{ createInterpolateElement(
						__(
							'<a>Get in touch with us</a> to get your site backups going again.',
							'jetpack-backup-pkg'
						),
						{
							a: (
								<Link
									openInNewTab
									href={ getRedirectUrl( 'jetpack-contact-support', { site: siteSuffix } ) }
								/>
							),
						}
					) }
				</EmptyState.Description>
			</EmptyState.Root>
		);
	}

	// Only a running backup has a percentage worth drawing. A retryable
	// failure reports the percentage the attempt died at, which would read
	// as a stalled backup rather than one waiting to be retried; and a
	// site with no records at all has nothing to report, where an
	// indeterminate bar is worse than none — the track is ~1.5px tall, so
	// with no filled portion to give it contrast it reads as a stray
	// divider rule under the heading.
	const showProgress = state === 'in-progress';

	return (
		<EmptyState.Root className="jpb-backup-status">
			<EmptyState.Visual>
				<EmptyState.Icon icon={ cloudUpload } />
			</EmptyState.Visual>
			<EmptyState.Title>
				{ __( 'Your first cloud backup will be ready soon', 'jetpack-backup-pkg' ) }
			</EmptyState.Title>
			{ showProgress && (
				<div className="jpb-backup-status__progress">
					<ProgressBar className="jpb-backup-status__bar" value={ progress } />
					<Text variant="body-sm" className="jpb-text-muted">
						{ sprintf(
							/* translators: %d: how much of the running backup is complete, as a percentage. */
							__( '%d%%', 'jetpack-backup-pkg' ),
							progress
						) }
					</Text>
				</div>
			) }
			<EmptyState.Description>
				{ __(
					'The first backup usually takes a few minutes, so it will become available soon.',
					'jetpack-backup-pkg'
				) }
			</EmptyState.Description>
			<EmptyState.Description>
				{ createInterpolateElement(
					__(
						'In the meanwhile, you can start getting familiar with your <a>backup management on Jetpack.com</a>.',
						'jetpack-backup-pkg'
					),
					{
						a: (
							<Link
								openInNewTab
								href={ getRedirectUrl( 'jetpack-backup', { site: siteSuffix } ) }
							/>
						),
					}
				) }
			</EmptyState.Description>
		</EmptyState.Root>
	);
}
