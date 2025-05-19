import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import IntegrationCard from '../../blocks/contact-form/components/jetpack-integrations-modal/integration-card';
import SalesforceIcon from '../../icons/salesforce';

const SalesforceDashboardCard = ( { isExpanded, onToggle, data, refreshStatus } ) => {
	const cardData = {
		...data,
		showHeaderToggle: false, // Always off for dashboard
		isLoading: typeof data.isInstalled === 'undefined',
		refreshStatus,
	};

	return (
		<IntegrationCard
			title={ __( 'Salesforce', 'jetpack-forms' ) }
			description={ __( 'Send form contacts to Salesforce', 'jetpack-forms' ) }
			icon={ <SalesforceIcon width={ 32 } height={ 32 } /> }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
			cardData={ cardData }
		>
			<div>
				<p>
					{ __(
						'Connect your site to Salesforce to send leads directly to your CRM.',
						'jetpack-forms'
					) }
				</p>
				<p>
					<ExternalLink href="https://help.salesforce.com/s/articleView?id=000325251&type=1">
						{ __( 'Where to find your Salesforce Organization ID', 'jetpack-forms' ) }
					</ExternalLink>
				</p>
			</div>
		</IntegrationCard>
	);
};

export default SalesforceDashboardCard;
