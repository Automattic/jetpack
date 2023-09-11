/* eslint-disable jsx-a11y/media-has-caption */
import { useCallback, useRef, useState, useEffect } from '@wordpress/element';
import styles from './styles.module.scss';

const VideoPreview = ( { sourceUrl, mime, duration } ) => {
	const [ isPlaying, setIsPlaying ] = useState( false );
	const [ progress, setProgress ] = useState( 0 );

	const videoRef = useRef( null );
	const intervalRef = useRef( null );
	const delayRef = useRef( null );

	/**
	 * Load the new video when the source URL changes.
	 */
	useEffect( () => {
		videoRef.current?.load();
	}, [ sourceUrl ] );

	/**
	 * Resets the video to the start position, clears timers
	 */
	const resetVideo = useCallback( () => {
		videoRef.current.pause();
		videoRef.current.currentTime = 0;
		clearInterval( intervalRef.current );
		clearTimeout( delayRef.current );
		setProgress( 0 );
		setIsPlaying( false );
	}, [] );

	const onMouseEnter = useCallback( () => {
		// 500 ms delay to make UX better on hover
		delayRef.current = setTimeout( () => {
			if ( ! isPlaying ) {
				videoRef.current.play();
				setIsPlaying( true );
				// Count progress each second
				intervalRef.current = setInterval( () => {
					setProgress( oldProgress => oldProgress + 1 );
				}, 1000 );
			}
		}, 500 );
	}, [ isPlaying ] );

	const ProgressCounter = () => {
		const remaining = duration - progress;

		const minutes = Math.floor( remaining / 60 );
		const seconds = String( Math.floor( remaining % 60 ) ).padStart( 2, '0' );

		return (
			<div className={ styles.progress }>
				<svg xmlns="http://www.w3.org/2000/svg" width="6" height="8" fill="none">
					<path
						fill="#fff"
						d="M5.25 3.567a.5.5 0 0 1 0 .866L.75 7.031A.5.5 0 0 1 0 6.598V1.402A.5.5 0 0 1 .75.969l4.5 2.598Z"
					/>
				</svg>
				<span className={ styles.duration }>{ `${ minutes }:${ seconds }` }</span>
			</div>
		);
	};

	return (
		<div className={ styles.wrapper } onMouseEnter={ onMouseEnter } onMouseLeave={ resetVideo }>
			<video ref={ videoRef } onEnded={ resetVideo } muted>
				<source src={ sourceUrl } type={ mime }></source>
			</video>
			<ProgressCounter />
		</div>
	);
};

export default VideoPreview;
