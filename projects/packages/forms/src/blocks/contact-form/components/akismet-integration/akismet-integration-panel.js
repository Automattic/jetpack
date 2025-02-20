import { __ } from '@wordpress/i18n';
import PluginIntegrationPanel from '../shared/plugin-integration-panel';

const AkismetIntegrationPanel = () => {
	return (
		<PluginIntegrationPanel
			pluginSlug="akismet"
			pluginPath="akismet/akismet"
			installText={ __( 'Install Akismet', 'jetpack-forms' ) }
			activateText={ __( 'Activate the Akismet plugin', 'jetpack-forms' ) }
			description={ __( 'Protect your form from spam with Akismet.', 'jetpack-forms' ) }
			tracksEventName="jetpack_forms_upsell_akismet_click"
			title={ __( 'Spam Protection', 'jetpack-forms' ) }
			initialOpen={ false }
		>
			<p className="jetpack-contact-form__akismet_text">
				{ __( 'Akismet details here…', 'jetpack-forms' ) }
			</p>
		</PluginIntegrationPanel>
	);
};

export default AkismetIntegrationPanel;
