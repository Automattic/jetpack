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

const BoostIcon = () => (
	<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M7 1.5L12 7L7 12.5M1 1.5L6 7L1 12.5" stroke="#1E1E1E" strokeWidth="1.5" />
	</svg>
);

const BoostCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'boost' );
	const { name, description } = detail;

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
		/>
	);
};

BoostCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default BoostCard;
