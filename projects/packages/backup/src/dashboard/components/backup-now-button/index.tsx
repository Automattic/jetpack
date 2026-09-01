import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Tooltip } from '@wordpress/ui';
import { useAnalytics } from '../../hooks/use-analytics';
import { useBackups } from '../../hooks/use-backups';
import { useEnqueueBackup } from '../../hooks/use-enqueue-backup';
import { useGateState } from '../../hooks/use-gate-state';
import { useSiteSize } from '../../hooks/use-site-size';

/**
 * Header action that asks WPCOM to back the site up now.
 *
 * Ports the legacy button's label and tooltip cycle
 * (`src/js/components/back-up-now/index.jsx`) onto the modernized data
 * layer, with two behavioural fixes.
 *
 * Failures are reported. The legacy click handler has no rejection
 * handler and discards the response body, so every outcome — including a
 * WPCOM refusal and a permissions error — shows "Backup enqueued".
 *
 * The button gates itself, on the same `useGateState` verdict `<Gates>` renders from: it
 * sits in `<Page>`'s header actions, above the gate, so an unconnected or unlicensed site
 * would otherwise be offered a control that cannot work.
 *
 * @return The rendered button, or null when the site can't use it.
 */
export default function BackupNowButton() {
	const { tracks } = useAnalytics();
	const gate = useGateState();
	const { backupsStopped } = useSiteSize();
	const { state: enqueueState, errorMessage, enqueue, reset } = useEnqueueBackup();

	// Keep polling between the enqueue and WPCOM publishing a record for
	// it: until that record exists, nothing in the response says a backup
	// is coming.
	const { state: backupsState } = useBackups( { forcePoll: enqueueState === 'enqueued' } );
	const isBackupRunning = backupsState === 'in-progress';

	// Hand over from "enqueued" to "in progress" once the backup actually
	// starts, which also ends the forced polling above — from here the
	// backups query polls on its own because the state says it should.
	useEffect( () => {
		if ( isBackupRunning && enqueueState === 'enqueued' ) {
			reset();
		}
	}, [ isBackupRunning, enqueueState, reset ] );

	// Recorded on the click rather than on a successful enqueue, which is
	// where legacy records it (`back-up-now/index.jsx:25-26`, before the
	// request resolves). The event measures the reader asking for a
	// backup, so a WPCOM refusal should still count as an ask — and
	// moving it onto success would silently drop exactly the failures
	// worth knowing about.
	const handleClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_plugin_backup_now' );
		enqueue();
	}, [ tracks, enqueue ] );

	if ( gate.status !== 'ready' ) {
		return null;
	}

	const isEnqueuing = enqueueState === 'enqueuing';
	const isEnqueued = enqueueState === 'enqueued';

	// First match wins, mirroring the legacy precedence chain. `__()`
	// returns a branded string type carrying the literal it was called
	// with, so the accumulator has to be widened to plain `string` before
	// a differently-worded label can be assigned to it.
	let label: string = __( 'Back up now', 'jetpack-backup-pkg' );
	let tooltip: string | null = null;
	if ( backupsStopped ) {
		tooltip = __( 'Cannot queue backups due to reaching storage limits.', 'jetpack-backup-pkg' );
	} else if ( isBackupRunning ) {
		label = __( 'Backup in progress', 'jetpack-backup-pkg' );
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

	const button = (
		<Button
			variant="outline"
			tone="neutral"
			disabled={ disabled }
			// Scoped to the request itself, never to the running backup.
			// `loading` paints the label `color: transparent` and overlays a
			// spinner — it keeps the button's width so the header doesn't
			// jump, but it also hides the text, which is only acceptable for
			// the second the POST is in flight. A backup runs for minutes,
			// and "Backup in progress" is the whole point of that state.
			loading={ isEnqueuing }
			loadingAnnouncement={ label }
			onClick={ handleClick }
		>
			{ label }
		</Button>
	);

	if ( ! tooltip ) {
		return button;
	}

	return (
		<Tooltip.Root>
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
			<Tooltip.Trigger render={ <span className="jpb-backup-now" /> }>{ button }</Tooltip.Trigger>
			<Tooltip.Popup>{ tooltip }</Tooltip.Popup>
		</Tooltip.Root>
	);
}
