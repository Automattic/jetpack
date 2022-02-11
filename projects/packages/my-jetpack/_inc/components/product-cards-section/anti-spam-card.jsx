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
import { AntiSpamIcon } from '../icons';

const AntiSpamCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'anti-spam' );
	const { name, description, slug } = detail;

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <AntiSpamIcon /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			slug={ slug }
			onActivate={ activate }
		/>
	);
};

AntiSpamCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default AntiSpamCard;
