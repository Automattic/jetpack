import { Text } from '@automattic/jetpack-components';
import {
	SocialImageGeneratorToggle,
	TemplatePickerButton,
} from '@automattic/jetpack-publicize-components';
import { __ } from '@wordpress/i18n';
import { FormFieldset } from '../../components/forms';
import './style.scss';

const SocialImageGeneratorSection = () => {
	return (
		<FormFieldset>
			<SocialImageGeneratorToggle toggleClass="jp-settings-sharing__sig-toggle">
				<div>
					<Text>
						<strong>{ __( 'Enable Social Image Generator', 'jetpack' ) }</strong>
					</Text>
					{ __(
						'With Social Image Generator enabled you can automatically generate social images for your posts. You can use the button below to choose a default template for new posts.',
						'jetpack'
					) }
				</div>
				<div className="jp-settings-sharing__template-picker">
					<TemplatePickerButton />
				</div>
			</SocialImageGeneratorToggle>
		</FormFieldset>
	);
};

export default SocialImageGeneratorSection;
