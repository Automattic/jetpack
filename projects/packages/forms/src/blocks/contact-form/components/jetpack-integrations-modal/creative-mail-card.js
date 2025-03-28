import { __ } from '@wordpress/i18n';
import NewsletterIntegrationSettings from '../jetpack-newsletter-integration-settings';
import IntegrationCard from './integration-card';

const CreativeMailCard = ( { isExpanded, onToggle } ) => {
	return (
		<IntegrationCard
			title={ __( 'Creative Mail', 'jetpack-forms' ) }
			description={ __( 'Manage email contacts and campaigns', 'jetpack-forms' ) }
			icon="email"
			isExpanded={ isExpanded }
			onToggle={ onToggle }
		>
			<NewsletterIntegrationSettings />
		</IntegrationCard>
	);
};

export default CreativeMailCard;
