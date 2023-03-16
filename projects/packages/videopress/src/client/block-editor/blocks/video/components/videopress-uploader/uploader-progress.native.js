/**
 * External dependencies
 */
import { MediaUploadProgress, VIDEO_ASPECT_RATIO } from '@wordpress/block-editor';
import { Icon } from '@wordpress/components';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';
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

	return (
		<MediaUploadProgress
			mediaId={ file?.id }
			onFinishMediaUploadWithSuccess={ payload => {
				const { metadata, mediaServerId } = payload;
				onDone( { id: mediaServerId, guid: metadata?.videopressGUID } );
			} }
			renderContent={ ( { isUploadFailed, retryMessage } ) => {
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
