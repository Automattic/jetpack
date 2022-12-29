/**
 * External dependencies
 */
import { Text } from '@automattic/jetpack-components';
import { gmdateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import ClipboardButtonInput from '../clipboard-button-input';
import Placeholder from '../placeholder';
import styles from './style.module.scss';
import { VideoDetailsProps } from './types';

const VideoDetails = ( { filename, src, uploadDate, loading, shortcode }: VideoDetailsProps ) => {
	const formattedDate = uploadDate?.length ? gmdateI18n( 'F j, Y', uploadDate ) : false;

	return (
		<div className={ styles.details }>
			<div>
				<Text variant="body-small">{ __( 'Link to video', 'jetpack-videopress-pkg' ) }</Text>
				{ loading ? <Placeholder height={ 36 } /> : <ClipboardButtonInput value={ src } /> }
			</div>

			<div>
				<Text variant="body-small">{ __( 'WordPress shortcode', 'jetpack-videopress-pkg' ) }</Text>
				{ loading ? <Placeholder height={ 36 } /> : <ClipboardButtonInput value={ shortcode } /> }
			</div>

			<div>
				<Text variant="body-small">{ __( 'File name', 'jetpack-videopress-pkg' ) }</Text>
				{ loading ? <Placeholder height={ 24 } /> : <Text>{ filename }</Text> }
			</div>

			<div>
				<Text variant="body-small">{ __( 'Upload date', 'jetpack-videopress-pkg' ) }</Text>
				{ loading ? <Placeholder height={ 24 } /> : <Text>{ formattedDate }</Text> }
			</div>
		</div>
	);
};

export default VideoDetails;
