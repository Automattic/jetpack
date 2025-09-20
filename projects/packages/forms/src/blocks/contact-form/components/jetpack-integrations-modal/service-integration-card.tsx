/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
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

interface ServiceIntegrationCardProps {
	integration: Integration;
	isExpanded: boolean;
	onToggle: () => void;
	borderBottom: boolean;
	attributes?: Record< string, unknown >;
	setAttributes?: ( attributes: Record< string, unknown > ) => void;
	refreshIntegrations?: () => void;
}

const ServiceIntegrationCard = ( {
	integration,
	isExpanded,
	onToggle,
	borderBottom,
	attributes,
	setAttributes,
	refreshIntegrations,
}: ServiceIntegrationCardProps ) => {
	const { id = '', title = '', subtitle = '', settingsUrl = '' } = integration;

	// Check if this integration has form-specific settings
	const integrationSettings = attributes && attributes[ id ];
	const hasFormSettings = integrationSettings && typeof integrationSettings === 'object';

	const cardData: IntegrationCardData = {
		...integration,
		showHeaderToggle: false,
		isLoading: ! integration,
		refreshStatus: refreshIntegrations,
		trackEventName: `jetpack_forms_service_${ id }_click`,
	};

	const integrationIcon = <Icon icon={ plugins } size={ 28 } />;
	/* translators: %s is the service name */
	const toggleTooltip = __( 'Configure %s integration', 'jetpack-forms' ).replace( '%s', title );

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
			<div>
				<p className="integration-card__description">
					{ subtitle || __( 'Configure this service integration.', 'jetpack-forms' ) }
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
							/* translators: %s is the service name */
							__( 'Configure %s', 'jetpack-forms' ).replace( '%s', title )
						}
					</Button>
				) }

				{ hasFormSettings && setAttributes && (
					<div style={ { marginTop: '12px' } }>
						<p>{ __( 'This integration is configured for this form.', 'jetpack-forms' ) }</p>
						<Button
							variant="link"
							onClick={ () => {
								const newAttributes = { ...attributes };
								delete newAttributes[ id ];
								setAttributes( newAttributes );
							} }
						>
							{ __( 'Remove from this form', 'jetpack-forms' ) }
						</Button>
					</div>
				) }
			</div>
		</IntegrationCard>
	);
};

export default ServiceIntegrationCard;
