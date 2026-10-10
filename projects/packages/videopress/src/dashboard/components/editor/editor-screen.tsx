import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Button, Notice, Text } from '@wordpress/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import EditorOperationsPanel from '../../../../routes/video-editor/operations-panel';
import { usePreviewTransport } from '../../../client/components/chapters-editor/preview/use-preview-transport';
import { canRedo, canUndo } from '../../../client/components/chapters-editor/state/history';
import useFilmstrip from '../../hooks/use-filmstrip';
import { useVideo } from '../../hooks/use-video';
import VideoLayout from '../video-layout';
import { videoTabPath } from '../video-nav';
import ConfirmDialog from './confirm-dialog';
import HeaderActions from './header-actions';
import PreviewPlayer from './preview/preview-player';
import { sessionEditsEqual } from './state/edit-session';
import StatusBanner from './status-banner';
import Timeline from './timeline/timeline';
import { useEditSession } from './use-edit-session';
import './style.scss';
import type { EditorTool } from '../../../../routes/video-editor/operations-panel';
import type { LibraryItem } from '../../types/library';
import type { MouseEvent } from 'react';

type Props = { video: LibraryItem; onSelectTool: ( tool: EditorTool ) => void };
type ConfirmAction = 'save' | 'discard' | 'restore' | 'reload';

/**
 * Trim and remove sections of a retained original video before publishing an edited rendition.
 *
 * @param props              - Component props.
 * @param props.video        - Video being edited.
 * @param props.onSelectTool - Switch editing tools.
 * @return The trim and cut editing screen.
 */
export default function TrimCutEditor( { video, onSelectTool }: Props ) {
	const editor = useEditSession( video );
	const transport = usePreviewTransport();
	const navigate = useNavigate();
	const [ sourceReady, setSourceReady ] = useState( false );
	const [ sourceDuration, setSourceDuration ] = useState( 0 );
	const [ confirm, setConfirm ] = useState< ConfirmAction | null >( null );
	const { hasUnsavedChanges } = editor;
	const dirtyRef = useRef( hasUnsavedChanges );
	dirtyRef.current = hasUnsavedChanges;
	const jobStatus = editor.edits?.job?.status;
	const waitingForVideo =
		( video.isProcessing || video.durationSeconds <= 0 ) &&
		jobStatus !== 'complete' &&
		jobStatus !== 'failed';
	// The route observes the same media cache; only uploads without an edit job need its timer.
	useVideo( video.id, { poll: jobStatus === 'idle' || editor.isError } );
	const filmstrip = useFilmstrip( video.guid, ! waitingForVideo && ! editor.isLoading );
	const durationMismatch = Boolean(
		editor.edits &&
		sourceDuration > 0 &&
		Math.abs( sourceDuration - editor.edits.original_duration_ms ) > 1000
	);
	const locked =
		waitingForVideo || editor.locked || editor.conflict || ! sourceReady || durationMismatch;
	const confirmNavigation = useCallback(
		() =>
			! dirtyRef.current ||
			// eslint-disable-next-line no-alert -- Navigation must be cancelled synchronously to preserve the session.
			window.confirm(
				__( 'You have unsaved edits. Leave the editor and discard them?', 'jetpack-videopress-pkg' )
			),
		[]
	);

	useEffect( () => {
		if ( ! hasUnsavedChanges ) {
			return;
		}
		const beforeUnload = ( event: BeforeUnloadEvent ) => {
			event.preventDefault();
			event.returnValue = '';
		};
		const popState = () => {
			if ( ! confirmNavigation() ) {
				navigate( { href: videoTabPath( video.id, 'editor' ) } );
			}
		};
		window.addEventListener( 'beforeunload', beforeUnload );
		window.addEventListener( 'popstate', popState );
		return () => {
			window.removeEventListener( 'beforeunload', beforeUnload );
			window.removeEventListener( 'popstate', popState );
		};
	}, [ hasUnsavedChanges, confirmNavigation, navigate, video.id ] );

	const guardLink = ( event: MouseEvent< HTMLDivElement > ) => {
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}
		const anchor = ( event.target as Element ).closest( 'a[href]' );
		if (
			anchor &&
			( ! anchor.getAttribute( 'target' ) || anchor.getAttribute( 'target' ) === '_self' ) &&
			! confirmNavigation()
		) {
			event.preventDefault();
		}
	};

	const copy: Record< ConfirmAction, { title: string; message: string; label: string } > = {
		save: {
			title: __( 'Update video?', 'jetpack-videopress-pkg' ),
			message: __(
				'Viewers will see the edited video. Your original is kept and can be restored. Existing chapters may need to be adjusted after the video finishes processing.',
				'jetpack-videopress-pkg'
			),
			label: __( 'Update video', 'jetpack-videopress-pkg' ),
		},
		discard: {
			title: __( 'Discard changes?', 'jetpack-videopress-pkg' ),
			message: __(
				'Your unsaved edits will be discarded and the editor will return to the last saved version.',
				'jetpack-videopress-pkg'
			),
			label: __( 'Discard changes', 'jetpack-videopress-pkg' ),
		},
		restore: {
			title: __( 'Restore original?', 'jetpack-videopress-pkg' ),
			message: __(
				'All saved and unsaved video edits will be removed. Viewers will see the original video again.',
				'jetpack-videopress-pkg'
			),
			label: __( 'Restore original', 'jetpack-videopress-pkg' ),
		},
		reload: {
			title: __( 'Reload latest edits?', 'jetpack-videopress-pkg' ),
			message: __(
				'Your unsaved edits will be replaced with the latest saved version.',
				'jetpack-videopress-pkg'
			),
			label: __( 'Reload latest', 'jetpack-videopress-pkg' ),
		},
	};
	const onConfirm = () => {
		if ( confirm === 'save' ) {
			// The session only guards its own lock; source readiness is checked here.
			if ( locked ) {
				return;
			}
			void editor.submit();
		} else if ( confirm === 'restore' ) {
			void editor.submit( true );
		} else if ( confirm === 'discard' ) {
			editor.discard();
		} else if ( confirm === 'reload' ) {
			void editor.reload();
		}
		setConfirm( null );
	};

	return (
		<div style={ { display: 'contents' } } onClickCapture={ guardLink }>
			<VideoLayout
				videoId={ video.id }
				activeTab="editor"
				breadcrumbLabel={ video.title }
				confirmNavigation={ confirmNavigation }
				actions={
					<HeaderActions
						canUndo={ ! locked && canUndo( editor.history, sessionEditsEqual ) }
						canRedo={ ! locked && canRedo( editor.history ) }
						onUndo={ () => editor.dispatch( { type: 'UNDO' } ) }
						onRedo={ () => editor.dispatch( { type: 'REDO' } ) }
						canDiscard={ editor.dirty && ! editor.locked }
						onDiscard={ () => setConfirm( 'discard' ) }
						canSave={ editor.dirty && ! locked }
						onSave={ () => setConfirm( 'save' ) }
						canRestoreOriginal={
							Boolean( editor.edits?.can_restore_original ) &&
							! waitingForVideo &&
							! editor.locked &&
							! editor.conflict
						}
						onRestoreOriginal={ () => setConfirm( 'restore' ) }
					/>
				}
			>
				<div className="vp-video-editor vp-chapters-tokens">
					{ durationMismatch && (
						<Notice.Root intent="error" className="vp-video-editor__notice">
							<Notice.Description>
								{ __(
									'The original video does not match the editing timeline. Reload the editor before making changes.',
									'jetpack-videopress-pkg'
								) }
							</Notice.Description>
						</Notice.Root>
					) }
					<StatusBanner
						job={ editor.edits?.job }
						conflict={ editor.conflict }
						onRetry={ editor.canRetry ? () => void editor.retryProcessing() : undefined }
						onReloadLatest={ () => setConfirm( 'reload' ) }
					/>
					<div className="vp-video-editor__body">
						<EditorOperationsPanel
							activeTool="trim"
							disabled={ waitingForVideo || editor.locked }
							onSelect={ tool => {
								if ( tool !== 'trim' && confirmNavigation() ) {
									onSelectTool( tool );
								}
							} }
						/>
						<div className="vp-video-editor__workspace">
							{ editor.isError && ! editor.edits ? (
								<div className="vp-video-editor__load-error" role="alert">
									<Text>
										{ __(
											'Video edits could not be loaded. Please try again.',
											'jetpack-videopress-pkg'
										) }
									</Text>
									<Button variant="outline" onClick={ () => void editor.reload() }>
										{ __( 'Try again', 'jetpack-videopress-pkg' ) }
									</Button>
								</div>
							) : (
								<div className="vp-video-editor__main">
									<div className="vp-video-editor__canvas">
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
									</div>
									<fieldset
										disabled={ waitingForVideo }
										className="vp-video-editor__timeline-section"
										aria-busy={ editor.locked || undefined }
									>
										<Timeline
											session={ editor.session }
											dispatch={ action => {
												if ( ! locked ) {
													editor.dispatch( action );
												}
											} }
											currentMs={ transport.currentMs }
											onSeek={ transport.onSeek }
											onTogglePlay={ transport.onTogglePlay }
											playing={ transport.playing }
											locked={ locked }
											onScrubStart={ transport.onScrubStart }
											onScrubEnd={ transport.onScrubEnd }
											shortcutsEnabled={ confirm === null && ! waitingForVideo }
											filmstrip={ filmstrip }
										/>
									</fieldset>
								</div>
							) }
						</div>
					</div>
				</div>
				{ confirm && (
					<ConfirmDialog
						isOpen
						title={ copy[ confirm ].title }
						message={ copy[ confirm ].message }
						confirmLabel={ copy[ confirm ].label }
						isBusy={ confirm === 'save' && locked }
						onConfirm={ onConfirm }
						onCancel={ () => setConfirm( null ) }
					/>
				) }
			</VideoLayout>
		</div>
	);
}
