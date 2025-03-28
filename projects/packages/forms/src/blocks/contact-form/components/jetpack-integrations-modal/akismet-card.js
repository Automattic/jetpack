import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button, ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import PluginIntegrationPanel from '../shared/plugin-integration-panel';
import IntegrationCard from './integration-card';

const AkismetCard = ( { isExpanded, onToggle } ) => {
	const adminUrl = window?.jpFormsBlocks?.defaults?.formsAdminUrl || '';
	const akismetActiveWithKey = window?.jpFormsBlocks?.defaults?.akismetActiveWithKey || false;
	const akismetUrl = window?.jpFormsBlocks?.defaults?.akismetUrl || '';

	return (
		<IntegrationCard
			title={ __( 'Akismet Spam Protection', 'jetpack-forms' ) }
			description={ __( 'Akismet filters out form spam with 99% accuracy', 'jetpack-forms' ) }
			icon="shield"
			isExpanded={ isExpanded }
			onToggle={ onToggle }
		>
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
				hideWrapper
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
						<div style={ { display: 'flex', gap: '8px', justifyContent: 'flex-start' } }>
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
						</div>
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
		</IntegrationCard>
	);
};

export default AkismetCard;
