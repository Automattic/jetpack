/**
 * WordPress dependencies
 */
import { MediaUploadProgress, VIDEO_ASPECT_RATIO } from '@wordpress/block-editor';
import { Icon } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useCallback, useState } from '@wordpress/element';
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

	const [ isUploadFailed, setIsUploadFailed ] = useState( false );

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
			onDone( { id: mediaServerId, guid: metadata?.videopressGUID } );
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
									<Text style={ style[ 'videopress-uploader__failed-text' ] }>
										{ retryMessage }
									</Text>
								</>
							) : (
								<View style={ videoPressIconContainerStyle }>
									<Icon icon={ VideoPressIcon } { ...iconStyle } />
								</View>
							) }
						</View>
					);
				} }
			/>
		</TouchableWithoutFeedback>
	);
};

export default UploaderProgress;
