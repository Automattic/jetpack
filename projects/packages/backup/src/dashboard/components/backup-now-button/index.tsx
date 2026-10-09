import { speak } from '@wordpress/a11y';
import { useCallback, useEffect, useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Tooltip, VisuallyHidden } from '@wordpress/ui';
import { useAnalytics } from '../../hooks/use-analytics';
import { useBackups } from '../../hooks/use-backups';
import { useBackupRequested, useEnqueueBackup } from '../../hooks/use-enqueue-backup';
import { useGateState } from '../../hooks/use-gate-state';
import { useSiteSize } from '../../hooks/use-site-size';

/**
 * Header action that asks WPCOM to back the site up now.
 *
 * It sits in `<Page>`'s header actions, above `<Gates>`, so it gates itself on the same
 * verdict — before mounting `<BackupNow>`, since nothing else stops that component's reads.
 *
 * @return The rendered button, or null when the site can't use it.
 */
export default function BackupNowButton() {
	const gate = useGateState();

	if ( gate.status !== 'ready' ) {
		return null;
	}

	return <BackupNow />;
}

/**
 * Announce a failed request: focus stays on the button, and its changed description is not read.
 *
 * @param reason - Why the request failed.
 */
function announceFailure( reason: string ) {
	const title = __( 'Could not start a backup. Please try again.', 'jetpack-backup-pkg' );
	// The hook falls back to this same sentence when WPCOM gives no reason.
	speak( reason && reason !== title ? `${ title } ${ reason }` : title, 'assertive' );
}

/**
 * The button itself, mounted only for a site that can press it.
 *
 * Ports legacy's label and tooltip cycle (`src/js/components/back-up-now/index.jsx`) with
 * one fix: legacy discards the response, so a WPCOM refusal also shows "Backup enqueued".
 *
 * @return The rendered button.
 */
function BackupNow() {
	const { tracks } = useAnalytics();
	const { backupsStopped } = useSiteSize();
	const { state: enqueueState, errorMessage, enqueue, reset } = useEnqueueBackup();
	const descriptionId = useId();

	const isRequested = useBackupRequested();
	const { state: backupsState } = useBackups();
	const isBackupRunning = backupsState === 'in-progress';

	// Hand over from "enqueued" once WPCOM reports the backup, running or
	// already finished, which also ends the polling `useBackups` does while requested.
	useEffect( () => {
		if ( ( isBackupRunning || ! isRequested ) && enqueueState === 'enqueued' ) {
			reset();
		}
	}, [ isBackupRunning, isRequested, enqueueState, reset ] );

	// Recorded on the click rather than on a successful enqueue, which is
	// where legacy records it (`back-up-now/index.jsx:25-26`, before the
	// request resolves). The event measures the reader asking for a
	// backup, so a WPCOM refusal should still count as an ask — and
	// moving it onto success would silently drop exactly the failures
	// worth knowing about.
	const handleClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_plugin_backup_now' );
		enqueue( announceFailure );
	}, [ tracks, enqueue ] );

	const isEnqueuing = enqueueState === 'enqueuing';
	const isEnqueued = enqueueState === 'enqueued' || isRequested;

	// First match wins, mirroring the legacy precedence chain. `__()`
	// returns a branded string type carrying the literal it was called
	// with, so the accumulator has to be widened to plain `string` before
	// a differently-worded label can be assigned to it.
	let label: string = __( 'Back up now', 'jetpack-backup-pkg' );
	let tooltip: string | null = null;
	if ( backupsStopped ) {
		tooltip = __( 'Cannot queue backups due to reaching storage limits.', 'jetpack-backup-pkg' );
	} else if ( isBackupRunning ) {
		tooltip = __( 'A backup is currently in progress.', 'jetpack-backup-pkg' );
	} else if ( isEnqueuing ) {
		label = __( 'Queueing backup', 'jetpack-backup-pkg' );
	} else if ( isEnqueued ) {
		label = __( 'Backup enqueued', 'jetpack-backup-pkg' );
		tooltip = __( 'A backup has been queued and will start shortly.', 'jetpack-backup-pkg' );
	} else if ( enqueueState === 'error' ) {
		// Stays enabled: the label invites a retry and the reason is one
		// hover away. Legacy has no branch here at all.
		tooltip = errorMessage;
	}

	const disabled = isEnqueuing || isEnqueued || isBackupRunning || backupsStopped;

	// One tree in every state: a changed wrapper remounts the button and drops its focus.
	return (
		<Tooltip.Root disabled={ ! tooltip }>
			{ /*
			 * `Tooltip.Trigger` renders a `button` of its own, which cannot
			 * wrap ours, so it is rendered as a `span` instead. The span is
			 * deliberately not made focusable: `@wordpress/ui`'s Button
			 * defaults to `focusableWhenDisabled`, so it stays in the tab
			 * order and marks itself `aria-disabled` rather than taking the
			 * native `disabled` attribute — which means it still emits the
			 * pointer and focus events the tooltip anchors on, and adding a
			 * `tabIndex` here would only create a second tab stop.
			 */ }
			<Tooltip.Trigger render={ <span className="jpb-backup-now" /> }>
				<Button
					variant="outline"
					tone="neutral"
					disabled={ disabled }
					// Scoped to the request itself, never to the running backup.
					// `loading` paints the label `color: transparent` and overlays a
					// spinner — it keeps the button's width so the header doesn't
					// jump, but it also hides the text, which is only acceptable for
					// the second the POST is in flight. A backup runs for minutes,
					// and the label must stay readable for all of it.
					loading={ isEnqueuing }
					loadingAnnouncement={ label }
					onClick={ handleClick }
					aria-describedby={ tooltip ? descriptionId : undefined }
				>
					{ label }
				</Button>
				{ /* The tooltip gives the button no accessible description, so this does. */ }
				{ tooltip && (
					<VisuallyHidden id={ descriptionId } render={ <span /> }>
						{ tooltip }
					</VisuallyHidden>
				) }
			</Tooltip.Trigger>
			<Tooltip.Popup>{ tooltip }</Tooltip.Popup>
		</Tooltip.Root>
	);
}
