import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useEffect, useReducer, useRef, useState } from 'react';
import { usePreviewPlayback } from '../../../dashboard/components/editor/preview/use-preview-playback';
import {
	createEditSession,
	editSessionReducer,
	sessionEditsEqual,
} from '../../../dashboard/components/editor/state/edit-session';
import Timeline from '../../../dashboard/components/editor/timeline/timeline';
import { exportRecording } from '../../lib/video-recording/export';
import { createHistory, withHistory } from '../chapters-editor/state/history';

const reducer = withHistory( editSessionReducer, {
	equals: sessionEditsEqual,
	clearOn: action => action.type === 'LOAD' || action.type === 'RESET',
} );

type Props = {
	file: File;
	onUpload: ( file: File ) => void;
	onRecordAgain: () => void;
	blocked: boolean;
};

/**
 * Preview and edit a local recording with the existing trim and cut timeline.
 *
 * @param props               - Recording and workspace actions.
 * @param props.file          - Original recording.
 * @param props.onUpload      - Standard-upload handoff.
 * @param props.onRecordAgain - Discard and record again.
 * @param props.blocked       - Whether confirmation blocks the workspace.
 * @return Local recording editor.
 */
export default function RecordingEditor( { file, onUpload, onRecordAgain, blocked }: Props ) {
	const [ history, dispatch ] = useReducer( reducer, 0, ms =>
		createHistory( createEditSession( ms ) )
	);
	const session = history.present;
	const playback = usePreviewPlayback( session );
	const [ url, setUrl ] = useState( '' );
	const [ exporting, setExporting ] = useState( false );
	const [ progress, setProgress ] = useState( 0 );
	const [ error, setError ] = useState< string | null >( null );
	const exportController = useRef< AbortController | null >( null );
	const blockedRef = useRef( blocked );
	blockedRef.current = blocked;
	const locked = blocked || exporting;

	useEffect( () => {
		const source = URL.createObjectURL( file );
		setUrl( source );
		return () => URL.revokeObjectURL( source );
	}, [ file ] );
	useEffect( () => () => exportController.current?.abort(), [] );
	useEffect( () => {
		if ( ! session.durationMs && playback.hasMetadata && playback.durationMs > 0 ) {
			dispatch( { type: 'LOAD', durationMs: playback.durationMs, operations: [] } );
		}
	}, [ session.durationMs, playback.hasMetadata, playback.durationMs ] );

	const upload = async () => {
		const controller = new AbortController();
		exportController.current = controller;
		playback.pause();
		setError( null );
		setExporting( true );
		try {
			const edited = await exportRecording( file, session, controller.signal, setProgress );
			if ( ! controller.signal.aborted && ! blockedRef.current ) {
				onUpload( edited );
			}
		} catch {
			if ( ! controller.signal.aborted ) {
				setError(
					__(
						'The recording could not be prepared. Keep this tab visible and try again.',
						'jetpack-videopress-pkg'
					)
				);
			}
		} finally {
			if ( ! controller.signal.aborted ) {
				setExporting( false );
			}
		}
	};

	return (
		<>
			<video
				className="videopress-recording__video"
				ref={ playback.attachVideo }
				src={ url || undefined }
				playsInline
				aria-label={ __( 'Recording preview', 'jetpack-videopress-pkg' ) }
			/>
			{ ( error || playback.playbackError ) && (
				<Notice.Root intent="error">
					<Notice.Description>{ error || playback.playbackError }</Notice.Description>
				</Notice.Root>
			) }
			<Timeline
				session={ session }
				dispatch={ dispatch }
				currentMs={ playback.currentMs }
				onSeek={ playback.seekTo }
				onTogglePlay={ playback.togglePlay }
				playing={ playback.playing }
				locked={ locked || ! session.durationMs }
				onScrubStart={ playback.pause }
				shortcutsEnabled={ ! locked }
			/>
			{ exporting && (
				<p role="status">
					{ sprintf(
						/* translators: %d: video preparation progress percentage. */
						__( 'Preparing video… %d%%. Keep this tab visible.', 'jetpack-videopress-pkg' ),
						Math.round( progress * 100 )
					) }
				</p>
			) }
			<div className="videopress-recording__actions">
				<Button variant="secondary" onClick={ onRecordAgain } disabled={ locked }>
					{ __( 'Record again', 'jetpack-videopress-pkg' ) }
				</Button>
				<Button
					variant="primary"
					onClick={ () => void upload() }
					disabled={ locked || ! session.durationMs || Boolean( playback.playbackError ) }
					isBusy={ exporting }
				>
					{ __( 'Upload recording', 'jetpack-videopress-pkg' ) }
				</Button>
			</div>
		</>
	);
}
