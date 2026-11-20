import { useEffect, useRef } from 'react';
import type RecordingStage from '../recording-stage';
import type { ComponentProps } from 'react';

/**
 * Supply a media-ready boundary for workspace tests without jsdom media playback.
 *
 * @param props - Recording stage props.
 * @return Media element and workspace controls.
 */
export default function MockRecordingStage( props: ComponentProps< typeof RecordingStage > ) {
	const ref = useRef< HTMLVideoElement >( null );
	const callbacks = useRef( props );
	callbacks.current = props;
	useEffect( () => {
		callbacks.current.onVideoReady( ref.current );
		callbacks.current.onSourceReady?.( Boolean( props.stream ) );
		return () => callbacks.current.onVideoReady( null );
	}, [ props.stream ] );
	return (
		<div>
			<video
				ref={ ref }
				aria-label={ props.label }
				muted
				playsInline
				style={ { transform: props.mirrored ? 'scaleX(-1)' : '', filter: props.filter } }
			/>
			{ props.children }
		</div>
	);
}
