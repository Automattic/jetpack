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
import { BoostIcon } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const BoostCard = ( { admin } ) => {
	const { status, activate, deactivate, detail, isFetching } = useProduct( 'boost' );
	const { name, description, slug } = detail;
	const navigate = useNavigate();

	const onAddHandler = useCallback( () => {
		navigate( '/add-boost' );
	}, [ navigate ] );

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
			onAdd={ onAddHandler }
			onFixConnection={ useMyJetpackNavigate( '/connection' ) }
		/>
	);
};

BoostCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default BoostCard;
