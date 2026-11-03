import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import videojs from 'video.js';
import type { ReactNode } from 'react';
import type Player from 'video.js/dist/types/player';

type Props = {
	label: string;
	children: ReactNode;
	src?: string;
	stream?: MediaStream | null;
	mirrored?: boolean;
	filter?: string;
	onVideoReady: ( video: HTMLVideoElement | null ) => void;
	onSourceReady?: ( ready: boolean ) => void;
	onSourceError?: () => void;
};

/**
 * Host a local camera or recording and React controls in a Video.js overlay component.
 *
 * @param props               - Video source, preview presentation, and overlay content.
 * @param props.label         - Accessible media label.
 * @param props.children      - Overlay controls.
 * @param props.src           - Local recorded-file URL.
 * @param props.stream        - Live camera stream.
 * @param props.mirrored      - Whether the monitor is mirrored.
 * @param props.filter        - Preview color effect.
 * @param props.onVideoReady  - Receive the HTML media element for capture or playback.
 * @param props.onSourceReady - Receive camera-frame availability.
 * @param props.onSourceError - Report a source that cannot be played.
 * @return Video.js recording stage.
 */
export default function RecordingStage( {
	label,
	children,
	src,
	stream,
	mirrored = false,
	filter = 'none',
	onVideoReady,
	onSourceReady,
	onSourceError,
}: Props ) {
	const host = useRef< HTMLDivElement >( null );
	const playerRef = useRef< Player | null >( null );
	const callbacks = useRef( { onVideoReady, onSourceReady, onSourceError } );
	callbacks.current = { onVideoReady, onSourceReady, onSourceError };
	const [ video, setVideo ] = useState< HTMLVideoElement | null >( null );
	const [ overlay, setOverlay ] = useState< HTMLElement | null >( null );

	useEffect( () => {
		const container = host.current!;
		const element = container.ownerDocument.createElement( 'video-js' );
		container.appendChild( element );
		const player = videojs( element, {
			controls: false,
			bigPlayButton: false,
			loadingSpinner: false,
			errorDisplay: false,
			textTrackDisplay: false,
			inactivityTimeout: 0,
			fill: true,
			preload: 'auto',
		} );
		playerRef.current = player;
		const Component = videojs.getComponent( 'Component' );
		const controls = new Component( player, { className: 'videopress-recording__overlay' } );
		player.addChild( controls );
		setOverlay( controls.el() as HTMLElement );
		player.ready( () => {
			if ( player.isDisposed() ) {
				return;
			}
			const media = player.tech( { IWillNotUseThisInPlugins: true } ).el() as HTMLVideoElement;
			media.playsInline = true;
			setVideo( media );
			callbacks.current.onVideoReady( media );
		} );
		return () => {
			callbacks.current.onVideoReady( null );
			callbacks.current.onSourceReady?.( false );
			player.dispose();
			playerRef.current = null;
		};
	}, [] );

	useEffect( () => {
		if ( ! video ) {
			return;
		}
		video.setAttribute( 'aria-label', label );
		video.style.transform = mirrored ? 'scaleX(-1)' : '';
		video.style.filter = filter;
	}, [ video, label, mirrored, filter ] );

	useEffect( () => {
		if ( ! video ) {
			return;
		}
		let disposed = false;
		const ready = () => {
			if ( ! disposed ) {
				callbacks.current.onSourceReady?.( true );
			}
		};
		const failed = () => {
			if ( ! disposed ) {
				callbacks.current.onSourceReady?.( false );
				callbacks.current.onSourceError?.();
			}
		};
		callbacks.current.onSourceReady?.( false );
		video.addEventListener( 'loadeddata', ready );
		video.addEventListener( 'error', failed );
		if ( stream ) {
			video.muted = true;
			video.srcObject = stream;
			void video.play().catch( failed );
		} else if ( src ) {
			video.muted = false;
			playerRef.current?.src( { src, type: 'video/mp4' } );
		}
		return () => {
			disposed = true;
			video.removeEventListener( 'loadeddata', ready );
			video.removeEventListener( 'error', failed );
			video.pause();
			video.srcObject = null;
		};
	}, [ video, src, stream ] );

	return (
		<div ref={ host } className="videopress-recording__stage" data-vjs-player>
			{ overlay && createPortal( children, overlay ) }
		</div>
	);
}
