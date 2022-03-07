/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import ProductCard from '../product-card';
import { useProduct } from '../../hooks/use-product';
import { getIconBySlug } from '../icons';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';

const ConnectedProductCard = ( { admin, slug, showDeactivate } ) => {
	const { detail, status, activate, deactivate, isFetching } = useProduct( slug );
	const { name, description, manageUrl } = detail;

	const navigateToConnectionPage = useMyJetpackNavigate( '/connection' );
	const navigateToAddProductPage = useMyJetpackNavigate( `add-${ slug }` );

	/*
	 * Redirect to manage URL
	 */
	const onManage = useCallback( () => {
		window.location = manageUrl;
	}, [ manageUrl ] );

	const Icon = getIconBySlug( slug );

	return (
		<ProductCard
			name={ name }
			description={ description }
			status={ status }
			icon={ <Icon /> }
			admin={ admin }
			isFetching={ isFetching }
			onDeactivate={ deactivate }
			slug={ slug }
			onActivate={ activate }
			onAdd={ navigateToAddProductPage }
			onFixConnection={ navigateToConnectionPage }
			onManage={ onManage }
			showDeactivate={ showDeactivate }
		/>
	);
};

ConnectedProductCard.propTypes = {
	admin: PropTypes.bool.isRequired,
	onLearn: PropTypes.func,
	slug: PropTypes.string.isRequired,
	showDeactivate: PropTypes.bool,
};
ConnectedProductCard.defaultProps = {
	onLearn: () => {},
	showDeactivate: true,
};

export default ConnectedProductCard;
