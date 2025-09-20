/**
 * External dependencies
 */
import { Button, ExternalLink, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, plugins } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import IntegrationCard from './integration-card';
/**
 * Types
 */
import type { Integration, IntegrationCardData } from '../../../../types';

interface PluginIntegrationCardProps {
	integration: Integration;
	isExpanded: boolean;
	onToggle: () => void;
	borderBottom: boolean;
	refreshIntegrations?: () => void;
}

const PluginIntegrationCard = ( {
	integration,
	isExpanded,
	onToggle,
	borderBottom,
	refreshIntegrations,
}: PluginIntegrationCardProps ) => {
	const {
		id = '',
		title = '',
		subtitle = '',
		isConnected = false,
		isInstalled = false,
		isActive = false,
		settingsUrl = '',
		marketingUrl = '',
	} = integration;

	const cardData: IntegrationCardData = {
		...integration,
		showHeaderToggle: true,
		isLoading: ! integration || typeof integration.isInstalled === 'undefined',
		refreshStatus: refreshIntegrations,
		trackEventName: `jetpack_forms_plugin_${ id }_click`,
		notInstalledMessage: marketingUrl
			? createInterpolateElement(
					/* translators: %s is the plugin name */
					__(
						'Enhance your forms with <a>%s</a>. Simply install the plugin to get started.',
						'jetpack-forms'
					).replace( '%s', title ),
					{
						a: <ExternalLink href={ marketingUrl } />,
					}
			  )
			: __( 'This plugin enhances your forms. Install it to get started.', 'jetpack-forms' ),
		/* translators: %s is the plugin name */
		notActivatedMessage: __(
			'%s is installed. Just activate the plugin to start using it.',
			'jetpack-forms'
		).replace( '%s', title ),
	};

	const integrationIcon = <Icon icon={ plugins } size={ 28 } />;
	/* translators: %s is the plugin name */
	const toggleTooltip = __( 'Toggle %s integration', 'jetpack-forms' ).replace( '%s', title );

	// Determine the content based on plugin state
	const renderContent = () => {
		if ( ! isConnected && isInstalled && isActive ) {
			// Plugin is active but needs setup
			return (
				<div>
					<p className="integration-card__description">
						{ createInterpolateElement(
							/* translators: %s is the plugin name (appears twice) */
							__(
								'%s is active. There is one step left. Please complete <a>%s setup</a>.',
								'jetpack-forms'
							).replace( /%s/g, title ),
							{
								a: settingsUrl ? <ExternalLink href={ settingsUrl } /> : <span />,
							}
						) }
					</p>
					<HStack spacing="3" justify="start">
						{ settingsUrl && (
							<Button
								variant="secondary"
								href={ settingsUrl }
								target="_blank"
								rel="noopener noreferrer"
								__next40pxDefaultSize={ true }
							>
								{
									/* translators: %s is the plugin name */
									__( 'Complete %s setup', 'jetpack-forms' ).replace( '%s', title )
								}
							</Button>
						) }
						<Button
							variant="tertiary"
							onClick={ refreshIntegrations }
							__next40pxDefaultSize={ true }
						>
							{ __( 'Refresh status', 'jetpack-forms' ) }
						</Button>
					</HStack>
				</div>
			);
		}

		if ( isConnected ) {
			// Plugin is fully set up and connected
			return (
				<div>
					<p className="integration-card__description">
						{
							/* translators: %s is the plugin name */
							__( 'You can now use %s with your forms.', 'jetpack-forms' ).replace( '%s', title )
						}
					</p>
					{ settingsUrl && (
						<Button variant="link" href={ settingsUrl } target="_blank" rel="noopener noreferrer">
							{
								/* translators: %s is the plugin name */
								__( 'View %s dashboard', 'jetpack-forms' ).replace( '%s', title )
							}
						</Button>
					) }
				</div>
			);
		}

		// Default fallback content for plugins that are not yet set up
		return (
			<div>
				<p className="integration-card__description">
					{ subtitle || __( 'Configure this plugin to enhance your forms.', 'jetpack-forms' ) }
				</p>
				{ settingsUrl && (
					<Button
						variant="secondary"
						href={ settingsUrl }
						target="_blank"
						rel="noopener noreferrer"
						__next40pxDefaultSize={ true }
					>
						{
							/* translators: %s is the plugin name */
							__( 'Configure %s', 'jetpack-forms' ).replace( '%s', title )
						}
					</Button>
				) }
				{ refreshIntegrations && (
					<Button variant="tertiary" onClick={ refreshIntegrations } __next40pxDefaultSize={ true }>
						{ __( 'Refresh status', 'jetpack-forms' ) }
					</Button>
				) }
			</div>
		);
	};

	return (
		<IntegrationCard
			title={ title }
			description={ subtitle }
			icon={ integrationIcon }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
			cardData={ cardData }
			toggleTooltip={ toggleTooltip }
			borderBottom={ borderBottom }
		>
			{ renderContent() }
		</IntegrationCard>
	);
};

export default PluginIntegrationCard;
