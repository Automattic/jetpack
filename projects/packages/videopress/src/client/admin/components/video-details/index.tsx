import { Text } from '@automattic/jetpack-components';
import { gmdateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import ClipboardButtonInput from '../clipboard-button-input';
import styles from './style.module.scss';
import { VideoDetailsProps } from './types';

const VideoDetails = ( { filename, src, uploadDate }: VideoDetailsProps ) => {
	return (
		<div className={ styles.details }>
			<div className={ styles[ 'detail-row' ] }>
				<Text variant="body-small">{ __( 'Link to video', 'jetpack-videopress-pkg' ) }</Text>
				<ClipboardButtonInput value={ src } />
			</div>

			<div>
				<Text variant="body-small">{ __( 'File name', 'jetpack-videopress-pkg' ) }</Text>
				<Text variant="body">{ filename }</Text>
			</div>

			<div>
				<Text variant="body-small">{ __( 'Upload date', 'jetpack-videopress-pkg' ) }</Text>
				<Text variant="body">{ gmdateI18n( 'F j, Y', uploadDate ) }</Text>
			</div>
		</div>
	);
};

export default VideoDetails;
