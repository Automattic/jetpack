import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { speak } from '@wordpress/a11y';
import { createInterpolateElement, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { cloudUpload } from '@wordpress/icons';
import { Link, Notice, Spinner, Stack, Text } from '@wordpress/ui';
import { useSiteSuffix } from '../../hooks/use-connection';
import { useFocusHandoff } from '../../hooks/use-focus-handoff';
import ErrorReference from '../error-reference';
import {
	backupReadyText,
	completedWithWarningsText,
	failedRunText,
	noGoodBackupsText,
	willRetryText,
} from './messages';
import { ContactSupportLine } from './index';
import './style.scss';
import type { BackupsState } from '../../types/backup';
import type { FailureReference } from '../../types/failure-reference';
import type { RefObject } from 'react';

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

	// Constant, so a progress poll never re-announces the notice.
	useEffect( () => {
		speak( readySoon, 'polite' );
	}, [ readySoon ] );

	return (
		<Notice.Root className="jpb-backup-status-banner" intent="info" icon={ cloudUpload }>
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
 * Notice shown once a watched backup has finished, until the reader dismisses it or another notice replaces it.
 *
 * @param props               - Component props.
 * @param props.onDismiss     - Closes the notice.
 * @param props.isListing     - Whether the activity list still lacks the new backup, which keeps the spinner.
 * @param props.returnFocusTo - Where focus goes if the notice goes away while holding it.
 * @return The rendered banner.
 */
export function BackupCompleteBanner( {
	onDismiss,
	isListing,
	returnFocusTo,
}: {
	onDismiss: () => void;
	isListing: boolean;
	returnFocusTo: RefObject< HTMLElement | null >;
} ) {
	const noticeRef = useFocusHandoff< HTMLDivElement >( returnFocusTo );

	return (
		<Notice.Root ref={ noticeRef } className="jpb-backup-status-banner" intent="success">
			<Notice.Title className="jpb-backup-status-banner__title">
				{ sprintf(
					/* translators: %d: how much of the backup is complete, as a percentage. */
					__( 'Backup complete (%d%% progress)', 'jetpack-backup-pkg' ),
					100
				) }
				{ isListing && <Spinner className="jpb-backup-status-banner__spinner" /> }
			</Notice.Title>
			<Notice.Description>{ backupReadyText() }</Notice.Description>
			<Notice.CloseIconButton onClick={ onDismiss } />
		</Notice.Root>
	);
}

// The strips below carry no live region: `useRefreshActivityOnBackupComplete` announces the end
// of a run this screen watched, and a page load stays quiet.

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
	// Two whole returns, because they say different things: `will-retry` is not yet a problem
	// the reader has to solve, since WPCOM retries on its own, while `no-good-backups` is the
	// state where nothing arrives unless someone intervenes.
	if ( state === 'will-retry' ) {
		return (
			<Stack className="jpb-backup-trouble-banner" direction="column" gap="xs">
				<Text variant="body-sm">{ willRetryText() }</Text>
			</Stack>
		);
	}

	if ( state !== 'no-good-backups' ) {
		return null;
	}

	return (
		<Stack className="jpb-backup-trouble-banner" direction="column" gap="xs">
			<Text variant="body-sm">{ noGoodBackupsText() }</Text>
			<Text variant="body-sm">
				<ContactSupportLine code={ reference?.code } />
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
		<Stack className="jpb-backup-warnings-banner" direction="column" gap="xs">
			<Text variant="body-sm">
				{ createInterpolateElement( completedWithWarningsText(), {
					a: (
						<Link
							openInNewTab
							// Omitted rather than passed as undefined — see `useSiteSuffix`.
							href={ getRedirectUrl( 'jetpack-backup', siteSuffix ? { site: siteSuffix } : {} ) }
						/>
					),
				} ) }
			</Text>
		</Stack>
	);
}

/**
 * Strip shown when a run this screen watched failed on a site that still has older restore points.
 *
 * Only after a watched run: on a page load those restore points mean the site is still backed up.
 *
 * @param props           - Component props.
 * @param props.willRetry - Whether WordPress.com will retry the failed attempt.
 * @return The rendered banner.
 */
export function BackupFailedRunBanner( { willRetry }: { willRetry: boolean } ) {
	return (
		<Stack className="jpb-backup-failed-run-banner" direction="column" gap="xs">
			<Text variant="body-sm">{ willRetry ? willRetryText() : failedRunText() }</Text>
		</Stack>
	);
}
