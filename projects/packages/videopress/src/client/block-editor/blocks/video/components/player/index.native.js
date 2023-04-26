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
import { View, Text } from 'react-native';
/**
 * Internal dependencies
 */
import getMediaToken from '../../../../../lib/get-media-token/index.native';
import { getVideoPressUrl } from '../../../../../lib/url';
import { usePreview } from '../../../../hooks/use-preview';
import addTokenIntoIframeSource from '../../../../utils/add-token-iframe-source';
import { VideoPressIcon } from '../icons';
import style from './style.scss';

const VIDEO_PREVIEW_ATTEMPTS_LIMIT = 10;
const DEFAULT_PLAYER_ASPECT_RATIO =  16 / 9; // This is the observed default aspect ratio from VideoPress embeds.

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
	const [ isPlayerReady, setIsPlayerReady ] = useState( false );
	const [ isPlayerLoading, setIsPlayerLoading ] = useState( true );
	const [ showLoading, setShowLoading ] = useState( true ); 
	const [ token, setToken ] = useState();
	const [ previewCheckAttempts, setPreviewCheckAttempts ] = useState( 0 );
	const previewCheckTimer = useRef();

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
		controls,
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
	const isPreviewReady =
		!! preview?.height || previewCheckAttempts > VIDEO_PREVIEW_ATTEMPTS_LIMIT;

	const aspectRatio = preview?.width / preview?.height || DEFAULT_PLAYER_ASPECT_RATIO;

	// Fetch the preview until it's ready
	useEffect( () => {
		// return early 
		if ( ! isPlayerLoaded || isRequestingEmbedPreview ) {
			return;
		}

		if ( isPreviewReady) {
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
		}
	}, [] );

	const loadingOverlay = (
		<View style={ style[ 'videopress-player__overlay' ] } >
			<View style={ loadingViewStyle } >
				<Icon icon={ VideoPressIcon } size={ iconStyle?.size } style={ iconStyle } />
				<Text style={ style[ 'videopress-player__loading-text' ] }>
					{ __( 'Loading', 'jetpack-videopress-pkg' ) }
				</Text>
			</View>
		</View>
	);

	// Show the loading overlay when: 
	// 1. Player is not ready
	// 2. Player is loaded but preview is not ready
	const showLoadingOverlay = ! isPlayerReady || ( isPlayerLoaded && ! isPreviewReady );
	
	return (
		<View style={ [ style[ 'videopress-player' ], { aspectRatio } ] }>
			{ ! isSelected && <View style={ style[ 'videopress-player__overlay' ] } /> }
			{ showLoadingOverlay && loadingOverlay }
			<SandBox
				html={ html }
				onWindowEvents={ { message: onSandboxMessage } }
				viewportProps="user-scalable=0"
			/>
		</View>
	);
}
