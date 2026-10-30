import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { ProgressBar, VisuallyHidden } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import {
	Icon,
	check,
	download as downloadIcon,
	arrowLeft,
	arrowRight,
	error as errorIcon,
} from '@wordpress/icons';
import { Link, useParams, useSearch } from '@wordpress/route';
import {
	Button,
	Card,
	EmptyState,
	Link as ExternalLink,
	ButtonLink,
	Spinner,
	Stack,
	Text,
} from '@wordpress/ui';
import DashboardLayout from '../components/dashboard-layout';
import ErrorReference from '../components/error-reference';
import InvalidRewindId from '../components/invalid-rewind-id';
import RestoreItemsChecklist from '../components/restore-items-checklist';
import { splitFileSelection } from '../data/api/download';
import { formatDateTime } from '../data/date-format';
import { useSiteSuffix } from '../hooks/use-connection';
import { useDownload } from '../hooks/use-download';
import { useGateState } from '../hooks/use-gate-state';
import { useStepFocus } from '../hooks/use-step-focus';
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
 * entry ids the detail pane built.
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
	const { rewindId } = useParams( { strict: false } ) as { rewindId: string };
	const gate = useGateState();
	const siteSuffix = useSiteSuffix();
	// `strict: false` is the unvalidated read, and it is the whole option:
	// passing `from` as well would send it down the route-id lookup that
	// throws on a mismatch, which is the opposite of what is wanted for a
	// param no route declares.
	const search = useSearch( { strict: false } ) as DownloadSearch;
	const [ items, setItems ] = useState( DEFAULT_RESTORE_ITEMS );
	const isGateReady = gate.status === 'ready';

	// Kept as the one string the link carried, so the request is built from
	// exactly what the detail pane counted.
	const files = typeof search.files === 'string' ? search.files : '';
	const hasFileSelection = useMemo( () => splitFileSelection( files ).length > 0, [ files ] );

	// Not with a file selection: the downloads list cannot say which files a ready archive holds.
	const { state, submit, submitFiles, reset } = useDownload(
		rewindId,
		isGateReady,
		! hasFileSelection
	);
	const { ref: stepHeadingRef, arm: armStepFocus } = useStepFocus( state.phase );
	const handleGenerate = useCallback( () => {
		armStepFocus();
		submit( items );
	}, [ armStepFocus, submit, items ] );
	// An empty checklist would ask WPCOM for the *whole* archive, not for
	// nothing — see `hasSelectedItems`.
	const hasSelection = hasSelectedItems( items );

	// A ref, not Overview's module latch: a second mount here means the reader
	// came back for a second archive. This only stops StrictMode asking twice.
	const hasAutoStarted = useRef( false );
	useEffect( () => {
		if (
			! isGateReady ||
			! hasFileSelection ||
			hasAutoStarted.current ||
			! isValidRewindId( rewindId )
		) {
			return;
		}
		hasAutoStarted.current = true;
		submitFiles( files );
	}, [ isGateReady, hasFileSelection, rewindId, submitFiles, files ] );

	// With a file selection there is no checklist to send the reader back
	// to, so a failed attempt has to re-submit rather than return to a
	// form. `reset()` first, because the hook keeps reporting `error`
	// until something succeeds.
	const handleRetry = useCallback( () => {
		armStepFocus();
		reset();
		if ( hasFileSelection ) {
			submitFiles( files );
		}
	}, [ armStepFocus, reset, hasFileSelection, submitFiles, files ] );

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
	const titles = {
		checking: __( 'Checking for a download in progress…', 'jetpack-backup-pkg' ),
		preparing: __( 'Preparing download…', 'jetpack-backup-pkg' ),
		ready: __( 'Your download is ready', 'jetpack-backup-pkg' ),
	};
	let announcement = '';
	if ( state.phase === 'checking' ) {
		announcement = titles.checking;
	} else if ( isPreparing ) {
		announcement = titles.preparing;
	} else if ( state.phase === 'success' ) {
		announcement = titles.ready;
	}
	const isFormStep = ! hasFileSelection && ( state.phase === 'idle' || state.phase === 'checking' );
	// Under a ready download too, or this backup would offer nothing else until it expires.
	const showsForm =
		! hasFileSelection &&
		( state.phase === 'idle' || state.phase === 'submitting' || state.phase === 'success' );

	return (
		<DashboardLayout>
			<div className="jpb-download">
				<Link to="/" className="jpb-download__back">
					<Icon icon={ isRTL() ? arrowRight : arrowLeft } size={ 18 } />
					{ __( 'Back to overview', 'jetpack-backup-pkg' ) }
				</Link>
				<Card.Root className="jpb-download__card">
					<Card.Header className="jpb-download__header">
						<Stack direction="row" gap="sm" align="center">
							<Icon icon={ downloadIcon } />
							<Stack direction="column" gap="xs">
								<Text
									variant="body-lg"
									render={ <h2 /> }
									ref={ isFormStep ? stepHeadingRef : undefined }
									tabIndex={ -1 }
								>
									{ __( 'Download backup', 'jetpack-backup-pkg' ) }
								</Text>
								<Text variant="body-md" className="jpb-text-muted">
									{ sprintf(
										/* translators: %s: date and time of the backup. */
										__( 'Download point: %s', 'jetpack-backup-pkg' ),
										formatDateTime( downloadPoint )
									) }
								</Text>
							</Stack>
						</Stack>
					</Card.Header>
					<Card.Content className="jpb-download__body">
						{ /* Always mounted, for the reason given at `SELECTION_HINT_ID`. */ }
						<VisuallyHidden role="status">{ announcement }</VisuallyHidden>
						{ state.phase === 'checking' && (
							<Stack direction="row" gap="sm" align="center">
								<Spinner />
								<Text className="jpb-text-muted">{ titles.checking }</Text>
							</Stack>
						) }
						{ state.phase === 'success' && (
							<EmptyState.Root className="jpb-download__status">
								<EmptyState.Visual>
									<EmptyState.Icon
										className="jpb-download__badge jpb-download__badge--success"
										icon={ check }
									/>
								</EmptyState.Visual>
								<EmptyState.Title
									className="jpb-download__status-title"
									ref={ stepHeadingRef }
									tabIndex={ -1 }
								>
									<Text variant="body-xl" render={ <span /> }>
										{ titles.ready }
									</Text>
								</EmptyState.Title>
								{ /*
								 * WPCOM signs the archive URL with an expiry. Saying
								 * when it lapses is the difference between coming back
								 * to a dead link and knowing to fetch it again.
								 */ }
								{ state.validUntil && (
									<EmptyState.Description>
										{ sprintf(
											/* translators: %s: date and time the download link stops working. */
											__( 'This expires %s.', 'jetpack-backup-pkg' ),
											formatDateTime( state.validUntil )
										) }
									</EmptyState.Description>
								) }
								<EmptyState.Actions>
									<ButtonLink variant="solid" href={ state.downloadUrl } download rel="noreferrer">
										{ __( 'Download file', 'jetpack-backup-pkg' ) }
									</ButtonLink>
								</EmptyState.Actions>
							</EmptyState.Root>
						) }
						{ showsForm && (
							<>
								<RestoreItemsChecklist
									legend={ __(
										'Choose the items you wish to include in the download:',
										'jetpack-backup-pkg'
									) }
									value={ items }
									onChange={ setItems }
								/>
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
							<EmptyState.Root className="jpb-download__status">
								{ state.phase === 'progress' ? (
									<ProgressBar
										className="jpb-download__bar"
										value={ state.percent }
										aria-label={ __( 'Preparing your download', 'jetpack-backup-pkg' ) }
									/>
								) : (
									<Spinner />
								) }
								<EmptyState.Title
									className="jpb-download__status-title"
									ref={ stepHeadingRef }
									tabIndex={ -1 }
								>
									<Text variant="body-xl" render={ <span /> }>
										{ titles.preparing }
									</Text>
								</EmptyState.Title>
								{ state.phase === 'progress' && state.reconnecting && (
									<EmptyState.Description>
										{ __( 'Reconnecting…', 'jetpack-backup-pkg' ) }
									</EmptyState.Description>
								) }
							</EmptyState.Root>
						) }
						{ state.phase === 'error' && (
							<EmptyState.Root className="jpb-download__status" role="alert">
								<EmptyState.Visual>
									<EmptyState.Icon
										className="jpb-download__badge jpb-download__badge--error"
										icon={ errorIcon }
									/>
								</EmptyState.Visual>
								<EmptyState.Title
									className="jpb-download__status-title"
									ref={ stepHeadingRef }
									tabIndex={ -1 }
								>
									<Text variant="body-xl" render={ <span /> }>
										{ __( 'Could not prepare the download', 'jetpack-backup-pkg' ) }
									</Text>
								</EmptyState.Title>
								<EmptyState.Description>{ state.message }</EmptyState.Description>
								<ErrorReference { ...state.reference } />
								<ExternalLink
									openInNewTab
									href={ getRedirectUrl(
										'jetpack-contact-support',
										siteSuffix ? { site: siteSuffix } : {}
									) }
								>
									{ __( 'Contact support', 'jetpack-backup-pkg' ) }
								</ExternalLink>
								<EmptyState.Actions>
									<Button variant="solid" onClick={ handleRetry }>
										{ __( 'Try again', 'jetpack-backup-pkg' ) }
									</Button>
								</EmptyState.Actions>
							</EmptyState.Root>
						) }
					</Card.Content>
				</Card.Root>
			</div>
		</DashboardLayout>
	);
}
