import { Card } from '@wordpress/components';
import './integration-card.scss';
import IntegrationCardBody from './integration-card-body';
import IntegrationCardHeader from './integration-card-header';

const IntegrationCard = ( {
	title,
	description,
	icon = 'admin-plugins', // Default to admin-plugins icon if none provided
	isExpanded,
	onToggle,
	children,
	cardData = {},
} ) => {
	return (
		<Card className="integration-card">
			<IntegrationCardHeader
				title={ title }
				description={ description }
				icon={ icon }
				isExpanded={ isExpanded }
				onToggle={ onToggle }
			/>
			<IntegrationCardBody isExpanded={ isExpanded } cardData={ cardData }>
				{ children }
			</IntegrationCardBody>
		</Card>
	);
};

export default IntegrationCard;
