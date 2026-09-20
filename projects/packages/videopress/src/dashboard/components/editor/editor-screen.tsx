import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Button, Text } from '@wordpress/ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import EditorOperationsPanel from '../../../../routes/video-editor/operations-panel';
import { usePreviewTransport } from '../../../client/components/chapters-editor/preview/use-preview-transport';
import { canRedo, canUndo } from '../../../client/components/chapters-editor/state/history';
import useFilmstrip from '../../hooks/use-filmstrip';
import VideoLayout from '../video-layout';
import { videoTabPath } from '../video-nav';
import ConfirmDialog from './confirm-dialog';
import CopyStatusBanner from './copy-status-banner';
import { createCopyRequestId } from './create-copy-request-id';
import HeaderActions from './header-actions';
import PreviewPlayer from './preview/preview-player';
import SaveVideoDialog from './save-dialog';
import { sessionEditsEqual } from './state/edit-session';
import { sessionToOperations } from './state/serialize';
import StatusBanner from './status-banner';
import Timeline from './timeline/timeline';
import { useCopySession } from './use-copy-session';
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
	const copySession = useCopySession( video.guid );
	const { createSuccessNotice } = useGlobalNotices();
	const completedCopyRef = useRef< string | null >( null );
	const transport = usePreviewTransport();
	const filmstrip = useFilmstrip( video.guid );
	const navigate = useNavigate();
	const [ sourceReady, setSourceReady ] = useState( false );
	const [ sourceDuration, setSourceDuration ] = useState( 0 );
	const [ confirm, setConfirm ] = useState< ConfirmAction | null >( null );
	const dirtyRef = useRef( editor.dirty );
	dirtyRef.current = editor.dirty;
	const durationMismatch = Boolean(
		editor.edits &&
		sourceDuration > 0 &&
		Math.abs( sourceDuration - editor.edits.original_duration_ms ) > 1000
	);
	const locked =
		editor.locked ||
		copySession.locked ||
		editor.conflict ||
		copySession.conflict ||
		! sourceReady ||
		durationMismatch;
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
		if ( ! editor.dirty ) {
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
	}, [ editor.dirty, confirmNavigation, navigate, video.id ] );

	useEffect( () => {
		const result = copySession.status.data;
		if (
			result?.job.status !== 'complete' ||
			! result.attachment_id ||
			completedCopyRef.current === result.request_id
		) {
			return;
		}
		completedCopyRef.current = result.request_id;
		dirtyRef.current = false;
		editor.discard();
		createSuccessNotice(
			__( 'New video created. The original video is unchanged.', 'jetpack-videopress-pkg' )
		);
		navigate( { href: videoTabPath( String( result.attachment_id ), 'details' ) } );
	}, [ copySession.status.data, editor.discard, createSuccessNotice, navigate ] );

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

	const copy: Record<
		Exclude< ConfirmAction, 'save' >,
		{ title: string; message: string; label: string }
	> = {
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
		if ( confirm === 'restore' ) {
			void editor.submit( true );
		} else if ( confirm === 'discard' ) {
			editor.discard();
		} else if ( confirm === 'reload' ) {
			copySession.clear();
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
						canDiscard={ editor.dirty && ! editor.locked && ! copySession.locked }
						onDiscard={ () => setConfirm( 'discard' ) }
						canSave={ editor.dirty && ! locked }
						onSave={ () => {
							if ( copySession.failed || copySession.rejected ) {
								copySession.clear();
							}
							setConfirm( 'save' );
						} }
						canRestoreOriginal={
							Boolean( editor.edits?.can_restore_original ) &&
							! editor.locked &&
							! editor.conflict &&
							! copySession.conflict &&
							! copySession.locked
						}
						onRestoreOriginal={ () => setConfirm( 'restore' ) }
					/>
				}
			>
				<div className="vp-video-editor vp-chapters-tokens">
					{ durationMismatch && (
						<div role="alert" className="vp-video-editor__banner vp-video-editor__banner--failed">
							{ __(
								'The original video does not match the editing timeline. Reload the editor before making changes.',
								'jetpack-videopress-pkg'
							) }
						</div>
					) }
					<CopyStatusBanner session={ copySession } onReload={ () => setConfirm( 'reload' ) } />
					<StatusBanner
						job={ editor.edits?.job }
						onCheckStatus={ () => void editor.refetch() }
						conflict={ editor.conflict }
						onRetry={
							! editor.locked &&
							! copySession.locked &&
							( editor.lastAction === 'restore' || ( editor.dirty && ! locked ) )
								? () => setConfirm( editor.lastAction )
								: undefined
						}
						onReloadLatest={ () => setConfirm( 'reload' ) }
					/>
					<div className="vp-video-editor__body">
						<EditorOperationsPanel
							activeTool="trim"
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
											session={ editor.session }
											onTimeUpdate={ transport.onTimeUpdate }
											onPlayingChange={ transport.onPlayingChange }
											onSourceReadyChange={ setSourceReady }
											onDurationChange={ setSourceDuration }
										/>
									</div>
									<div
										className="vp-video-editor__timeline-section"
										aria-busy={ editor.locked || copySession.locked || undefined }
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
											shortcutsEnabled={ confirm === null }
											filmstrip={ filmstrip }
										/>
									</div>
								</div>
							) }
						</div>
					</div>
				</div>
				{ confirm === 'save' && (
					<SaveVideoDialog
						title={ video.title }
						isBusy={ locked }
						onCancel={ () => setConfirm( null ) }
						onSave={ ( mode, title ) => {
							if ( locked || ! editor.baseline ) {
								return;
							}
							setConfirm( null );
							if ( mode === 'update' ) {
								void editor.submit();
							} else {
								void copySession.submit( {
									guid: video.guid,
									baseRevision: editor.baseline.revision,
									operations: sessionToOperations( editor.session, editor.session.durationMs ),
									requestId: createCopyRequestId(),
									title,
								} );
							}
						} }
					/>
				) }
				{ confirm && confirm !== 'save' && (
					<ConfirmDialog
						isOpen
						title={ copy[ confirm ].title }
						message={ copy[ confirm ].message }
						confirmLabel={ copy[ confirm ].label }
						onConfirm={ onConfirm }
						onCancel={ () => setConfirm( null ) }
					/>
				) }
			</VideoLayout>
		</div>
	);
}
