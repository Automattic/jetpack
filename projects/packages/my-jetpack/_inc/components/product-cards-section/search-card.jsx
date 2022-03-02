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
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import { SearchIcon } from '../icons';

const SearchCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching, hasRequiredPlan } = useProduct(
		'search'
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
			icon={ <SearchIcon /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			onActivate={ activate }
			onAdd={ useMyJetpackNavigate( '/add-search' ) }
			onFixConnection={ useMyJetpackNavigate( '/connection' ) }
			onManage={ onManage }
			slug={ slug }
			discount={ discount }
			isFree={ isFree }
		/>
	);
};

SearchCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default SearchCard;
