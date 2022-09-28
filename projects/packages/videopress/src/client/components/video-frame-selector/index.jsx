/**
 * External dependencies
 */
import { RangeControl } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { Icon } from '@wordpress/icons';
import classNames from 'classnames';
import React from 'react';
/**
 * Internal dependencies
 */
import playIcon from '../icons/play-icon';
import styles from './style.module.scss';

export const VideoPlayer = ( { src, setMaxDuration = null, currentTime } ) => {
	const videoPlayer = useRef( null );

	useEffect( () => {
		videoPlayer.current.src = src;
	}, [ src ] );

	useEffect( () => {
		if ( videoPlayer.current && Number.isFinite( currentTime ) ) {
			videoPlayer.current.currentTime = currentTime;
		}
	}, [ currentTime ] );

	const onDurationChange = event => {
		const newDuration = event.target.duration;
		setMaxDuration?.( newDuration );

		if ( videoPlayer.current ) {
			const newTime = Number.isFinite( currentTime ) ? currentTime : newDuration / 2;
			videoPlayer.current.currentTime = newTime;
		}
	};

	return (
		<video
			ref={ videoPlayer }
			muted
			className={ styles.video }
			onDurationChange={ onDurationChange }
		/>
	);
};

const VideoFrameSelector = ( {
	src = '',
	onVideoFrameSelected,
	className = '',
	initialCurrentTime = null,
} ) => {
	const [ maxDuration, setMaxDuration ] = useState( 0 );
	const [ currentTime, setCurrentTime ] = useState(
		Number.isFinite( initialCurrentTime ) ? initialCurrentTime : null
	);

	const onRangeChange = newRangeValue => {
		setCurrentTime( newRangeValue );
		onVideoFrameSelected?.( newRangeValue * 1000 );
	};

	return (
		<div className={ classNames( styles.container, className ) }>
			<Icon className={ styles[ 'play-icon' ] } icon={ playIcon } />
			<VideoPlayer src={ src } setMaxDuration={ setMaxDuration } currentTime={ currentTime } />
			<RangeControl
				className={ styles.range }
				min={ 0 }
				step={ 0.1 }
				initialPosition={ currentTime }
				max={ maxDuration }
				showTooltip={ false }
				withInputField={ false }
				onChange={ onRangeChange }
			/>
		</div>
	);
};

export default VideoFrameSelector;
