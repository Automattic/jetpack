import { Card, CardHeader, CardBody, Icon } from '@wordpress/components';
import './integration-card.scss';

const IntegrationCard = ( {
	title,
	description,
	icon = 'admin-plugins', // Default to admin-plugins icon if none provided
	isExpanded,
	onToggle,
	children,
} ) => {
	return (
		<Card className="integration-card">
			<CardHeader onClick={ onToggle } className="integration-card__header">
				<div className="integration-card__header-content">
					<div className="integration-card__header-main">
						<Icon icon={ icon } className="integration-card__service-icon" size={ 30 } />
						<div className="integration-card__title-section">
							<h3 className="integration-card__title">{ title }</h3>
							{ description && (
								<span className="integration-card__description">{ description }</span>
							) }
						</div>
					</div>
					<Icon
						icon={ isExpanded ? 'arrow-up-alt2' : 'arrow-down-alt2' }
						className="integration-card__toggle-icon"
					/>
				</div>
			</CardHeader>
			{ isExpanded && <CardBody>{ children }</CardBody> }
		</Card>
	);
};

export default IntegrationCard;
