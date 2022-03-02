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
import { ScanIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const ScanCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching, hasRequiredPlan } = useProduct(
		'scan'
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
			icon={ <ScanIcon /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			slug={ slug }
			onActivate={ activate }
			onAdd={ useMyJetpackNavigate( '/add-scan' ) }
			showDeactivate={ false }
			onFixConnection={ useMyJetpackNavigate( '/connection' ) }
			onManage={ onManage }
			discount={ discount }
			isFree={ isFree }
		/>
	);
};

ScanCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ScanCard;
