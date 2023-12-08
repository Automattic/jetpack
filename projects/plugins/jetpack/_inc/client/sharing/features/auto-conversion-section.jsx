import { Text, getRedirectUrl } from '@automattic/jetpack-components';
import { AutoConversionToggle } from '@automattic/jetpack-publicize-components';
import './style.scss';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { FormFieldset } from '../../components/forms';

const AutoConversionSection = () => {
	return (
		<FormFieldset>
			<AutoConversionToggle toggleClass="jp-settings-sharing__sig-toggle">
				<div>
					<div>
						<Text>
							<strong>{ __( 'Automatically convert images for compatibility', 'jetpack' ) }</strong>
						</Text>
					</div>
					{ createInterpolateElement(
						__(
							'Social media platforms require different image file types and sizes. Upload one image and it will be automatically converted to ensure maximum compatibility & quality across all your connected platforms. <link>Learn more about media requirements.</link>',
							'jetpack'
						),
						{
							link: (
								<ExternalLink
									href={ getRedirectUrl( 'jetpack-social-media-support-information' ) }
								/>
							),
						}
					) }
				</div>
			</AutoConversionToggle>
		</FormFieldset>
	);
};

export default AutoConversionSection;
