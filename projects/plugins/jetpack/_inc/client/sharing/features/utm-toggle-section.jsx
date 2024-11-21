import { Text } from '@automattic/jetpack-components';
import { UtmToggle } from '@automattic/jetpack-publicize-components';
import { __ } from '@wordpress/i18n';
import { FormFieldset } from '../../components/forms';
import './style.scss';

const UtmToggleSection = () => {
	return (
		<FormFieldset>
			<UtmToggle toggleClass="jp-settings-sharing__sig-toggle">
				<div>
					<Text>
						<strong>{ __( 'Append UTM parameters to shared URLs', 'jetpack' ) }</strong>
					</Text>
					{ __(
						"UTM parameters are tags added to links to help track where website visitors come from, improving our understanding of how content is shared. Don't worry, it doesn't change the experience or the link destination!",
						'jetpack'
					) }
				</div>
			</UtmToggle>{ ' ' }
		</FormFieldset>
	);
};

export default UtmToggleSection;
