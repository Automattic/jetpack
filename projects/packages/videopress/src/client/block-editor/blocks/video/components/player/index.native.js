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
import { View, Text } from 'react-native';
/**
 * Internal dependencies
 */
import getMediaToken from '../../../../../lib/get-media-token/index.native';
import { getVideoPressUrl } from '../../../../../lib/url';
import { usePreview } from '../../../../hooks/use-preview';
import addTokenIntoIframeSource from '../../../../utils/add-token-iframe-source';
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

	// Fetch the preview until it's ready
	useEffect( () => {
		if ( ! isPlayerLoaded || isRequestingEmbedPreview ) {
			return;
		}

		if ( isPreviewReady( preview ) || previewCheckAttempts > VIDEO_PREVIEW_ATTEMPTS_LIMIT ) {
			return clearTimeout( previewCheckTimer.current );
		}

		previewCheckTimer.current = setTimeout( () => {
			invalidatePreview();
			setPreviewCheckAttempts( previewCheckAttempts + 1 );
		}, 1000 );

		return () => clearTimeout( previewCheckTimer.current );
	}, [ preview, isPlayerLoaded, isRequestingEmbedPreview, previewCheckAttempts ] );

	const onSandboxMessage = useCallback( message => {
		if ( message.event === 'videopress_loading_state' && message.state === 'loaded' ) {
			setIsPlayerLoaded( true );
		}
	}, [] );

	const loadingStyle = {};
	if ( ! isPreviewReady( preview ) ) {
		loadingStyle.height = 250;
	}

	const renderEmbed = () => {
		if ( html ) {
			return (
				<SandBox
					html={ html }
					onWindowEvents={ { message: onSandboxMessage } }
					viewportProps="user-scalable=0"
				/>
			);
		}
		return <Text>{ __( 'Loading', 'jetpack-videopress-pkg' ) }</Text>;
	};

	return (
		<View style={ [ style[ 'videopress-player' ], loadingStyle ] }>
			{ ! isSelected && <View style={ style[ 'videopress-player__overlay' ] } /> }
			{ renderEmbed() }
		</View>
	);
}
