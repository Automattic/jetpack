import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { cloudUpload } from '@wordpress/icons';
import { Link, Notice, Spinner, Stack, Text } from '@wordpress/ui';
import { useSiteSuffix } from '../../hooks/use-connection';
import ErrorReference from '../error-reference';
import { ContactSupportLine } from './index';
import './style.scss';
import type { BackupsState } from '../../types/backup';
import type { FailureReference } from '../../types/failure-reference';

type Props = {
	/** Completion of the running backup, 0–100. Omit while the backup is requested but not yet reported. */
	progress?: number;
};

/**
 * Notice shown above the activity list while a backup runs on a site that
 * already has restore points.
 *
 * Non-destructive: the list stays usable while the backup runs. Without
 * `progress` it shows a spinner, and the same element then updates in place.
 *
 * @param props          - Component props.
 * @param props.progress - Completion of the running backup, 0–100. Omit before WPCOM reports it.
 * @return The rendered banner.
 */
export default function BackupStatusBanner( { progress }: Props ) {
	const isStarting = progress === undefined;
	const readySoon = __( 'Your backup will be ready soon', 'jetpack-backup-pkg' );

	return (
		<Notice.Root
			className="jpb-backup-status-banner"
			intent="info"
			icon={ cloudUpload }
			// Constant, so a progress poll never re-announces the notice.
			spokenMessage={ readySoon }
		>
			<Notice.Title className="jpb-backup-status-banner__title">
				{ isStarting
					? __( 'Generating backup…', 'jetpack-backup-pkg' )
					: sprintf(
							/* translators: %d: how much of the running backup is complete, as a percentage. */
							__( 'Generating backup… (%d%% progress)', 'jetpack-backup-pkg' ),
							progress
						) }
				{ isStarting && <Spinner className="jpb-backup-status-banner__spinner" /> }
			</Notice.Title>
			<Notice.Description>{ readySoon }</Notice.Description>
		</Notice.Root>
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
 * @param props           - Component props.
 * @param props.state     - Derived backup state.
 * @param props.reference - What to quote to support when backups are failing.
 * @return The rendered banner, or null when the state needs no report.
 */
export function BackupTroubleBanner( {
	state,
	reference,
}: {
	state: BackupsState;
	reference?: FailureReference | null;
} ) {
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
					/* translators: sentence form of the takeover panel's heading, which is the same words without the full stop. */
					__( 'We are having trouble backing up your site.', 'jetpack-backup-pkg' )
				}
			</Text>
			<Text variant="body-sm">
				<ContactSupportLine />
			</Text>
			{ reference && <ErrorReference { ...reference } /> }
		</Stack>
	);
}

/**
 * Strip shown when the backup that made the site `complete` finished with
 * some files missing.
 *
 * @return The rendered banner.
 */
export function BackupWarningsBanner() {
	const siteSuffix = useSiteSuffix();

	return (
		<Stack className="jpb-backup-warnings-banner" direction="column" gap="xs" role="status">
			<Text variant="body-sm">
				{ createInterpolateElement(
					__(
						'Backup is completed with some files missing. See your <a>backup in the cloud</a> for more details.',
						'jetpack-backup-pkg'
					),
					{
						a: (
							<Link
								openInNewTab
								// Omitted rather than passed as undefined — see `useSiteSuffix`.
								href={ getRedirectUrl( 'jetpack-backup', siteSuffix ? { site: siteSuffix } : {} ) }
							/>
						),
					}
				) }
			</Text>
		</Stack>
	);
}
