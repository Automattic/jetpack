/**
 * The relocated transport shared by every timeline toolbar: the play/pause
 * icon button plus the mono `current / duration` readout with its editable
 * timecode box. Purely presentational — playback state and seeking are
 * owned by the host screen's preview player.
 */
import { __, _x } from '@wordpress/i18n';
import { formatTimecode } from '../state/time-utils';
import TimecodeBox from './timecode-box';
import type { ReactElement } from 'react';

const playIcon = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M8 5v14l11-7z" fill="currentColor" />
	</svg>
);

const pauseIcon = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor" />
	</svg>
);

type Props = {
	/** Whether preview playback is running (picks the pause icon). */
	playing: boolean;
	/** Toggle preview playback. */
	onTogglePlay: () => void;
	/** Live playhead position in master-timeline ms. */
	currentMs: number;
	/** Master duration in ms, shown next to the editable timecode. */
	durationMs: number;
	/** Called with the parsed timecode position in ms. */
	onSeek: ( ms: number ) => void;
};

/**
 * The timeline toolbar's transport cluster.
 *
 * @param props              - Component props.
 * @param props.playing      - Whether preview playback is running.
 * @param props.onTogglePlay - Toggle preview playback.
 * @param props.currentMs    - Live playhead position in ms.
 * @param props.durationMs   - Master duration in ms.
 * @param props.onSeek       - Called with the parsed timecode position in ms.
 * @return The transport element.
 */
export default function TimelineTransport( {
	playing,
	onTogglePlay,
	currentMs,
	durationMs,
	onSeek,
}: Props ): ReactElement {
	return (
		<>
			<button
				type="button"
				className="vp-chapters-timeline__transport"
				data-testid="chapters-timeline-transport-play"
				aria-label={
					// The context also keeps the branches distinct so minification
					// can't merge the two calls, which would break string extraction.
					playing
						? _x( 'Pause', 'button: pause timeline preview playback', 'jetpack-videopress-pkg' )
						: __( 'Play', 'jetpack-videopress-pkg' )
				}
				onClick={ onTogglePlay }
			>
				{ playing ? pauseIcon : playIcon }
			</button>
			<div className="vp-chapters-timeline__time">
				<TimecodeBox valueMs={ currentMs } onSeek={ onSeek } />
				<span className="vp-chapters-timeline__duration">
					{ `/ ${ formatTimecode( durationMs ) }` }
				</span>
			</div>
		</>
	);
}
