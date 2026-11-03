/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	formatRuntime,
	formatTimecode,
	playlistEmbedUrl,
	playlistRuntimeMs,
	playlistVideoUrl,
	resolutionLabel,
} from './utils';
/**
 * Types
 */
import type { PlaylistDisplayAttributes, PlaylistEntry, PlaylistLiveMetadata } from './types';

type PlaylistPreviewProps = {
	videos: PlaylistEntry[];
	attributes: PlaylistDisplayAttributes;
	currentIndex: number;
	liveMetadata: Record< string, PlaylistLiveMetadata >;
	onSelect: ( index: number ) => void;
};

/**
 * The front-end-mirroring preview rendered in the editor canvas, shared by
 * every block that renders a playlist. Without the player, entries are the
 * links or buttons the front end renders, inert so the editor stays put.
 *
 * @param props              - Component props.
 * @param props.videos       - The entries to preview.
 * @param props.attributes   - Display and playback options.
 * @param props.currentIndex - Index of the entry shown in the player.
 * @param props.liveMetadata - Live title/poster per GUID, from the video data.
 * @param props.onSelect     - Called with an entry index when it is clicked.
 * @return Preview element.
 */
export default function PlaylistPreview( {
	videos,
	attributes,
	currentIndex,
	liveMetadata,
	onSelect,
}: PlaylistPreviewProps ) {
	const { muteByDefault, showPlayer, entryClickAction, showPositionNumber, showTotalRuntime } =
		attributes;
	const opensInNewTab = ! showPlayer && entryClickAction !== 'show-player';
	const current = videos[ currentIndex ];

	/*
	 * Mirrors the front-end view script: while more entries hide beyond the
	 * scroll position — below it in the capped side rail, past the trailing
	 * edge in the horizontal strip — the list shows the matching fade.
	 */
	const entriesRef = useRef< HTMLOListElement | null >( null );
	const [ hasMoreBelow, setHasMoreBelow ] = useState( false );
	const updateScrollHint = () => {
		const container = entriesRef.current;
		if ( ! container ) {
			return;
		}
		const moreBelow = container.scrollHeight - container.scrollTop - container.clientHeight > 1;
		// scrollLeft is negative in right-to-left scrollers.
		const moreInline =
			container.scrollWidth - Math.abs( container.scrollLeft ) - container.clientWidth > 1;
		setHasMoreBelow( moreBelow || moreInline );
	};
	useEffect( updateScrollHint, [ videos, attributes.layout, liveMetadata ] );
	const runtime = formatRuntime( playlistRuntimeMs( videos ) );
	const countLabel = sprintf(
		/* translators: %d: number of videos in the playlist. */
		_n( '%d video', '%d videos', videos.length, 'jetpack-videopress-pkg' ),
		videos.length
	);
	const nowRuntime = showTotalRuntime && runtime && (
		<div className="videopress-playlist__now">
			<span className="videopress-playlist__now-runtime">{ `${ countLabel } · ${ runtime }` }</span>
		</div>
	);
	return (
		<>
			<div className="videopress-playlist__body">
				{ showPlayer ? (
					<div className="videopress-playlist__stage">
						<div className="videopress-playlist__player">
							<iframe
								className="videopress-playlist__iframe"
								title={
									liveMetadata[ current.guid ]?.title ||
									__( 'Video Playlist player', 'jetpack-videopress-pkg' )
								}
								src={ playlistEmbedUrl( current.guid, false, muteByDefault ) }
								allowFullScreen
								allow="clipboard-write"
							/>
						</div>
						{ nowRuntime }
					</div>
				) : (
					nowRuntime
				) }

				<div
					className={
						hasMoreBelow ? 'videopress-playlist__list has-more-videos' : 'videopress-playlist__list'
					}
				>
					<div className="videopress-playlist__list-header">
						<span className="videopress-playlist__list-label videopress-playlist__list-label--rail">
							{ showPlayer && __( 'Up next', 'jetpack-videopress-pkg' ) }
							{ ! showPlayer && __( 'Playlist', 'jetpack-videopress-pkg' ) }
						</span>
						<span className="videopress-playlist__list-label videopress-playlist__list-label--strip">
							{ sprintf(
								/* translators: %d: number of videos in the playlist. */
								__( 'Playlist — %d videos', 'jetpack-videopress-pkg' ),
								videos.length
							) }
						</span>
						<span className="videopress-playlist__list-meta">
							<span className="videopress-playlist__count">{ countLabel }</span>
							{ showTotalRuntime && runtime && (
								<span className="videopress-playlist__runtime">{ runtime }</span>
							) }
						</span>
						{ showPlayer && (
							<span className="videopress-playlist__list-progress">
								{ sprintf(
									/* translators: 1: position of the current video. 2: number of videos. 3: total playlist timecode. */
									__( '%1$d / %2$d · %3$s total', 'jetpack-videopress-pkg' ),
									currentIndex + 1,
									videos.length,
									formatTimecode( playlistRuntimeMs( videos ) )
								) }
							</span>
						) }
					</div>
					<ol
						className="videopress-playlist__entries"
						ref={ entriesRef }
						onScroll={ updateScrollHint }
					>
						{ videos.map( ( entry, index ) => {
							const isCurrent = showPlayer && index === currentIndex;
							const entryClasses = [
								'videopress-playlist__select',
								isCurrent ? 'is-current' : '',
								liveMetadata[ entry.guid ]?.isPrivateLocked ? 'is-locked' : '',
							]
								.filter( Boolean )
								.join( ' ' );
							const entryContent = (
								<>
									{ showPositionNumber && (
										<span className="videopress-playlist__entry-number">
											{ String( index + 1 ).padStart( 2, '0' ) }
										</span>
									) }
									<span className="videopress-playlist__entry-thumb">
										{ liveMetadata[ entry.guid ]?.poster && (
											<img src={ liveMetadata[ entry.guid ].poster } alt="" loading="lazy" />
										) }
										<span className="videopress-playlist__entry-flag">
											{ __( 'Playing', 'jetpack-videopress-pkg' ) }
										</span>
										{ /* Mirrors the server render: shown via the button's is-locked class. */ }
										<span className="videopress-playlist__entry-lock">
											<svg
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
												aria-hidden="true"
												focusable="false"
											>
												<path d="M17 10h-1.2V7.3c0-2.1-1.7-3.8-3.8-3.8-2.1 0-3.8 1.7-3.8 3.8V10H7c-.6 0-1 .4-1 1v8c0 .6.4 1 1 1h10c.6 0 1-.4 1-1v-8c0-.6-.4-1-1-1Zm-2.7 0H9.7V7.3c0-1.3 1-2.3 2.3-2.3 1.3 0 2.3 1 2.3 2.3V10Z" />
											</svg>
											<span className="videopress-playlist__entry-lock-label">
												{ __( 'Private video', 'jetpack-videopress-pkg' ) }
											</span>
										</span>
										{ formatTimecode( entry.durationMs ) && (
											<span className="videopress-playlist__entry-time">
												{ formatTimecode( entry.durationMs ) }
											</span>
										) }
									</span>
									<span className="videopress-playlist__entry-body">
										<span className="videopress-playlist__entry-title">
											{ liveMetadata[ entry.guid ]?.title || entry.guid }
										</span>
										<span className="videopress-playlist__entry-meta">
											{ resolutionLabel( entry.height ) && (
												<span className="videopress-playlist__entry-resolution">
													{ resolutionLabel( entry.height ) }
												</span>
											) }
											{ formatTimecode( entry.durationMs ) && (
												<span className="videopress-playlist__entry-duration">
													{ formatTimecode( entry.durationMs ) }
												</span>
											) }
										</span>
									</span>
								</>
							);

							return (
								<li className="videopress-playlist__entry" key={ `${ entry.guid }-${ index }` }>
									{ ! opensInNewTab ? (
										<button
											type="button"
											className={ entryClasses }
											aria-current={ isCurrent ? 'true' : undefined }
											onClick={ showPlayer ? () => onSelect( index ) : undefined }
										>
											{ entryContent }
										</button>
									) : (
										<a
											className={ entryClasses }
											href={ playlistVideoUrl( entry.guid ) }
											target="_blank"
											rel="noopener noreferrer"
											onClick={ ( event: React.MouseEvent ) => event.preventDefault() }
										>
											{ entryContent }
										</a>
									) }
								</li>
							);
						} ) }
					</ol>
				</div>
			</div>
		</>
	);
}
