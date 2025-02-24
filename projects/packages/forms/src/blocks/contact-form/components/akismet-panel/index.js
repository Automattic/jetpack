import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import PluginIntegrationPanel from '../shared/plugin-integration-panel';

const AkismetPanel = () => {
	const { adminUrl } = useSelect( select => {
		const site = select( coreStore ).getEntityRecord( 'root', 'site' );
		return {
			adminUrl: site?.url ? `${ site.url }/wp-admin/` : null,
		};
	}, [] );

	return (
		<PluginIntegrationPanel
			pluginSlug="akismet"
			pluginPath="akismet/akismet"
			installText={ __( 'Install Akismet', 'jetpack-forms' ) }
			activateText={ __( 'Activate the Akismet plugin', 'jetpack-forms' ) }
			description={ __(
				"Add one-click spam protection for your forms with Akismet. Simply install the plugin and you're set.",
				'jetpack-forms'
			) }
			tracksEventName="jetpack_forms_upsell_akismet_click"
			title={ __( 'Spam Protection', 'jetpack-forms' ) }
			initialOpen={ false }
		>
			<p className="jetpack-contact-form__akismet_text">
				{ __( 'Your forms are protected with Akismet!', 'jetpack-forms' ) }
			</p>
			<div className="jetpack-contact-form__akismet-buttons">
				{ adminUrl && (
					<Button
						variant="secondary"
						href={ `${ adminUrl }admin.php?page=jetpack-forms#/responses?status=spam` }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'Review Spam', 'jetpack-forms' ) }
					</Button>
				) }
				<Button
					variant="secondary"
					href="https://akismet.com"
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'Learn More', 'jetpack-forms' ) }
				</Button>
			</div>
		</PluginIntegrationPanel>
	);
};

export default AkismetPanel;
