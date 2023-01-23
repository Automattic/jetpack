/* eslint-disable jsx-a11y/media-has-caption */
import { Text } from '@automattic/jetpack-components';
import classNames from 'classnames';
import { useCallback, useRef, useState } from 'react';
import styles from './styles.module.scss';

const VideoPreview = ( { sourceUrl, mime, duration } ) => {
	const [ isPlaying, setIsPlaying ] = useState( false );
	const [ progress, setProgress ] = useState( 0 );

	const videoRef = useRef( null );

	const intervalRef = useRef( null );
	const delayRef = useRef( null );

	const resetVideo = useCallback( () => {
		videoRef.current.currentTime = 0;
		clearInterval( intervalRef.current );
		clearTimeout( delayRef.current );
		setProgress( 0 );
		setIsPlaying( false );
	}, [] );

	const onMouseEnter = useCallback( () => {
		delayRef.current = setTimeout( () => {
			if ( ! isPlaying ) {
				videoRef.current.play();
				setIsPlaying( true );

				intervalRef.current = setInterval( () => {
					setProgress( oldProgress => oldProgress + 1 );
				}, 1000 );
			}
		}, 500 );
	}, [ isPlaying ] );

	const onMouseLeave = useCallback( () => {
		resetVideo();

		if ( isPlaying ) {
			videoRef.current.pause();
		}
	}, [ isPlaying, resetVideo ] );

	const renderProgress = () => {
		const remaining = duration - progress;

		const minutes = Math.floor( remaining / 60 );
		const seconds = Math.floor( remaining % 60 );

		const padNumber = num => ( '0' + num ).slice( -2 );

		const longerThanTenMinutes = duration >= 600;

		return (
			<div
				className={ classNames(
					{
						[ styles[ 'four-digits' ] ]: longerThanTenMinutes,
					},
					styles.progress
				) }
			>
				<div className={ styles.playButton }></div>
				<Text className={ styles.duration }>{ `${
					longerThanTenMinutes ? padNumber( minutes ) : minutes
				}:${ padNumber( seconds ) }` }</Text>
			</div>
		);
	};

	return (
		<div onMouseEnter={ onMouseEnter } onMouseLeave={ onMouseLeave }>
			<video ref={ videoRef } onEnded={ resetVideo }>
				<source src={ sourceUrl } type={ mime }></source>
			</video>
			{ renderProgress() }
		</div>
	);
};

export default VideoPreview;
