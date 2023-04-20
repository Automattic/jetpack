/**
 * WordPress dependencies
 */
import { SandBox } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { View, Text, Platform } from 'react-native';
/**
 * Internal dependencies
 */
import getMediaToken from '../../../../../lib/get-media-token/index.native';
import { getVideoPressUrl } from '../../../../../lib/url';
import { usePreview } from '../../../../hooks/use-preview';
import addTokenIntoIframeSource from '../../../../utils/add-token-iframe-source';
import PlayerControls from './controls';
import style from './style.scss';

const VIDEO_PREVIEW_ATTEMPTS_LIMIT = 10;

// The preview is ready when it has a height property
const isPreviewReady = preview => !! preview?.height;

/**
 * VideoPlayer react component
 *
 * @param {object} props - Component props.
 * @param {object} props.attributes - Block attributes.
 * @param {boolean} props.isSelected - Whether the block is selected.
 * @returns {import('react').ReactElement} - React component.
 */
export default function Player( { isSelected, attributes } ) {
	const {
		controls,
		guid,
		loop,
		muted,
		playsinline,
		poster,
		preload,
		seekbarColor,
		seekbarLoadingColor,
		seekbarPlayedColor,
	} = attributes;

	const [ isPlayerLoaded, setIsPlayerLoaded ] = useState( false );
	const [ token, setToken ] = useState();
	const [ previewCheckAttempts, setPreviewCheckAttempts ] = useState( 0 );
	const previewCheckTimer = useRef();

	// Used for Android controls only
	const [ playEnded, setPlayEnded ] = useState( false );
	const playerRef = useRef();
	const onToggleEvent = useCallback( event => {
		playerRef.current?.injectJavaScript( `
			document?.querySelector('iframe')?.contentWindow.postMessage({event: 'videopress_action_${ event }'}, '*');
		` );
	}, [] );

	// Fetch token for a VideoPress GUID
	useEffect( () => {
		if ( guid ) {
			getMediaToken( 'playback', { guid } ).then( tokenData => {
				setToken( tokenData.token );
			} );
		}
	}, [ guid ] );

	const videoPressUrl = getVideoPressUrl( guid, {
		autoplay: false, // Note: Autoplay is disabled to prevent the video from playing fullscreen when loading the editor.
		controls: Platform.OS === 'ios',
		loop,
		muted,
		playsinline,
		preload,
		seekbarColor,
		seekbarLoadingColor,
		seekbarPlayedColor,
		poster,
	} );

	const { preview = {}, isRequestingEmbedPreview } = usePreview( videoPressUrl );
	const html = addTokenIntoIframeSource( preview.html, token );

	const { invalidateResolution } = useDispatch( coreStore );
	const invalidatePreview = () => invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );

	// Fetch the preview until it's ready
	useEffect( () => {
		if ( ! isPlayerLoaded || isRequestingEmbedPreview ) {
			return;
		}

		if ( isPreviewReady( preview ) || previewCheckAttempts > VIDEO_PREVIEW_ATTEMPTS_LIMIT ) {
			clearTimeout( previewCheckTimer.current );
			return;
		}

		previewCheckTimer.current = setTimeout( () => {
			invalidatePreview();
			setPreviewCheckAttempts( previewCheckAttempts + 1 );
		}, 1000 );

		return () => clearTimeout( previewCheckTimer.current );
	}, [ preview, isPlayerLoaded, isRequestingEmbedPreview, previewCheckAttempts ] );

	const onSandboxMessage = message => {
		switch ( message.event ) {
			case 'videopress_loading_state':
				if ( message.state === 'loaded' ) {
					setIsPlayerLoaded( true );
				}
				break;

			// Events use for the Android controls
			case 'videopress_ended':
				setPlayEnded( true );
				break;
			case 'videopress_playing':
				if ( playEnded ) {
					setPlayEnded( false );
				}
				break;
		}
	};

	const loadingStyle = {};
	if ( ! isPreviewReady( preview ) ) {
		loadingStyle.height = 250;
	}

	const renderOverlay = () => {
		// Show custom controls on Android only
		if ( Platform.OS === 'android' && isPlayerLoaded ) {
			return (
				<View style={ style[ 'videopress-player__overlay' ] }>
					<PlayerControls
						isSelected={ isSelected }
						playEnded={ playEnded }
						onToggle={ onToggleEvent }
					/>
				</View>
			);
		}

		if ( ! isSelected ) {
			return <View style={ style[ 'videopress-player__overlay' ] } />;
		}
	};

	const renderEmbed = () => {
		if ( html ) {
			return (
				<SandBox
					html={ html }
					onWindowEvents={ { message: onSandboxMessage } }
					viewportProps="user-scalable=0"
					ref={ playerRef }
				/>
			);
		}
		return <Text>{ __( 'Loading', 'jetpack-videopress-pkg' ) }</Text>;
	};

	return (
		<View style={ [ style[ 'videopress-player' ], loadingStyle ] }>
			{ renderOverlay() }
			{ renderEmbed() }
		</View>
	);
}
