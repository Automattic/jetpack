/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import { CrmIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const CrmCard = ( { admin } ) => {
	return (
		<ProductCard
			admin={ admin }
			icon={ <CrmIcon /> }
			onAdd={ useMyJetpackNavigate( '/add-crm' ) }
			slug="crm"
		/>
	);
};

CrmCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default CrmCard;
