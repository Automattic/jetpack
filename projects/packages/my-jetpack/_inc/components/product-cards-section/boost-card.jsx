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
import { BoostIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const BoostCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching, hasRequiredPlan } = useProduct(
		'boost'
	);
	const { name, description, slug, manageUrl, pricingForUi } = detail;
	const onManage = useCallback( () => {
		window.location = manageUrl;
	}, [ manageUrl ] );

	const { isFree } = pricingForUi;

	const discount =
		status === PRODUCT_STATUSES.NEEDS_PURCHASE && ! hasRequiredPlan
			? pricingForUi?.discount
			: false;

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <BoostIcon /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			onActivate={ activate }
			slug={ slug }
			onAdd={ useMyJetpackNavigate( '/add-boost' ) }
			onFixConnection={ useMyJetpackNavigate( '/connection' ) }
			onManage={ onManage }
			discount={ discount }
			isFree={ isFree }
		/>
	);
};

BoostCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default BoostCard;
