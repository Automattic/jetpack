import { CardBody, Spinner } from '@wordpress/components';

const IntegrationCardBody = ( { isExpanded, children, cardData = {} } ) => {
	if ( ! isExpanded ) {
		return null;
	}

	const { notInstalledMessage, notActivatedMessage, isInstalled, isActive, isLoading } = cardData;

	return (
		<CardBody>
			{ isLoading && <Spinner /> }
			{ ! isLoading && ! isInstalled && (
				<p className="integration-card__description">{ notInstalledMessage }</p>
			) }
			{ ! isLoading && isInstalled && ! isActive && (
				<p className="integration-card__description">{ notActivatedMessage }</p>
			) }
			{ ! isLoading && isInstalled && isActive && children }
		</CardBody>
	);
};

export default IntegrationCardBody;
