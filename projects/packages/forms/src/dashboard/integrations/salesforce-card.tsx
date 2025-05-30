import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import IntegrationCard from '../../blocks/contact-form/components/jetpack-integrations-modal/integration-card';
import SalesforceIcon from '../../icons/salesforce';
import type { IntegrationCardProps } from './types';

const SalesforceDashboardCard = ( {
	isExpanded,
	onToggle,
	data,
	refreshStatus,
}: IntegrationCardProps ) => {
	const cardData = {
		...data,
		showHeaderToggle: false, // Always off for dashboard
		isLoading: ! data || typeof data.isInstalled === 'undefined',
		refreshStatus,
		setupBadge: (
			<span className="integration-card__setup-badge">
				<Icon icon="info-outline" size={ 12 } />
				{ __( 'Enter organization ID', 'jetpack-forms' ) }
			</span>
		),
	};

	return (
		<IntegrationCard
			title={ __( 'Salesforce', 'jetpack-forms' ) }
			description={ __( 'Send form contacts to Salesforce', 'jetpack-forms' ) }
			// @ts-expect-error: IntegrationCard icon prop accepts JSX.Element
			icon={ <SalesforceIcon width={ 32 } height={ 32 } /> }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
			cardData={ cardData }
		>
			<div>
				<p className="integration-card__description">
					{ __(
						'Salesforce connections are managed for each form individually in the block editor.',
						'jetpack-forms'
					) }
				</p>
			</div>
		</IntegrationCard>
	);
};

export default SalesforceDashboardCard;
