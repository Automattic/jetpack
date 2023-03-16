/**
 * WordPress dependencies
 */
import { MediaUploadProgress, VIDEO_ASPECT_RATIO } from '@wordpress/block-editor';
import { Icon } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
import { useCallback, useState } from '@wordpress/element';
/**
 * External dependencies
 */
import { Text, View } from 'react-native';
/**
 * Internal dependencies
 */
import { VideoPressIcon } from '../icons';
import style from './style.scss';

const UploaderProgress = ( { file, onDone } ) => {
	const containerStyle = usePreferredColorSchemeStyle(
		style[ 'videopress-uploader__container' ],
		style[ 'videopress-uploader__container--dark' ]
	);
	const iconStyle = usePreferredColorSchemeStyle(
		style[ 'videopress-uploader__icon' ],
		style[ 'videopress-uploader__icon--dark' ]
	);

	const [ isUploadFailed, setIsUploadFailed ] = useState( false );

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
	}, [] );

	const onUploadFail = useCallback( () => {
		setIsUploadFailed( true );
	}, [] );

	return (
		<MediaUploadProgress
			mediaId={ file?.id }
			onFinishMediaUploadWithSuccess={ onUploadSuccess }
			onFinishMediaUploadWithFailure={ onUploadFail }
			onUpdateMediaProgress={ onUploadProgress }
			onMediaUploadStateReset={ onUploadReset }
			renderContent={ ( { retryMessage } ) => {
				return (
					<View style={ [ containerStyle, { aspectRatio: VIDEO_ASPECT_RATIO } ] }>
						<Icon icon={ VideoPressIcon } { ...iconStyle } />
						{ isUploadFailed && <Text style={ style.uploadFailedText }>{ retryMessage }</Text> }
					</View>
				);
			} }
		/>
	);
};

export default UploaderProgress;
