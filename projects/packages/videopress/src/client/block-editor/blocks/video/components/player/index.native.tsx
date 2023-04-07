/**
 * WordPress dependencies
 */
import { SandBox, Icon } from '@wordpress/components';
import { useCallback, useRef, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { View, Text, Platform, TouchableWithoutFeedback } from 'react-native';
/**
 * Internal dependencies
 */
import PauseIcon from './icons/icon-pause.native.js';
import PlayIcon from './icons/icon-play.native.js';
import ReplayIcon from './icons/icon-replay.native.js';
import style from './style.scss';
/**
 * Types
 */
import type { PlayerProps } from './types';

/**
 * VideoPlayer react component
 *
 * @param {object} props - Component props.
 * @param {string} props.html - HTML markup for the player.
 * @param {boolean} props.isRequestingEmbedPreview - Whether the preview is being requested.
 * @param {boolean} props.isSelected - Whether the block is selected.
 * @returns {object} - React component.
 */
export default function Player( { html, isRequestingEmbedPreview, isSelected }: PlayerProps ) {
	const [ isPlaying, setIsPlaying ] = useState( false );
	const [ isFinishedPlaying, setIsFinishedPlaying ] = useState( false );
	const [ showControlIcon, setShowControlIcon ] = useState( false );

	const sandboxRef = useRef( null );
	const hidePauseTimer = useRef( null );

	// Hide the play/pause button after a short delay.
	useEffect( () => {
		if ( isPlaying ) {
			hidePauseTimer.current = setTimeout( () => {
				setShowControlIcon( false );
			}, 800 );
		}
		return () => {
			clearTimeout( hidePauseTimer.current );
		};
	} );

	// Set up style for when the player is loading.
	const loadingStyle: { height?: number } = {};
	if ( ! html || isRequestingEmbedPreview ) {
		loadingStyle.height = 250;
	}

	const sendPlayerEvent = event => {
		sandboxRef.current?.injectJavaScript( `
      document?.querySelector('iframe')?.contentWindow.postMessage({event: 'videopress_action_${ event }'}, '*');
    ` );
	};

	const onWindowMessage = useCallback(
		message => {
			switch ( message.event ) {
				// Reset the component play state when the video is finished.
				case 'videopress_ended':
					clearTimeout( hidePauseTimer.current );
					setIsFinishedPlaying( true );
					setIsPlaying( false );
					setShowControlIcon( true );
					break;

				// Hide the control icon until the video is loaded.
				case 'videopress_loading_state':
					if ( ! message.processing ) {
						setShowControlIcon( true );
					}
			}
		},
		[ hidePauseTimer, setIsFinishedPlaying, setIsPlaying, setShowControlIcon ]
	);

	const togglePlayState = () => {
		setIsFinishedPlaying( false );
		setShowControlIcon( true );

		sendPlayerEvent( isPlaying ? 'pause' : 'play' );
		setIsPlaying( ! isPlaying );
	};

	/**
	 * Render the play/pause/replay button on Android.
	 *
	 * @returns {object} - React component.
	 */
	const renderAndroidControlButton = () => {
		if ( Platform.OS !== 'android' ) {
			return null;
		}

		const iconStyle = style[ 'videopress-player__overlay-controls-button-icon' ];
		const buttonStyle = style[ 'videopress-player__overlay-controls-button' ];

		// Render the static play button.
		if ( ! isSelected ) {
			return (
				<View style={ buttonStyle }>
					<Icon icon={ PlayIcon } size={ iconStyle.size } style={ iconStyle } />
				</View>
			);
		}

		let icon = isPlaying ? PauseIcon : PlayIcon;

		if ( isFinishedPlaying ) {
			icon = ReplayIcon;
		}

		// Render the play state buttons on Android.
		return (
			<View style={ style[ 'videopress-player__overlay-controls' ] }>
				<TouchableWithoutFeedback onPress={ togglePlayState }>
					<View style={ buttonStyle }>
						{ showControlIcon && (
							<Icon icon={ icon } size={ iconStyle.size } style={ iconStyle } />
						) }
					</View>
				</TouchableWithoutFeedback>
			</View>
		);
	};

	const renderOverlay = () => {
		if ( ! isSelected ) {
			return (
				<View style={ style[ 'videopress-player__overlay' ] }>
					{ renderAndroidControlButton() }
				</View>
			);
		}

		return renderAndroidControlButton();
	};

	return (
		<View style={ [ style[ 'videopress-player' ], loadingStyle ] }>
			{ renderOverlay() }
			{ ! isRequestingEmbedPreview && (
				<SandBox html={ html } ref={ sandboxRef } onWindowEvents={ { message: onWindowMessage } } />
			) }
			{ ! html && <Text>{ __( 'Loading…', 'jetpack-videopress-pkg' ) }</Text> }
		</View>
	);
}
