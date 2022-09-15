/**
 * External dependencies
 */
import { RangeControl } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { Icon } from '@wordpress/icons';
import classNames from 'classnames';
/**
 * Internal dependencies
 */
import playIcon from '../icons/play-icon';
import styles from './style.module.scss';

const VideoFrameSelector = ( { src, onVideoFrameSelected, className = '' } ) => {
	const [ maxDuration, setMaxDuration ] = useState( 0 );
	const videoPlayer = useRef( null );

	useEffect( () => {
		videoPlayer.current.src = src;
	}, [ src ] );

	const onDurationChange = event => {
		const newDuration = event.target.duration;
		setMaxDuration( newDuration );

		if ( videoPlayer.current ) {
			videoPlayer.current.currentTime = newDuration / 2;
		}
	};

	const onRangeChange = newRangeValue => {
		onVideoFrameSelected?.( newRangeValue * 1000 );
		if ( videoPlayer.current ) {
			videoPlayer.current.currentTime = newRangeValue;
		}
	};

	return (
		<div className={ classNames( styles.container, className ) }>
			<video
				ref={ videoPlayer }
				muted
				className={ styles.video }
				onDurationChange={ onDurationChange }
			/>
			<Icon className={ styles[ 'play-icon' ] } icon={ playIcon } />
			<RangeControl
				className={ styles.range }
				min="0"
				step="0.1"
				max={ maxDuration }
				showTooltip={ false }
				withInputField={ false }
				onChange={ onRangeChange }
			/>
		</div>
	);
};

export default VideoFrameSelector;
