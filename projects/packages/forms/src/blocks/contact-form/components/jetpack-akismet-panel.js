import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button, ExternalLink, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { createInterpolateElement, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PluginIntegrationPanel from './shared/plugin-integration-panel';

const AkismetPanel = () => {
	const adminUrl = window?.jpFormsBlocks?.defaults?.formsAdminUrl || '';
	const akismetActiveWithKey = window?.jpFormsBlocks?.defaults?.akismetActiveWithKey || false;
	const akismetUrl = window?.jpFormsBlocks?.defaults?.akismetUrl || '';

	// Check if we need to refresh the page to get updated key status
	useEffect( () => {
		const needsRefresh = window?.sessionStorage?.getItem( 'akismet_activation_pending' );
		if ( needsRefresh ) {
			window.sessionStorage.removeItem( 'akismet_activation_pending' );
			window.location.reload();
		}
	}, [] );

	const onActivate = () => {
		// Set a flag to check on next render if we need to refresh
		window.sessionStorage.setItem( 'akismet_activation_pending', 'true' );
	};

	return (
		<PluginIntegrationPanel
			title={ __( 'Spam protection', 'jetpack-forms' ) }
			pluginSlug="akismet"
			pluginPath="akismet/akismet"
			pluginTitle="Akismet"
			installText={ __( 'Install Akismet', 'jetpack-forms' ) }
			activateText={ __( 'Activate Akismet', 'jetpack-forms' ) }
			description={ createInterpolateElement(
				__(
					"Add one-click spam protection for your forms with <a>Akismet</a>. Simply install the plugin and you're set.",
					'jetpack-forms'
				),
				{
					a: <ExternalLink href={ getRedirectUrl( 'akismet-wordpress-org' ) } />,
				}
			) }
			tracksEventName="jetpack_forms_upsell_akismet_click"
			initialOpen={ false }
			onActivate={ onActivate }
		>
			{ akismetActiveWithKey ? (
				<>
					<p>
						{ createInterpolateElement(
							__( 'Your forms are protected from spam with <a>Akismet</a>!', 'jetpack-forms' ),
							{
								a: <ExternalLink href={ getRedirectUrl( 'akismet-jetpack-forms-docs' ) } />,
							}
						) }
					</p>
					<HStack justify="flex-start" spacing={ 2 }>
						<Button
							variant="secondary"
							href={ adminUrl }
							target="_blank"
							rel="noopener noreferrer"
							__next40pxDefaultSize={ true }
						>
							{ __( 'View spam', 'jetpack-forms' ) }
						</Button>
						<Button
							variant="secondary"
							href={ akismetUrl }
							target="_blank"
							rel="noopener noreferrer"
							__next40pxDefaultSize={ true }
						>
							{ __( 'View stats', 'jetpack-forms' ) }
						</Button>
					</HStack>
				</>
			) : (
				<>
					<p>
						{ createInterpolateElement(
							__(
								'Akismet is active! There is one step left. Please add your <a>Akismet key</a>.',
								'jetpack-forms'
							),
							{
								a: <ExternalLink href={ akismetUrl } />,
							}
						) }
					</p>
					<Button
						variant="secondary"
						href={ akismetUrl }
						target="_blank"
						rel="noopener noreferrer"
						__next40pxDefaultSize={ true }
					>
						{ __( 'Add Akismet key', 'jetpack-forms' ) }
					</Button>
				</>
			) }
		</PluginIntegrationPanel>
	);
};

export default AkismetPanel;
