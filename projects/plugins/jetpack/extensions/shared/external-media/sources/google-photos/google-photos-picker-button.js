import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
import mediaImage from '../../../../../images/media.svg';

export default function GooglePhotosPickerButton( props ) {
	const { pickerSession } = props;

	return (
		<div className="jetpack-external-media__google-photos-picker">
			<img src={ mediaImage } width="150" alt={ __( 'Google Photos', 'jetpack' ) } />

			<h1>{ __( 'Google Photos', 'jetpack' ) }</h1>
			<p>{ __( 'Select photos directly from your Google Photos library.', 'jetpack' ) }</p>

			<Button variant="primary" isBusy={ ! pickerSession }>
				{ __( 'Open Google Photos Picker', 'jetpack' ) }
				&nbsp;
				<Icon icon={ external } size={ 18 } />
			</Button>
		</div>
	);
}
