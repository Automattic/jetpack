import { Notice, ProgressBar, Spinner } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, backup as backupIcon, arrowLeft } from '@wordpress/icons';
import { Link, useParams } from '@wordpress/route';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import DashboardLayout from '../components/dashboard-layout';
import InvalidRewindId from '../components/invalid-rewind-id';
import RestoreItemsChecklist from '../components/restore-items-checklist';
import { useRestore } from '../hooks/use-restore';
import { DEFAULT_RESTORE_ITEMS, hasSelectedItems } from '../types/restore';
import { isValidRewindId, rewindIdToIso } from '../types/rewind-id';

// Stable so the submit button can point at the hint with
// `aria-describedby`. A module constant rather than `useInstanceId`
// because only one of these renders per page.
const SELECTION_HINT_ID = 'jpb-restore__selection-hint';

/**
 * Restore screen — narrow centered layout with the warning notice, the
 * shared item checklist, and a Confirm button. Submit drives a real
 * state machine over the `/jetpack/v4/rewind/to/$rewindId` bridge.
 *
 * @return The rendered Restore screen.
 */
export default function RestoreScreen() {
	const { rewindId } = useParams( { from: '/restore/$rewindId' } );
	const [ items, setItems ] = useState( DEFAULT_RESTORE_ITEMS );
	const { state, submit, reset, adopted } = useRestore( rewindId );
	const handleConfirm = useCallback( () => submit( items ), [ submit, items ] );
	// An empty checklist would restore *everything* rather than nothing —
	// see `hasSelectedItems`. On this screen that is unrecoverable.
	const hasSelection = hasSelectedItems( items );

	// When the restore on screen was already running before this screen
	// opened, the heading has to name *its* backup. It need not be the one
	// in the address: a restore of any point overwrites the same live
	// site, so the screen adopts whatever is running rather than arming a
	// button beside it, and then owes the reader an explanation of why
	// their checklist is missing.
	const shownRewindId =
		adopted && isValidRewindId( adopted.rewindId ) ? adopted.rewindId : rewindId;

	// A malformed id can only produce a failed restore, so the screen
	// offers the way back and nothing else — see `InvalidRewindId`.
	if ( ! isValidRewindId( rewindId ) ) {
		return (
			<InvalidRewindId
				prefix="jpb-restore"
				title={ __( "This restore link isn't valid.", 'jetpack-backup-pkg' ) }
				body={ __(
					'The address is missing a valid restore point. Go back to the overview and choose a backup to restore.',
					'jetpack-backup-pkg'
				) }
			/>
		);
	}

	const restorePoint = rewindIdToIso( shownRewindId );

	return (
		<DashboardLayout>
			<div className="jpb-restore">
				<Link to="/" className="jpb-restore__back">
					<Icon icon={ arrowLeft } size={ 18 } />
					{ __( 'Back to overview', 'jetpack-backup-pkg' ) }
				</Link>
				<Card.Root className="jpb-restore__card">
					<Stack direction="row" gap="sm" align="center">
						<Icon icon={ backupIcon } />
						<Stack direction="column" gap="xs">
							<Text variant="heading-md" render={ <h3 /> }>
								{ __( 'Restore backup', 'jetpack-backup-pkg' ) }
							</Text>
							<Text variant="body-sm" className="jpb-text-muted">
								{ __( 'Restore point:', 'jetpack-backup-pkg' ) }{ ' ' }
								{ dateI18n( 'M j, Y, g:i A', restorePoint, undefined ) }
							</Text>
						</Stack>
					</Stack>
					{ /*
					 * The opening state of every cold load. Neither the form nor a
					 * progress bar, because we do not yet know which is true — and
					 * a Confirm button that appears and is withdrawn a moment later
					 * is the same hazard as one that should never have appeared.
					 */ }
					{ state.phase === 'checking' && (
						<Stack direction="row" gap="sm" align="center">
							<Spinner />
							<Text className="jpb-text-muted">
								{ __( 'Checking for a restore in progress…', 'jetpack-backup-pkg' ) }
							</Text>
						</Stack>
					) }
					{ adopted && (
						<Notice status="info" isDismissible={ false }>
							{ __(
								"A restore is already running for this site. You can't start another until it finishes.",
								'jetpack-backup-pkg'
							) }
						</Notice>
					) }
					{ ( state.phase === 'idle' || state.phase === 'submitting' ) && (
						<>
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'Restoring will overwrite the matching parts of your live site with the contents of this backup. This cannot be undone.',
									'jetpack-backup-pkg'
								) }
							</Notice>
							<Text>{ __( 'Choose the items you wish to restore:', 'jetpack-backup-pkg' ) }</Text>
							<RestoreItemsChecklist value={ items } onChange={ setItems } />
							{ /*
							 * The live region is mounted unconditionally and only its text
							 * changes. A region that appears together with its first message
							 * is unreliable — assistive tech generally needs it in the tree
							 * before the content changes, and VoiceOver in particular often
							 * misses the simultaneous case. `jpb-visually-hidden` takes it out
							 * of flow while empty rather than unmounting it, because this card
							 * is a flex column with a gap and an in-flow empty node would cost
							 * 16px of dead space on every render where there is nothing to say.
							 *
							 * `aria-describedby` is likewise unconditional: it resolves to the
							 * same element either way, and an empty target contributes nothing
							 * to the accessible description. Between them the reader is told
							 * both when they clear the last box and when they reach the button
							 * — @wordpress/ui renders a disabled button as focusable
							 * `aria-disabled`, so it is reachable but silent about why.
							 */ }
							<Text
								id={ SELECTION_HINT_ID }
								variant="body-sm"
								role="status"
								className={ hasSelection ? 'jpb-visually-hidden' : undefined }
							>
								{ hasSelection
									? ''
									: __( 'Select at least one item to restore.', 'jetpack-backup-pkg' ) }
							</Text>
							<Button
								className="jpb-restore__confirm"
								variant="solid"
								disabled={ ! hasSelection || state.phase === 'submitting' }
								aria-describedby={ SELECTION_HINT_ID }
								onClick={ handleConfirm }
							>
								{ state.phase === 'submitting' ? (
									<Spinner />
								) : (
									<Icon icon={ backupIcon } size={ 18 } />
								) }
								{ __( 'Confirm restore', 'jetpack-backup-pkg' ) }
							</Button>
						</>
					) }
					{ /*
					 * Accepted, but nothing to report yet — either WordPress.com has
					 * not started publishing progress, or it queued the restore
					 * without naming an id we can poll. Indeterminate rather than a
					 * determinate bar pinned at 0%, which reads as a stall during the
					 * opening seconds of every restore.
					 */ }
					{ state.phase === 'queued' && (
						<Stack direction="column" gap="sm">
							<Text>
								{ __( 'Your restore is queued and will begin shortly…', 'jetpack-backup-pkg' ) }
							</Text>
							<ProgressBar />
						</Stack>
					) }
					{ state.phase === 'progress' && (
						<Stack direction="column" gap="sm">
							<Text>{ __( 'Restoring…', 'jetpack-backup-pkg' ) }</Text>
							<ProgressBar value={ state.percent } />
						</Stack>
					) }
					{ state.phase === 'success' && (
						<Stack direction="column" gap="sm">
							<Notice status="success" isDismissible={ false }>
								{ __( 'Restore complete.', 'jetpack-backup-pkg' ) }
							</Notice>
							<Link to="/">{ __( 'Back to overview', 'jetpack-backup-pkg' ) }</Link>
						</Stack>
					) }
					{ /*
					 * Finished, but not cleanly. Warning rather than success or error:
					 * the site has been restored, so treating it as a failure invites a
					 * pointless retry — but parts of it did not land, and "Restore
					 * complete." would be a lie the reader discovers later.
					 */ }
					{ state.phase === 'success-with-errors' && (
						<Stack direction="column" gap="sm">
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'Restore finished, but some items could not be restored.',
									'jetpack-backup-pkg'
								) }
							</Notice>
							{ state.message && (
								<Text variant="body-sm" className="jpb-text-muted">
									{ state.message }
								</Text>
							) }
							<Link to="/">{ __( 'Back to overview', 'jetpack-backup-pkg' ) }</Link>
						</Stack>
					) }
					{ /*
					 * We asked and never got an answer, so nothing has been ruled
					 * out: WordPress.com may have queued the restore and lost only
					 * the reply. No control here on purpose — offering "Try again"
					 * now is exactly how a second concurrent restore starts. The
					 * recovery poll is looking, and either finds the restore or
					 * runs out the deadline, at which point a retry is safe and
					 * the error branch below offers one.
					 */ }
					{ state.phase === 'unconfirmed' && (
						<Stack direction="column" gap="sm">
							<Notice status="warning" isDismissible={ false }>
								{ __(
									"We didn't hear back from WordPress.com. Checking whether your restore started…",
									'jetpack-backup-pkg'
								) }
							</Notice>
							{ state.detail && (
								<Text variant="body-sm" className="jpb-text-muted">
									{ state.detail }
								</Text>
							) }
							<ProgressBar />
						</Stack>
					) }
					{ /*
					 * Accepted, and then out of sight — the silence deadline passed, or
					 * the status poll stopped answering. Deliberately not the error
					 * branch below, which offers "Try again": that resets to an armed
					 * Confirm button, so the only control on screen would start a second
					 * concurrent restore of the same site directly beneath a notice
					 * saying the first may still be running. Nothing upstream is known
					 * to refuse that.
					 *
					 * Warning rather than error for the same reason the copy says "may":
					 * we have no evidence the restore failed, only that we cannot see
					 * it. There is nothing for the reader to do here, so the only way
					 * out is the way out.
					 */ }
					{ state.phase === 'lost-track' && (
						<Stack direction="column" gap="sm">
							<Notice status="warning" isDismissible={ false }>
								{ __(
									"We've lost track of this restore. It may still be running — you'll get an email when it finishes.",
									'jetpack-backup-pkg'
								) }
							</Notice>
							{ state.detail && (
								<Text variant="body-sm" className="jpb-text-muted">
									{ state.detail }
								</Text>
							) }
							<Link to="/">{ __( 'Back to overview', 'jetpack-backup-pkg' ) }</Link>
						</Stack>
					) }
					{ /*
					 * Nothing is running: the submission was refused, or the restore
					 * reached `failed`/`aborted`. That is what makes "Try again" safe
					 * here and nowhere else.
					 */ }
					{ state.phase === 'error' && (
						<Stack direction="column" gap="sm">
							<Notice status="error" isDismissible={ false }>
								{ state.message }
							</Notice>
							<Button className="jpb-restore__confirm" variant="outline" onClick={ reset }>
								{ __( 'Try again', 'jetpack-backup-pkg' ) }
							</Button>
						</Stack>
					) }
				</Card.Root>
			</div>
		</DashboardLayout>
	);
}
