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

export const VideopressIcon = () => (
	<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect
			x="0.75"
			y="0.75"
			width="16.5"
			height="16.5"
			rx="1.53571"
			stroke="#1E1E1E"
			strokeWidth="1.5"
		/>
		<path d="M7 12V6L12 9L7 12Z" fill="#1E1E1E" />
	</svg>
);

const VideopressCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'videopress' );
	const { name, description, slug } = detail;

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <VideopressIcon /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			onActivate={ activate }
			slug={ slug }
		/>
	);
};

VideopressCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default VideopressCard;
