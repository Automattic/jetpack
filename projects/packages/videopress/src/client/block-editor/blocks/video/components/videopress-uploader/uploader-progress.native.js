/**
 * WordPress dependencies
 */
import { MediaUploadProgress, VIDEO_ASPECT_RATIO } from '@wordpress/block-editor';
import { Icon } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState, Platform } from '@wordpress/element';
import {
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from '@wordpress/react-native-bridge';
/**
 * External dependencies
 */
import { Text, TouchableWithoutFeedback, View } from 'react-native';
/**
 * Internal dependencies
 */
import { VideoPressIcon, retryIcon } from '../icons';
import style from './style.scss';

const UploaderProgress = ( { file, onDone, onReset, isInteractionDisabled } ) => {
	const containerStyle = usePreferredColorSchemeStyle(
		style[ 'videopress-uploader__container' ],
		style[ 'videopress-uploader__container--dark' ]
	);
	const iconContainerStyle = style[ 'videopress-uploader__icon-container' ];
	const videoPressIconContainerStyle = [
		iconContainerStyle,
		style[ 'videopress-uploader__icon-container--videopress' ],
	];
	const retryIconContainerStyle = [
		iconContainerStyle,
		style[ 'videopress-uploader__icon-container--retry' ],
	];
	const iconStyle = usePreferredColorSchemeStyle(
		style[ 'videopress-uploader__icon' ],
		style[ 'videopress-uploader__icon--dark' ]
	);
	const retryUploadTextStyle = usePreferredColorSchemeStyle(
		style[ 'videopress-uploader__retry-upload-text' ],
		style[ 'videopress-uploader__retry-upload-text--dark' ]
	);

	const [ isUploadFailed, setIsUploadFailed ] = useState( false );
	const [ isFetchingGUID, setIsFetchingGUID ] = useState( false );
	const [ mediaServerID, setMediaServerID ] = useState();

	// In case the GUID is empty, we fetch it manually via `media` endpoint.
	const { media } = useSelect(
		select => ( {
			media:
				! isFetchingGUID || typeof mediaServerID === 'undefined'
					? undefined
					: select( coreStore ).getMedia( mediaServerID ),
		} ),
		[ isFetchingGUID, mediaServerID ]
	);
	useEffect( () => {
		if ( isFetchingGUID && media ) {
			const { jetpack_videopress_guid: videopressGUID } = media;
			setIsFetchingGUID( false );
			setMediaServerID( undefined );
			onDone( {
				id: mediaServerID,
				guid: videopressGUID,
			} );
		}
	}, [ isFetchingGUID, mediaServerID, media ] );

	const onPress = useCallback( () => {
		if ( isUploadFailed ) {
			requestImageFailedRetryDialog( file?.id );
		} else {
			requestImageUploadCancelDialog( file?.id );
		}
	}, [ file, isUploadFailed ] );

	const onUploadSuccess = useCallback(
		payload => {
			const { metadata, mediaServerId } = payload;
			// The metadata object has a different structure on each platform.
			// - On iOS, we get all the VideoPress metadata properties.
			// Reference: https://github.com/wordpress-mobile/WordPress-iOS/blob/157aee0f9d2e9429e50a863ca6d7ecefbafe5be9/WordPress/Classes/ViewRelated/Gutenberg/GutenbergMediaInserterHelper.swift#L268-L276
			// - While on Android, we only get the VideoPress GUID.
			// Reference: https://github.com/wordpress-mobile/WordPress-Android/blob/80f608f2d3a8afb36fe5a7795d172bf66e6ccd4e/libs/editor/src/main/java/org/wordpress/android/editor/gutenberg/GutenbergEditorFragment.java#L1262-L1273
			const guid = Platform.select( {
				android: metadata?.videopressGUID,
				ios: metadata?.id,
			} );

			// In most cases the VideoPress GUID will be returned upon upload finish.
			// However, since the video is asynchronously added to VideoPress, there's
			// a chance that GUID could be empty. For this case, we'll fetch it manually.
			if ( ! guid ) {
				setMediaServerID( mediaServerId );
				setIsFetchingGUID( true );
				return;
			}

			onDone( { id: mediaServerId, guid } );
		},
		[ onDone ]
	);

	const onUploadProgress = useCallback( () => {
		setIsUploadFailed( false );
	}, [] );

	const onUploadReset = useCallback( () => {
		setIsUploadFailed( false );
		onReset();
	}, [] );

	const onUploadFail = useCallback( () => {
		setIsUploadFailed( true );
	}, [] );

	return (
		<TouchableWithoutFeedback
			accessible={ isInteractionDisabled }
			onPress={ onPress }
			disabled={ isInteractionDisabled }
		>
			<View>
				<MediaUploadProgress
					mediaId={ file?.id }
					onFinishMediaUploadWithSuccess={ onUploadSuccess }
					onFinishMediaUploadWithFailure={ onUploadFail }
					onUpdateMediaProgress={ onUploadProgress }
					onMediaUploadStateReset={ onUploadReset }
					renderContent={ ( { retryMessage } ) => {
						return (
							<View style={ [ containerStyle, { aspectRatio: VIDEO_ASPECT_RATIO } ] }>
								{ isUploadFailed ? (
									<>
										<View style={ retryIconContainerStyle }>
											<Icon icon={ retryIcon } { ...iconStyle } />
										</View>
										<Text style={ retryUploadTextStyle }>{ retryMessage }</Text>
									</>
								) : (
									<View style={ videoPressIconContainerStyle } testID="videopress-uploading-video">
										<Icon icon={ VideoPressIcon } { ...iconStyle } />
									</View>
								) }
							</View>
						);
					} }
				/>
			</View>
		</TouchableWithoutFeedback>
	);
};

export default UploaderProgress;
