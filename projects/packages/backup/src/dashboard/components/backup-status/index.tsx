import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { ProgressBar } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { cloudUpload, error as errorIcon } from '@wordpress/icons';
import { Card, EmptyState, Link, Text } from '@wordpress/ui';
import { useSiteSuffix } from '../../hooks/use-connection';
import ErrorReference from '../error-reference';
import './style.scss';
import type { BackupsState } from '../../types/backup';
import type { FailureReference } from '../../types/failure-reference';

type Props = {
	state: BackupsState;
	/** Completion of the running backup, 0–100. */
	progress: number;
	/** A backup was requested but WPCOM has not reported it yet. */
	isStarting?: boolean;
	/** What to quote to support when backups are failing. */
	reference?: FailureReference | null;
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
					className="jpb-backup-status__link"
					// Omitted rather than passed as undefined — see `useSiteSuffix`.
					href={ getRedirectUrl(
						'jetpack-contact-support',
						siteSuffix ? { site: siteSuffix } : {}
					) }
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
 * Legacy's closing "backup management on Jetpack.com" is deliberately gone: it
 * points at the screen this dashboard replaces (JETPACK-2329).
 *
 * @param props            - Component props.
 * @param props.state      - Derived backup state.
 * @param props.progress   - Completion of the running backup, 0–100.
 * @param props.isStarting - A backup was requested but WPCOM has not reported it yet.
 * @param props.reference  - What to quote to support when backups are failing.
 * @return The rendered panel.
 */
export default function BackupStatusPanel( {
	state,
	progress,
	isStarting = false,
	reference,
}: Props ) {
	if ( state === 'no-good-backups' && ! isStarting ) {
		return (
			<div className="jpb-backup-status">
				<Card.Root className="jpb-backup-status__card">
					<Card.Content>
						<EmptyState.Root className="jpb-backup-status__body">
							<EmptyState.Visual>
								<EmptyState.Icon
									className="jpb-backup-status__icon jpb-backup-status__icon--error"
									icon={ errorIcon }
								/>
							</EmptyState.Visual>
							<EmptyState.Title render={ <Text variant="body-xl" render={ <h2 /> } /> }>
								{ __( 'We are having trouble backing up your site', 'jetpack-backup-pkg' ) }
							</EmptyState.Title>
							<EmptyState.Description>
								<ContactSupportLine />
							</EmptyState.Description>
							{ reference && <ErrorReference { ...reference } /> }
						</EmptyState.Root>
					</Card.Content>
				</Card.Root>
			</div>
		);
	}

	// A retryable failure has nothing to show: WPCOM reports the percentage
	// the attempt died at, which would read as a stalled backup.
	const showProgress = isStarting || state !== 'will-retry';
	// `no-backups` and a just-requested backup have no percentage yet, so the bar is indeterminate.
	const isDeterminate = ! isStarting && state === 'in-progress';

	return (
		<div className="jpb-backup-status">
			<Card.Root className="jpb-backup-status__card">
				<Card.Content>
					<EmptyState.Root className="jpb-backup-status__body">
						<EmptyState.Visual>
							<EmptyState.Icon
								className="jpb-backup-status__icon jpb-backup-status__icon--info"
								icon={ cloudUpload }
							/>
						</EmptyState.Visual>
						{ showProgress && (
							<div className="jpb-backup-status__progress">
								{ /* Omitting `value` makes the bar indeterminate. The title is not associated with the bar — see `tests/progress-bar-names.test.tsx`. */ }
								<ProgressBar
									className="jpb-backup-status__bar"
									value={ isDeterminate ? progress : undefined }
									aria-label={ __( 'Preparing your first cloud backup', 'jetpack-backup-pkg' ) }
								/>
							</div>
						) }
						<EmptyState.Title render={ <Text variant="body-xl" render={ <h2 /> } /> }>
							{ __( 'Generating backup…', 'jetpack-backup-pkg' ) }
						</EmptyState.Title>
						<EmptyState.Description>
							{ __(
								'The first backup usually takes a few minutes, so it will become available soon.',
								'jetpack-backup-pkg'
							) }
						</EmptyState.Description>
					</EmptyState.Root>
				</Card.Content>
			</Card.Root>
		</div>
	);
}
