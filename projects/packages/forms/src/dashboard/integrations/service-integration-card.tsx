/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, plugins } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import IntegrationCard from '../../blocks/contact-form/components/jetpack-integrations-modal/integration-card';
import type { SingleIntegrationCardProps, IntegrationCardData } from '../../types';

/**
 * Service integration card for dashboard
 *
 * @param root0               - Component props
 * @param root0.isExpanded    - Whether the card is expanded
 * @param root0.onToggle      - Function to toggle card expansion
 * @param root0.data          - Integration data
 * @param root0.refreshStatus - Function to refresh integration status
 * @param root0.borderBottom  - Whether to show bottom border
 * @return Service integration card component
 */
const ServiceDashboardIntegrationCard = ( {
	isExpanded,
	onToggle,
	data,
	refreshStatus,
	borderBottom = true,
}: SingleIntegrationCardProps & { borderBottom?: boolean } ) => {
	const { id = '', title = '', subtitle = '', settingsUrl = '' } = data || {};

	// Create card data for service
	const cardData: IntegrationCardData = {
		...data,
		showHeaderToggle: false, // Dashboard cards don't show toggles
		isLoading: ! data,
		refreshStatus,
		trackEventName: `jetpack_forms_service_${ id }_click`,
	};

	const integrationIcon = <Icon icon={ plugins } size={ 28 } />;
	/* translators: %s is the service name */
	const toggleTooltip = __( 'Learn more about %s', 'jetpack-forms' ).replace( '%s', title );

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
			</div>
		</IntegrationCard>
	);
};

export default ServiceDashboardIntegrationCard;
