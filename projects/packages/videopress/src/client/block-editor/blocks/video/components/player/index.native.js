/**
 * WordPress dependencies
 */
import { SandBox, Icon } from '@wordpress/components';
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
import { VideoPressIcon } from '../icons';
import PlayerControls from './controls';
import style from './style.scss';

const VIDEO_PREVIEW_ATTEMPTS_LIMIT = 10;
const DEFAULT_PLAYER_ASPECT_RATIO = 16 / 9; // This is the observed default aspect ratio from VideoPress embeds.
const IS_ANDROID = Platform.OS === 'android';

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

	const iconStyle = style[ 'videopress-player__loading-icon' ];
	const loadingViewStyle = style[ 'videopress-player__loading' ];

	const [ isPlayerLoaded, setIsPlayerLoaded ] = useState( false );
	const [ isPlayerReady, setIsPlayerReady ] = useState( IS_ANDROID );
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

	// Reset ready/loaded states when video changes.
	useEffect( () => {
		if ( guid ) {
			setIsPlayerLoaded( false );
			setIsPlayerReady( IS_ANDROID );
		}
	}, [ guid ] );

	const videoPressUrl = getVideoPressUrl( guid, {
		autoplay: false, // Note: Autoplay is disabled to prevent the video from playing fullscreen when loading the editor.
		controls: ! IS_ANDROID && controls,
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

	// Check if the preview is ready or we ran out of attempts.
	const isPreviewReady = !! preview?.height || previewCheckAttempts > VIDEO_PREVIEW_ATTEMPTS_LIMIT;

	const aspectRatio = preview?.width / preview?.height || DEFAULT_PLAYER_ASPECT_RATIO;

	// Fetch the preview until it's ready
	useEffect( () => {
		// return early
		if ( ! isPlayerLoaded || isRequestingEmbedPreview ) {
			return;
		}

		if ( isPreviewReady ) {
			clearTimeout( previewCheckTimer.current );
			return;
		}

		previewCheckTimer.current = setTimeout( () => {
			invalidatePreview();
			setPreviewCheckAttempts( previewCheckAttempts + 1 );
		}, 1000 );

		return () => clearTimeout( previewCheckTimer.current );
	}, [ preview, isPlayerLoaded, isRequestingEmbedPreview, previewCheckAttempts ] );

	const onSandboxMessage = useCallback( message => {
		switch ( message.event ) {
			case 'videopress_ready':
				setIsPlayerReady( true );
				break;
			case 'videopress_loading_state':
				setIsPlayerLoaded( message?.state === 'loaded' );
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
	}, [] );

	const loadingOverlay = (
		<View style={ style[ 'videopress-player__overlay' ] }>
			<View style={ loadingViewStyle }>
				<Icon icon={ VideoPressIcon } size={ iconStyle?.size } style={ iconStyle } />
				<Text style={ style[ 'videopress-player__loading-text' ] }>
					{ __( 'Loading', 'jetpack-videopress-pkg' ) }
				</Text>
			</View>
		</View>
	);

	const renderOverlay = () => {
		// Show custom controls on Android only
		if ( IS_ANDROID && isPlayerLoaded ) {
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

	// Show the loading overlay when:
	// 1. Player is not ready
	// 2. Player is loaded but preview is not ready
	const showLoadingOverlay = ! isPlayerReady || ( isPlayerLoaded && ! isPreviewReady );

	return (
		<View style={ [ style[ 'videopress-player' ], { aspectRatio } ] }>
			{ renderOverlay() }
			{ showLoadingOverlay && loadingOverlay }
			{ html && (
				<SandBox
					html={ html }
					onWindowEvents={ { message: onSandboxMessage } }
					viewportProps="user-scalable=0"
					ref={ playerRef }
				/>
			) }
		</View>
	);
}
