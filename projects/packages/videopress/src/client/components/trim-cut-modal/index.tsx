import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Button, Modal, Notice, SnackbarList, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { ThemeProvider } from '@wordpress/theme';
import HeaderActions from '../../../dashboard/components/editor/header-actions';
import PreviewPlayer from '../../../dashboard/components/editor/preview/preview-player';
import { sessionEditsEqual } from '../../../dashboard/components/editor/state/edit-session';
import StatusBanner from '../../../dashboard/components/editor/status-banner';
import Timeline from '../../../dashboard/components/editor/timeline/timeline';
import { useEditSession } from '../../../dashboard/components/editor/use-edit-session';
import useFilmstrip from '../../../dashboard/hooks/use-filmstrip';
import { useVideo } from '../../../dashboard/hooks/use-video';
import ConfirmationOverlay from '../caption-manager-modal/confirmation-overlay';
import { usePreviewTransport } from '../chapters-editor/preview/use-preview-transport';
import { canRedo, canUndo } from '../chapters-editor/state/history';
import { isExemptTarget } from '../chapters-editor/timeline/use-keyboard-shortcuts';
import './style.scss';
import type { TrimCutModalProps } from './types';
import type { LibraryItem } from '../../../dashboard/types/library';
import type { KeyboardEvent } from 'react';

const NOTICE_CONTEXT = 'videopress-trim-cut-modal';
const client = new QueryClient( {
	defaultOptions: { queries: { staleTime: 0, retry: 1, refetchOnWindowFocus: false } },
} );
type Confirmation = 'save' | 'discard' | 'restore' | 'reload' | 'close';

/**
 * Share the dashboard editing session and timeline inside a block-editor modal.
 *
 * @param props             - Video metadata and modal callbacks.
 * @param props.video       - Loaded media item.
 * @param props.onClose     - Close callback.
 * @param props.onProcessed - Refresh the block preview after processing.
 * @return The modal workspace.
 */
function Workspace( {
	video,
	onClose,
	onProcessed,
}: {
	video: LibraryItem;
	onClose: () => void;
	onProcessed: () => void;
} ) {
	const editor = useEditSession( video, NOTICE_CONTEXT );
	const transport = usePreviewTransport();
	const [ sourceReady, setSourceReady ] = useState( false );
	const [ sourceDuration, setSourceDuration ] = useState( 0 );
	const [ confirmation, setConfirmation ] = useState< Confirmation | null >( null );
	const workspaceRef = useRef< HTMLDivElement >( null );
	const processedRef = useRef< string | null >( null );
	const { removeNotice, removeAllNotices } = useDispatch( noticesStore );
	const notices = useSelect( select => select( noticesStore ).getNotices( NOTICE_CONTEXT ), [] );
	const job = editor.edits?.job;
	const waitingForVideo =
		( video.isProcessing || video.durationSeconds <= 0 ) &&
		job?.status !== 'complete' &&
		job?.status !== 'failed';
	useVideo( video.id, { poll: job?.status === 'idle' || editor.isError } );
	const filmstrip = useFilmstrip( video.guid, ! waitingForVideo && ! editor.isLoading );
	const durationMismatch = Boolean(
		editor.edits &&
		sourceDuration > 0 &&
		Math.abs( sourceDuration - editor.edits.original_duration_ms ) > 1000
	);
	const locked =
		waitingForVideo || editor.locked || editor.conflict || ! sourceReady || durationMismatch;
	const actionsFrozen = locked || confirmation !== null;

	useEffect( () => {
		removeAllNotices( 'snackbar', NOTICE_CONTEXT );
	}, [ removeAllNotices ] );

	useEffect( () => {
		if ( job?.status === 'complete' && job.id && processedRef.current !== job.id ) {
			processedRef.current = job.id;
			onProcessed();
		}
	}, [ job?.status, job?.id, onProcessed ] );

	useEffect( () => {
		if ( ! editor.hasUnsavedChanges ) {
			return;
		}
		const beforeUnload = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener( 'beforeunload', beforeUnload );
		return () => window.removeEventListener( 'beforeunload', beforeUnload );
	}, [ editor.hasUnsavedChanges ] );

	useEffect( () => {
		const workspace = workspaceRef.current;
		if (
			confirmation === null &&
			workspace?.ownerDocument.activeElement === workspace?.ownerDocument.body
		) {
			workspace?.focus();
		}
	} );

	const requestClose = () => {
		if ( editor.requestPending || confirmation !== null ) {
			return;
		}
		if ( editor.hasUnsavedChanges ) {
			setConfirmation( 'close' );
		} else {
			onClose();
		}
	};
	const handleKeyDown = ( event: KeyboardEvent< HTMLDivElement > ) => {
		if ( event.defaultPrevented || confirmation !== null ) {
			return;
		}
		if ( event.key === 'Escape' ) {
			event.preventDefault();
			event.stopPropagation();
			requestClose();
			return;
		}
		if ( locked || isExemptTarget( event.target ) || event.altKey ) {
			return;
		}
		if ( event.metaKey || event.ctrlKey ) {
			if ( event.key.toLowerCase() !== 'z' ) {
				return;
			}
			editor.dispatch( { type: event.shiftKey ? 'REDO' : 'UNDO' } );
		} else {
			switch ( event.key ) {
				case ' ':
					transport.onTogglePlay();
					break;
				case 'ArrowLeft':
					transport.onSeek( Math.max( 0, transport.currentMs - ( event.shiftKey ? 1000 : 100 ) ) );
					break;
				case 'ArrowRight':
					transport.onSeek(
						Math.min(
							editor.session.durationMs,
							transport.currentMs + ( event.shiftKey ? 1000 : 100 )
						)
					);
					break;
				case 'Home':
					transport.onSeek( editor.session.trimStartMs );
					break;
				case 'End':
					transport.onSeek( editor.session.trimEndMs );
					break;
				case 'Delete':
				case 'Backspace':
					if ( editor.session.selectedCutId ) {
						editor.dispatch( { type: 'REMOVE_CUT', id: editor.session.selectedCutId } );
					}
					break;
				default:
					return;
			}
		}
		event.preventDefault();
		event.stopPropagation();
	};
	const messages: Record< Confirmation, string > = {
		save: __(
			'Viewers will see the edited video. Your original is kept and can be restored. Existing chapters may need to be adjusted after the video finishes processing.',
			'jetpack-videopress-pkg'
		),
		discard: __( 'Discard unsaved video edits?', 'jetpack-videopress-pkg' ),
		close: __( 'Discard unsaved video edits and close the editor?', 'jetpack-videopress-pkg' ),
		restore: __(
			'All saved and unsaved video edits will be removed. Viewers will see the original video again.',
			'jetpack-videopress-pkg'
		),
		reload: __(
			'Your unsaved edits will be replaced with the latest saved version.',
			'jetpack-videopress-pkg'
		),
	};
	const labels: Record< Confirmation, string > = {
		save: __( 'Update video', 'jetpack-videopress-pkg' ),
		discard: __( 'Discard', 'jetpack-videopress-pkg' ),
		close: __( 'Discard', 'jetpack-videopress-pkg' ),
		restore: __( 'Restore original', 'jetpack-videopress-pkg' ),
		reload: __( 'Reload latest', 'jetpack-videopress-pkg' ),
	};
	const confirm = () => {
		if ( confirmation === 'save' && ! locked ) {
			void editor.submit();
		} else if ( confirmation === 'restore' ) {
			void editor.submit( true );
		} else if ( confirmation === 'reload' ) {
			void editor.reload();
		} else if ( confirmation === 'discard' ) {
			editor.discard();
		} else if ( confirmation === 'close' ) {
			onClose();
		}
		setConfirmation( null );
	};

	return (
		<Modal
			title={ sprintf(
				/* translators: %s: video title. */ __( 'Trim & cut · %s', 'jetpack-videopress-pkg' ),
				video.title
			) }
			className="videopress-trim-cut-modal"
			onRequestClose={ requestClose }
			isDismissible={ false }
			shouldCloseOnClickOutside={ false }
			shouldCloseOnEsc={ false }
			headerActions={
				// eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Keep editor shortcuts within the modal.
				<div className="videopress-trim-cut-modal__actions" onKeyDown={ handleKeyDown }>
					<HeaderActions
						canUndo={ ! actionsFrozen && canUndo( editor.history, sessionEditsEqual ) }
						canRedo={ ! actionsFrozen && canRedo( editor.history ) }
						onUndo={ () => editor.dispatch( { type: 'UNDO' } ) }
						onRedo={ () => editor.dispatch( { type: 'REDO' } ) }
						canDiscard={ ! editor.locked && confirmation === null && editor.dirty }
						onDiscard={ () => setConfirmation( 'discard' ) }
						canSave={ ! actionsFrozen && editor.dirty }
						onSave={ () => setConfirmation( 'save' ) }
						canRestoreOriginal={
							!! editor.edits?.can_restore_original &&
							! editor.locked &&
							! editor.conflict &&
							! waitingForVideo &&
							confirmation === null
						}
						onRestoreOriginal={ () => setConfirmation( 'restore' ) }
					/>
					<Button
						icon={ close }
						label={ __( 'Close', 'jetpack-videopress-pkg' ) }
						onClick={ requestClose }
					/>
				</div>
			}
		>
			{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Handle editor shortcuts before Gutenberg's document listeners. */ }
			<div
				ref={ workspaceRef }
				tabIndex={ -1 }
				className="videopress-trim-cut-modal__workspace vp-chapters-tokens"
				onKeyDown={ handleKeyDown }
			>
				<StatusBanner
					job={ job }
					conflict={ editor.conflict }
					onRetry={ editor.canRetry ? () => void editor.retryProcessing() : undefined }
					onReloadLatest={ () => setConfirmation( 'reload' ) }
				/>
				{ durationMismatch && (
					<Notice status="error" isDismissible={ false }>
						{ __(
							'The original video does not match the editing timeline. Reload the editor before making changes.',
							'jetpack-videopress-pkg'
						) }
					</Notice>
				) }
				{ editor.isError && ! editor.edits ? (
					<Notice
						status="error"
						isDismissible={ false }
						actions={ [
							{
								label: __( 'Try again', 'jetpack-videopress-pkg' ),
								onClick: () => void editor.reload(),
							},
						] }
					>
						{ __( 'Video edits could not be loaded. Please try again.', 'jetpack-videopress-pkg' ) }
					</Notice>
				) : (
					<>
						<PreviewPlayer
							ref={ transport.playerRef }
							video={ video }
							processing={ waitingForVideo }
							session={ editor.session }
							onTimeUpdate={ transport.onTimeUpdate }
							onPlayingChange={ transport.onPlayingChange }
							onSourceReadyChange={ setSourceReady }
							onDurationChange={ setSourceDuration }
						/>
						<Timeline
							session={ editor.session }
							dispatch={ action => {
								if ( ! actionsFrozen ) {
									editor.dispatch( action );
								}
							} }
							currentMs={ transport.currentMs }
							onSeek={ transport.onSeek }
							onTogglePlay={ transport.onTogglePlay }
							playing={ transport.playing }
							locked={ actionsFrozen }
							onScrubStart={ transport.onScrubStart }
							onScrubEnd={ transport.onScrubEnd }
							shortcutsEnabled={ false }
							filmstrip={ filmstrip }
						/>
					</>
				) }
				{ confirmation && (
					<ConfirmationOverlay
						message={ messages[ confirmation ] }
						confirmLabel={ labels[ confirmation ] }
						onConfirm={ confirm }
						onCancel={ () => setConfirmation( null ) }
					/>
				) }
				<SnackbarList notices={ notices } onRemove={ id => removeNotice( id, NOTICE_CONTEXT ) } />
			</div>
		</Modal>
	);
}

/**
 * Load authoritative attachment metadata before mounting an edit session.
 *
 * @param props - Modal props.
 * @return The loaded workspace or loading/error modal.
 */
function LoadedModal( props: TrimCutModalProps ) {
	const { video, isError, refetch } = useVideo( props.attachmentId, { poll: false } );
	if ( video && video.guid === props.guid ) {
		return (
			<Workspace video={ video } onClose={ props.onClose } onProcessed={ props.onProcessed } />
		);
	}
	return (
		<Modal title={ __( 'Trim & cut', 'jetpack-videopress-pkg' ) } onRequestClose={ props.onClose }>
			{ isError || video ? (
				<Notice
					status="error"
					isDismissible={ false }
					actions={ [
						{ label: __( 'Try again', 'jetpack-videopress-pkg' ), onClick: () => void refetch() },
					] }
				>
					{ __(
						'Video information could not be loaded. Please try again.',
						'jetpack-videopress-pkg'
					) }
				</Notice>
			) : (
				<Spinner />
			) }
		</Modal>
	);
}

/**
 * Provide the query cache and design-system theme for the block editor modal.
 *
 * @param props - Modal props.
 * @return The trim-and-cut modal.
 */
export default function TrimCutModal( props: TrimCutModalProps ) {
	const modal = <LoadedModal { ...props } />;
	return (
		<QueryClientProvider client={ client }>
			{ ThemeProvider ? <ThemeProvider>{ modal }</ThemeProvider> : modal }
		</QueryClientProvider>
	);
}
