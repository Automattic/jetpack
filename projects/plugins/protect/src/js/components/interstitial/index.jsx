/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Dialog } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import ConnectedProductOffer from '../product-offer';

/**
 * Intersitial Protect component.
 *
 * @param {object} props                - Component props.
 * @param {Function} props.isFetching   - Whether there is a fetching in progress
 * @param {Function} props.onProtectAdd - Callback to bind when adding the product.
 * @returns {React.Component}             Interstitial react component.
 */
const Interstitial = ( { onProtectAdd, isFetching } ) => {
	return (
		<Dialog primary={ <ConnectedProductOffer onAdd={ onProtectAdd } isLoading={ isFetching } /> } />
	);
};
Interstitial.propTypes = {
	/** Callback function to bind when adding the product. */
	onProtectAdd: PropTypes.func,

	/** Whether there is a fetching in progress */
	isFetching: PropTypes.bool,
};

Interstitial.defaultProps = {
	onProtectAdd: () => {},
	isFetching: false,
};

export default Interstitial;
