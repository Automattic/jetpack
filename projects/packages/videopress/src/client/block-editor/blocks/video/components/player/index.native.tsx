/**
 * WordPress dependencies
 */
import { SandBox, DEFAULT_SANDBOX_SCRIPTS } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * External dependencies
 */
import { View, Text } from 'react-native';
/**
 * Internal dependencies
 */
import style from './style.scss';
/**
 * Types
 */
import type { PlayerProps } from './types';

type NativePlayerProps = Pick< PlayerProps, 'html' | 'isRequestingEmbedPreview' | 'isSelected' >;

const respondTokenRequestsJS = `
	( function() {
		let requests = {};

		// Request the token needed by the player to React Native.
		function listenTokenRequest( event ) {
			const guid = event.data.guid;
			const requestId = event.data.requestId;
			requests[ requestId ] = event;
			
			
			// acknowledge receipt of message so player knows if it can expect a response or if it should try again later.
			// Important for situations where the iframe loads prior to the bridge being ready.
			event.source.postMessage(
				{
					event: 'videopress_token_request_ack',
					guid,
					requestId,
				},
				'*'
			);

			window.ReactNativeWebView.postMessage(
				JSON.stringify( {
					action: 'videopress_token_request',
					guid,
					requestId,
				} )
			);
		}

		// Receives the token from React Native and passes it to the player.
		function processToken( event ) {
			const guid = event.data.guid;
			const token = event.data.token;
			const requestId = event.data.requestId;
			const request = requests[ requestId ];

			if ( ! request ) {
				return;
			}

			request.source.postMessage(
				{
					event: 'videopress_token_received',
					guid,
					jwt: token,
					requestId,
				},
				'*'
			);
		}

		window.addEventListener( 'message', function( event ) {
			switch ( event.data.event ) {
				case 'videopress_token_request':
					listenTokenRequest( event );
					break;
				case 'videopress_token_received':
					processToken( event );
					break;
			}
		} );
	} )();
`;

/**
 * VideoPlayer react component
 *
 * @param {object} props - Component props.
 * @param {string} props.html - HTML markup for the player.
 * @param {boolean} props.isRequestingEmbedPreview - Whether the preview is being requested.
 * @param {boolean} props.isSelected - Whether the block is selected.
 * @returns {object}                     - React component.
 */
export default function Player( {
	html,
	isRequestingEmbedPreview,
	isSelected,
}: NativePlayerProps ) {
	// Set up style for when the player is loading.
	const loadingStyle: { height?: number } = {};
	if ( ! html || isRequestingEmbedPreview ) {
		loadingStyle.height = 250;
	}

	return (
		<View style={ [ style[ 'videopress-player' ], loadingStyle ] }>
			{ ! isSelected && <View style={ style[ 'videopress-player__overlay' ] } /> }

			{ ! isRequestingEmbedPreview && (
				<SandBox html={ html } scripts={ [ respondTokenRequestsJS, ...DEFAULT_SANDBOX_SCRIPTS ] } />
			) }
			{ ! html && <Text>{ __( 'Loading…', 'jetpack-videopress-pkg' ) }</Text> }
		</View>
	);
}
