/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard, { PRODUCT_STATUSES } from '../product-card';
import { useProduct } from '../../hooks/use-product';
import { CrmIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const CrmCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching, hasRequiredPlan } = useProduct( 'crm' );
	const { name, description, slug, manageUrl, pricingForUi } = detail;
	const onManage = useCallback( () => {
		window.location = manageUrl;
	}, [ manageUrl ] );

	const discount =
		status === PRODUCT_STATUSES.NEEDS_PURCHASE && ! hasRequiredPlan
			? pricingForUi?.discount
			: false;

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <CrmIcon /> }
			isFetching={ isFetching }
			admin={ admin }
			onDeactivate={ deactivate }
			onActivate={ activate }
			slug={ slug }
			onAdd={ useMyJetpackNavigate( '/add-crm' ) }
			onFixConnection={ useMyJetpackNavigate( '/connection' ) }
			onManage={ onManage }
			discount={ discount }
		/>
	);
};

CrmCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default CrmCard;
