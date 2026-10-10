import { useQuery } from '@tanstack/react-query';
import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { forwardRef, useEffect, useId, useImperativeHandle } from 'react';
import { fetchVideoItem } from '../../../../client/lib/fetch-video-item';
import { usePlaybackTokenQuery } from '../../../hooks/use-poster-url';
import { usePreviewPlayback } from './use-preview-playback';
import './style.scss';
import type { ChaptersPreviewPlayerHandle } from '../../../../client/components/chapters-editor/preview/preview-player';
import type { LibraryItem } from '../../../types/library';
import type { EditSession } from '../state/edit-session';

export type StudioEditorPreviewPlayerHandle = ChaptersPreviewPlayerHandle;

type Props = {
	video: LibraryItem;
	session: EditSession;
	processing?: boolean;
	/** The untouched source: rendition URLs may already include saved edits. */
	masterUrl?: string;
	onTimeUpdate?: ( currentMs: number ) => void;
	onDurationChange?: ( durationMs: number ) => void;
	onPlayingChange?: ( playing: boolean ) => void;
	onSourceReadyChange?: ( ready: boolean ) => void;
};

const StudioEditorPreviewPlayer = forwardRef< StudioEditorPreviewPlayerHandle, Props >(
	function StudioEditorPreviewPlayerInner(
		{
			video,
			session,
			masterUrl,
			processing = false,
			onTimeUpdate,
			onDurationChange,
			onPlayingChange,
			onSourceReadyChange,
		},
		ref
	) {
		const { isPrivate, guid } = video;
		const videoElementId = useId();
		const original = useQuery( {
			queryKey: [ 'videopress-original-source', guid, isPrivate ],
			queryFn: async () => ( await fetchVideoItem( { guid, isPrivate } ) )?.original || null,
			enabled: ! processing && Boolean( guid ) && ! masterUrl && ! video.originalUrl,
		} );
		const sourceUrl = processing ? null : masterUrl || video.originalUrl || original.data;
		const token = usePlaybackTokenQuery( guid, isPrivate && Boolean( sourceUrl ) );
		const {
			currentMs,
			playing,
			durationMs,
			hasMetadata,
			attachVideo,
			play,
			pause,
			togglePlay,
			seekTo,
			playbackError,
		} = usePreviewPlayback( session, videoElementId );

		useImperativeHandle(
			ref,
			() => ( { seekTo, play, pause, togglePlay, isPlaying: () => playing } ),
			[ seekTo, play, pause, togglePlay, playing ]
		);

		useEffect( () => onTimeUpdate?.( currentMs ), [ currentMs, onTimeUpdate ] );
		useEffect( () => onPlayingChange?.( playing ), [ playing, onPlayingChange ] );
		useEffect( () => {
			if ( hasMetadata && durationMs > 0 ) {
				onDurationChange?.( durationMs );
			}
		}, [ durationMs, hasMetadata, onDurationChange ] );

		let src = sourceUrl || undefined;
		if ( isPrivate ) {
			src =
				sourceUrl && token.data
					? addQueryArgs( sourceUrl, { metadata_token: token.data } )
					: undefined;
		}
		useEffect( () => {
			onSourceReadyChange?.( Boolean( src && hasMetadata && ! playbackError ) );
		}, [ src, hasMetadata, playbackError, onSourceReadyChange ] );

		const tokenFailed = isPrivate && ( token.isError || ( token.isSuccess && ! token.data ) );

		let placeholder = <Spinner />;
		if ( processing ) {
			placeholder = (
				<div role="status">
					<Spinner />
					<p>
						{ __(
							'This video is processing. You can leave this page and come back later.',
							'jetpack-videopress-pkg'
						) }
					</p>
				</div>
			);
		} else if ( ! sourceUrl && ! original.isFetching ) {
			placeholder = <p>{ __( 'The original video is unavailable.', 'jetpack-videopress-pkg' ) }</p>;
		} else if ( tokenFailed ) {
			placeholder = (
				<>
					<p role="alert">
						{ __( 'The private video could not be loaded.', 'jetpack-videopress-pkg' ) }
					</p>
					<Button variant="secondary" onClick={ () => token.refetch() }>
						{ __( 'Retry', 'jetpack-videopress-pkg' ) }
					</Button>
				</>
			);
		}

		return (
			<div className="vp-studio-editor-preview">
				<div className="vp-studio-editor-preview__stage">
					{ src ? (
						<video
							key={ src }
							id={ videoElementId }
							ref={ attachVideo }
							className="vp-studio-editor-preview__video"
							data-testid="studio-editor-preview-video"
							src={ src }
							preload="auto"
							playsInline
						/>
					) : (
						<div className="vp-studio-editor-preview__placeholder">{ placeholder }</div>
					) }
					{ ! processing && playbackError && (
						<p className="vp-studio-editor-preview__error" role="alert">
							{ playbackError }
						</p>
					) }
				</div>
			</div>
		);
	}
);

export default StudioEditorPreviewPlayer;
