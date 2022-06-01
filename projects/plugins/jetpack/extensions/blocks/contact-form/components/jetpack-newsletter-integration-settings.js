import { BaseControl, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ConsentBlockSettings from './jetpack-newsletter-integration-settings-consent-block';
import CreativeMailPlugin from './jetpack-newsletter-integration-settings-creativemail';

const NewsletterIntegrationSettings = () => {
	return (
		<PanelBody title={ __( 'Newsletter Integration', 'jetpack' ) } initialOpen={ false }>
			<BaseControl>
				<ConsentBlockSettings />
				<CreativeMailPlugin />
			</BaseControl>
		</PanelBody>
	);
};

export default NewsletterIntegrationSettings;
