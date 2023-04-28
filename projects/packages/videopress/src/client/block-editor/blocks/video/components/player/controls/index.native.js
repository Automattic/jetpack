/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
/**
 * External dependencies
 */
import { View, Pressable } from 'react-native';
/**
 * Internal dependencies
 */

import { PauseIcon, PlayIcon, ReplayIcon } from '../../icons';
import style from './style.scss';

const PlayerControls = ( { isSelected, playEnded, onToggle } ) => {
	const [ showControlIcon, setShowControlIcon ] = useState( true );
	const [ isPlaying, setIsPlaying ] = useState( false );
	const [ isFinishedPlaying, setIsFinishedPlaying ] = useState( playEnded );

	// Update the state when the video ends.
	useEffect( () => {
		if ( playEnded ) {
			setShowControlIcon( true );
		}
		setIsFinishedPlaying( playEnded );
	}, [ playEnded ] );

	// Clear out the state when deselected.
	useEffect( () => {
		if ( ! isSelected ) {
			setIsPlaying( false );
			setIsFinishedPlaying( false );
		}
	}, [ isSelected ] );

	// Hide the play/pause button after a short delay.
	const hidePauseTimer = useRef();
	useEffect( () => {
		if ( isPlaying ) {
			hidePauseTimer.current = setTimeout( () => {
				! isFinishedPlaying && setShowControlIcon( false );
			}, 800 );
		}
		return () => {
			clearTimeout( hidePauseTimer.current );
		};
	}, [ isPlaying ] );

	const togglePlayState = useCallback( () => {
		setIsFinishedPlaying( false );
		setShowControlIcon( true );

		onToggle( isPlaying ? 'pause' : 'play' );
		setIsPlaying( ! isPlaying );
	}, [ isPlaying ] );

	let icon = PlayIcon;

	if ( isPlaying ) {
		icon = PauseIcon;
	}

	if ( isFinishedPlaying ) {
		icon = ReplayIcon;
	}

	const iconStyle = style[ 'videopress-player__overlay-controls-button-icon' ];
	const renderButton = () => (
		<View style={ style[ 'videopress-player__overlay-controls-button' ] }>
			{ showControlIcon && <Icon icon={ icon } size={ iconStyle.size } style={ iconStyle } /> }
		</View>
	);

	if ( ! isSelected ) {
		return renderButton();
	}

	return (
		<View style={ style[ 'videopress-player__overlay-controls' ] }>
			<Pressable onPress={ togglePlayState }>{ renderButton() }</Pressable>
		</View>
	);
};

export default PlayerControls;
