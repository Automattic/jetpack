import { CardBody } from '@wordpress/components';

const IntegrationCardBody = ( { isExpanded, children } ) => {
	if ( ! isExpanded ) {
		return null;
	}

	return <CardBody>{ children }</CardBody>;
};

export default IntegrationCardBody;
