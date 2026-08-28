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
 * `hasRestorePoints` is the veto, and it matters because the two sources
 * disagree by design. This state is derived from `/jetpack/v4/backups`,
 * which reports only VaultPress's most recent handful of rows and has
 * the scan-only rows filtered out of that window — so a site whose last
 * few attempts failed can report `no-good-backups` while the activity
 * log still lists restore points from earlier in the retention window.
 * Taking the body over there would hide the restore points at the exact
 * moment someone came looking for them, which is the same class of
 * mistake as the empty state this panel exists to replace.
 *
 * @param state            - Derived backup state.
 * @param isInitialBackup  - Whether the site is still waiting for its first restore point.
 * @param hasRestorePoints - Whether the activity log has a backup to show. Pass true when not yet known.
 * @return True when the panel replaces the Overview body.
 */
export function replacesOverview(
	state: BackupsState,
	isInitialBackup: boolean,
	hasRestorePoints: boolean
): boolean {
	if ( hasRestorePoints ) {
		return false;
	}
	if ( state === 'in-progress' ) {
		return isInitialBackup;
	}
	return state === 'no-backups' || state === 'will-retry' || state === 'no-good-backups';
}

/**
 * The one line that turns "your backups are failing" into something the
 * reader can act on.
 *
 * Shared by the takeover panel and the banner rather than duplicated,
 * because the two render in mutually exclusive situations and a reader
 * who lands in either needs the same next step. Keeping one msgid also
 * stops the two copies drifting apart in translation.
 *
 * @return The rendered support line.
 */
export function ContactSupportLine() {
	const siteSuffix = useSiteSuffix();

	return createInterpolateElement(
		__( '<a>Get in touch with us</a> to get your site backups going again.', 'jetpack-backup-pkg' ),
		{
			a: (
				<Link
					openInNewTab
					href={ getRedirectUrl( 'jetpack-contact-support', { site: siteSuffix } ) }
				/>
			),
		}
	);
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
					<ContactSupportLine />
				</EmptyState.Description>
			</EmptyState.Root>
		);
	}

	// A retryable failure is the one state with nothing to show: WPCOM
	// reports the percentage the attempt died at, which would read as a
	// stalled backup rather than one waiting to be retried.
	//
	// `no-backups` still gets a bar, in indeterminate mode. The heading
	// promises a backup is coming, so a panel with no sign of activity
	// contradicts itself — and this is the state a brand-new customer
	// sits in, watching. Only a running backup has a real percentage.
	const showProgress = state !== 'will-retry';
	const isDeterminate = state === 'in-progress';

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
					{ /*
					 * Omitting `value` is what puts ProgressBar into its animated
					 * indeterminate mode.
					 *
					 * One name serves both modes: they are the same situation to
					 * the reader, whose first backup has not arrived either way.
					 * Named at all because `ProgressBar` otherwise announces itself
					 * as a generic "Loading …", and the title above is not
					 * associated with the bar.
					 */ }
					<ProgressBar
						className="jpb-backup-status__bar"
						value={ isDeterminate ? progress : undefined }
						aria-label={ __( 'Preparing your first cloud backup', 'jetpack-backup-pkg' ) }
					/>
					{ isDeterminate && (
						<Text variant="body-sm" className="jpb-text-muted">
							{ sprintf(
								/* translators: %d: how much of the running backup is complete, as a percentage. */
								__( '%d%%', 'jetpack-backup-pkg' ),
								progress
							) }
						</Text>
					) }
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
