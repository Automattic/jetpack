import { getRedirectUrl } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	ExternalLink,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { createInterpolateElement, useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PluginIntegrationPanel from './shared/plugin-integration-panel';

const AkismetPanel = () => {
	const adminUrl = window?.jpFormsBlocks?.defaults?.formsAdminUrl || '';

	// Initialize from global defaults, but will be updated from API
	const [ akismetActiveWithKey, setAkismetActiveWithKey ] = useState(
		window?.jpFormsBlocks?.defaults?.akismetActiveWithKey || false
	);
	const [ akismetUrl, setAkismetUrl ] = useState(
		window?.jpFormsBlocks?.defaults?.akismetUrl || ''
	);

	const checkAkismetStatus = useCallback( async () => {
		try {
			const response = await apiFetch( {
				path: '/wp/v2/feedback/integrations/akismet',
			} );
			setAkismetActiveWithKey( response.isConnected );
			if ( response.settingsUrl ) {
				setAkismetUrl( response.settingsUrl );
			}
		} catch {
			setAkismetActiveWithKey( false );
		}
	}, [] );

	useEffect( () => {
		checkAkismetStatus();
	}, [ checkAkismetStatus ] );

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
			onPluginActivated={ checkAkismetStatus }
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
