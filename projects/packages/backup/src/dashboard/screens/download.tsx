import { Notice, ProgressBar, Spinner } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, cloud, download as downloadIcon, arrowLeft } from '@wordpress/icons';
import { Link, useParams, useSearch } from '@wordpress/route';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import DashboardLayout from '../components/dashboard-layout';
import InvalidRewindId from '../components/invalid-rewind-id';
import RestoreItemsChecklist from '../components/restore-items-checklist';
import { useDownload } from '../hooks/use-download';
import { DEFAULT_RESTORE_ITEMS, hasSelectedItems } from '../types/restore';
import { isValidRewindId, rewindIdToIso } from '../types/rewind-id';

// Stable so the submit button can point at the hint with
// `aria-describedby`. A module constant rather than `useInstanceId`
// because only one of these renders per page.
const SELECTION_HINT_ID = 'jpb-download__selection-hint';

/**
 * The Download route's own search params.
 *
 * `files` carries the file browser's selection as the comma-joined `ls`
 * entry ids the detail pane built — the same string upstream's
 * `include_path_list` takes.
 */
type DownloadSearch = Record< string, unknown > & { files?: string };

/**
 * Download screen — same narrow layout as the Restore screen minus the
 * warning notice. Submission runs through a real state machine via the
 * `/jetpack/v4/backups/download/$rewindId` bridge; the success branch
 * surfaces the signed download URL as a link.
 *
 * Two modes, decided by whether the reader arrived with a file selection. With
 * one, the category checklist is skipped: upstream models `paths` as one *of*
 * the six categories rather than a filter across them, so a request naming files
 * cannot also name categories.
 *
 * @return The rendered Download screen.
 */
export default function DownloadScreen() {
	const { rewindId } = useParams( { from: '/download/$rewindId' } );
	// `strict: false` is the unvalidated read, and it is the whole option:
	// passing `from` as well would send it down the route-id lookup that
	// throws on a mismatch, which is the opposite of what is wanted for a
	// param no route declares.
	const search = useSearch( { strict: false } ) as DownloadSearch;
	const [ items, setItems ] = useState( DEFAULT_RESTORE_ITEMS );
	const { state, submit, reset } = useDownload( rewindId );
	const handleGenerate = useCallback( () => submit( items ), [ submit, items ] );
	// An empty checklist would ask WPCOM for the *whole* archive, not for
	// nothing — see `hasSelectedItems`.
	const hasSelection = hasSelectedItems( items );

	// Kept as one string: it is already the `include_path_list` value
	// JETPACK-2321 forwards, and a single `ls` entry id can contain a comma, so
	// the pieces between commas are not entries.
	const files = typeof search.files === 'string' ? search.files : '';
	const hasFileSelection = files.replace( /,/g, '' ) !== '';

	// A ref, not Overview's module latch: a second mount here means the reader
	// came back for a second archive. This only stops StrictMode asking twice.
	const hasAutoStarted = useRef( false );
	useEffect( () => {
		if ( ! hasFileSelection || hasAutoStarted.current || ! isValidRewindId( rewindId ) ) {
			return;
		}
		hasAutoStarted.current = true;
		submit( items );
	}, [ hasFileSelection, rewindId, submit, items ] );

	// With a file selection there is no checklist to send the reader back
	// to, so a failed attempt has to re-submit rather than return to a
	// form. `reset()` first, because the hook keeps reporting `error`
	// until something succeeds.
	const handleRetry = useCallback( () => {
		reset();
		submit( items );
	}, [ reset, submit, items ] );

	// A file selection has no form stage: the screen is waiting from the
	// moment it mounts, before the mutation has even been sent.
	const isPreparing =
		state.phase === 'progress' ||
		( hasFileSelection && ( state.phase === 'idle' || state.phase === 'submitting' ) );

	// A malformed id can only produce a failed download, so the screen
	// offers the way back and nothing else — see `InvalidRewindId`.
	if ( ! isValidRewindId( rewindId ) ) {
		return (
			<InvalidRewindId
				prefix="jpb-download"
				title={ __( "This download link isn't valid.", 'jetpack-backup-pkg' ) }
				body={ __(
					'The address is missing a valid download point. Go back to the overview and choose a backup to download.',
					'jetpack-backup-pkg'
				) }
			/>
		);
	}

	const downloadPoint = rewindIdToIso( rewindId );

	return (
		<DashboardLayout>
			<div className="jpb-download">
				<Link to="/" className="jpb-download__back">
					<Icon icon={ arrowLeft } size={ 18 } />
					{ __( 'Back to overview', 'jetpack-backup-pkg' ) }
				</Link>
				<Card.Root className="jpb-download__card">
					<Stack direction="row" gap="sm" align="center">
						<Icon icon={ cloud } />
						<Stack direction="column" gap="xs">
							<Text variant="heading-md" render={ <h2 /> }>
								{ __( 'Download backup', 'jetpack-backup-pkg' ) }
							</Text>
							<Text variant="body-sm" className="jpb-text-muted">
								{ __( 'Download point:', 'jetpack-backup-pkg' ) }{ ' ' }
								{ dateI18n( 'M j, Y, g:i A', downloadPoint, undefined ) }
							</Text>
						</Stack>
					</Stack>
					{ ! hasFileSelection && ( state.phase === 'idle' || state.phase === 'submitting' ) && (
						<>
							<Text>
								{ __(
									'Choose the items you wish to include in the download:',
									'jetpack-backup-pkg'
								) }
							</Text>
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
									: __( 'Select at least one item to download.', 'jetpack-backup-pkg' ) }
							</Text>
							<Button
								className="jpb-download__confirm"
								variant="solid"
								disabled={ ! hasSelection || state.phase === 'submitting' }
								aria-describedby={ SELECTION_HINT_ID }
								onClick={ handleGenerate }
							>
								{ state.phase === 'submitting' ? (
									<Spinner />
								) : (
									<Icon icon={ downloadIcon } size={ 18 } />
								) }
								{ __( 'Generate download', 'jetpack-backup-pkg' ) }
							</Button>
						</>
					) }
					{ /*
					 * One block for the whole wait, so the heading does not remount when
					 * the POST resolves. The spinner covers only the window before there
					 * is a download id to poll, and is left unnamed: it ships as
					 * `role="presentation"`, which an `aria-label` would cancel.
					 */ }
					{ isPreparing && (
						<Stack direction="column" gap="sm">
							<Text>{ __( 'Preparing download…', 'jetpack-backup-pkg' ) }</Text>
							{ state.phase === 'progress' ? (
								<ProgressBar
									value={ state.percent }
									aria-label={ __( 'Preparing your download', 'jetpack-backup-pkg' ) }
								/>
							) : (
								<Spinner />
							) }
						</Stack>
					) }
					{ state.phase === 'success' && (
						<Stack direction="column" gap="sm">
							<Notice status="success" isDismissible={ false }>
								{ __( 'Your download is ready.', 'jetpack-backup-pkg' ) }
							</Notice>
							<a
								className="jpb-download__link"
								href={ state.downloadUrl }
								download
								rel="noreferrer"
							>
								{ __( 'Download the file', 'jetpack-backup-pkg' ) }
							</a>
							{ /*
							 * WPCOM signs the archive URL with an expiry. Saying
							 * when it lapses is the difference between coming back
							 * to a dead link and knowing to fetch it again.
							 */ }
							{ state.validUntil && (
								<Text variant="body-sm" className="jpb-text-muted">
									{ sprintf(
										/* translators: %s: date and time the download link stops working. */
										__( 'This link expires %s.', 'jetpack-backup-pkg' ),
										dateI18n( 'M j, Y, g:i A', state.validUntil, undefined )
									) }
								</Text>
							) }
						</Stack>
					) }
					{ state.phase === 'error' && (
						<Stack direction="column" gap="sm">
							<Notice status="error" isDismissible={ false }>
								{ state.message }
							</Notice>
							<Button
								className="jpb-download__confirm"
								variant="outline"
								onClick={ hasFileSelection ? handleRetry : reset }
							>
								{ __( 'Try again', 'jetpack-backup-pkg' ) }
							</Button>
						</Stack>
					) }
				</Card.Root>
			</div>
		</DashboardLayout>
	);
}
