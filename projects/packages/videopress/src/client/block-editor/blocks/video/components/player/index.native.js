/**
 * WordPress dependencies
 */
import { SandBox } from '@wordpress/components';
import { useState, useEffect, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
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
	const previewCheckInterval = useRef();

	// Fetch token for a VideoPress GUID
	useEffect( () => {
		if ( guid ) {
			getMediaToken( 'playback', { guid } ).then( tokenData => {
				setToken( tokenData.token );
			} );
		}
	}, [ guid ] );

	let videoPressUrl = getVideoPressUrl( guid, {
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

	// Append the attempt number to the URL to force a new request
	if ( previewCheckAttempts > 0 ) {
		videoPressUrl = addQueryArgs( videoPressUrl, {
			jp_app_attempts: previewCheckAttempts,
		} );
	}

	const { preview = {} } = usePreview( videoPressUrl );
	const html = addTokenIntoIframeSource( preview.html, token );

	const cancelPreviewCheckInterval = () => clearInterval( previewCheckInterval.current );

	// Fetch the preview until it's ready
	useEffect( () => {
		// Wait till the player is loaded to start checking for the preview
		if ( ! isPlayerLoaded ) {
			return;
		}
		previewCheckInterval.current = setInterval( () => {
			// if the preview is ready or we reached the max attempts, clear the interval
			if ( isPreviewReady( preview ) || previewCheckAttempts > VIDEO_PREVIEW_ATTEMPTS_LIMIT ) {
				return cancelPreviewCheckInterval();
			}

			setPreviewCheckAttempts( previewCheckAttempts + 1 );
		}, 1000 );

		return cancelPreviewCheckInterval;
	}, [ preview, isPlayerLoaded ] );

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
		return <Text>{ __( 'Error loading video', 'jetpack-videopress-pkg' ) }</Text>;
	};

	return (
		<View style={ [ style[ 'videopress-player' ], loadingStyle ] }>
			{ ! isSelected && <View style={ style[ 'videopress-player__overlay' ] } /> }
			{ renderEmbed() }
		</View>
	);
}
