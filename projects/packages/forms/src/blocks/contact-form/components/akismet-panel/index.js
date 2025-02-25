import { getSiteAdminUrl } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PluginIntegrationPanel from '../shared/plugin-integration-panel';
import './styles.css';

const AkismetPanel = () => {
	return (
		<PluginIntegrationPanel
			title={ __( 'Spam protection', 'jetpack-forms' ) }
			pluginSlug="akismet"
			pluginPath="akismet/akismet"
			installText={ __( 'Install akismet', 'jetpack-forms' ) }
			activateText={ __( 'Activate akismet', 'jetpack-forms' ) }
			description={ createInterpolateElement(
				__(
					"Add one-click spam protection for your forms with <a>Akismet</a>. Simply install the plugin and you're set.",
					'jetpack-forms'
				),
				{
					a: (
						<a
							href="https://wordpress.org/plugins/akismet/"
							target="_blank"
							rel="noopener noreferrer"
						/>
					),
				}
			) }
			tracksEventName="jetpack_forms_upsell_akismet_click"
			initialOpen={ false }
		>
			<p className="jetpack-akismet-panel__text">
				{ createInterpolateElement(
					__( 'Your forms are protected from spam with <a>Akismet</a>!', 'jetpack-forms' ),
					{
						a: (
							<a
								href="https://akismet.com/support/getting-started/using-akismet-with-your-contact-forms/"
								target="_blank"
								rel="noopener noreferrer"
							/>
						),
					}
				) }
			</p>
			<div className="jetpack-akismet-panel__buttons">
				{ getSiteAdminUrl() && (
					<Button
						variant="secondary"
						href={ `${ getSiteAdminUrl() }admin.php?page=jetpack-forms#/responses?status=spam` }
						target="_blank"
						rel="noopener noreferrer"
						__next40pxDefaultSize={ true }
					>
						{ __( 'Review spam', 'jetpack-forms' ) }
					</Button>
				) }
			</div>
		</PluginIntegrationPanel>
	);
};

export default AkismetPanel;
