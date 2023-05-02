/**
 * External dependencies
 */
import { Text, LoadingPlaceholder } from '@automattic/jetpack-components';
import { gmdateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { getVideoUrlBasedOnPrivacy } from '../../../lib/url';
/**
 * Internal dependencies
 */
import ClipboardButtonInput from '../clipboard-button-input';
import styles from './style.module.scss';
import { VideoDetailsProps } from './types';

const VideoDetails = ( {
	filename,
	uploadDate,
	shortcode,
	loading = false,
	guid,
	isPrivate,
}: VideoDetailsProps ) => {
	const formattedDate = uploadDate?.length ? gmdateI18n( 'F j, Y', uploadDate ) : false;

	const videoLinkUrl = getVideoUrlBasedOnPrivacy( guid, isPrivate );

	return (
		<div className={ styles.details }>
			<div>
				<Text variant="body-small">{ __( 'Link to video', 'jetpack-videopress-pkg' ) }</Text>
				{ loading ? (
					<LoadingPlaceholder height={ 36 } />
				) : (
					<ClipboardButtonInput value={ videoLinkUrl } />
				) }
			</div>

			<div>
				<Text variant="body-small">{ __( 'WordPress shortcode', 'jetpack-videopress-pkg' ) }</Text>
				{ loading ? (
					<LoadingPlaceholder height={ 36 } />
				) : (
					<ClipboardButtonInput value={ shortcode } />
				) }
			</div>

			<div>
				<Text variant="body-small">{ __( 'File name', 'jetpack-videopress-pkg' ) }</Text>
				{ loading ? (
					<LoadingPlaceholder height={ 24 } />
				) : (
					<Text className={ styles.filename }>{ filename }</Text>
				) }
			</div>

			<div>
				<Text variant="body-small">{ __( 'Upload date', 'jetpack-videopress-pkg' ) }</Text>
				{ loading ? <LoadingPlaceholder height={ 24 } /> : <Text>{ formattedDate }</Text> }
			</div>
		</div>
	);
};

export default VideoDetails;
