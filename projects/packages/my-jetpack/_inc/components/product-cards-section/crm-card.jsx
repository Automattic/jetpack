/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import { useProduct } from '../../hooks/use-product';
import { CrmIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const CrmCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'crm' );
	const { name, description, slug } = detail;

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
		/>
	);
};

CrmCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default CrmCard;
