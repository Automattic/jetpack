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
 * @param {Function} props.onProtectAdd - Callback to bind when adding the product.
 * @returns {React.Component}             Interstitial react component.
 */
const Interstitial = ( { onProtectAdd } ) => {
	return <Dialog primary={ <ConnectedProductOffer onAdd={ onProtectAdd } /> } />;
};
Interstitial.propTypes = {
	onAdd: PropTypes.func,
};

Interstitial.defaultProps = {
	/** Callback function to bind when adding the product. */
	onProtectAdd: () => {},
};

export default Interstitial;
