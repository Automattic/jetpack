/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import { useProduct } from '../../hooks/use-product';
import { ScanIcon } from '../icons';

const ScanCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'scan' );
	const { name, description, slug } = detail;
	const navigate = useNavigate();

	const onAddHandler = useCallback( () => {
		navigate( '/add-scan' );
	}, [ navigate ] );

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
			onAdd={ onAddHandler }
			showDeactivate={ false }
		/>
	);
};

ScanCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default ScanCard;
