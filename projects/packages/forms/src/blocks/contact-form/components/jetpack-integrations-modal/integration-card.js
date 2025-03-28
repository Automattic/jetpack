import { Card, CardHeader, CardBody, Icon } from '@wordpress/components';

const IntegrationCard = ( { title, isExpanded, onToggle, children } ) => {
	return (
		<Card>
			<CardHeader onClick={ onToggle } style={ { cursor: 'pointer' } }>
				<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
					<Icon icon={ isExpanded ? 'arrow-down-alt2' : 'arrow-right-alt2' } />
					<strong>{ title }</strong>
				</div>
			</CardHeader>
			{ isExpanded && <CardBody>{ children }</CardBody> }
		</Card>
	);
};

export default IntegrationCard;
