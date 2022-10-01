import React from 'react';
import ConnectedPricingTable from '../pricing-table';

/**
 * Intersitial Protect component.
 *
 * @param {object} props                     - Component props
 * @param {Function} props.onSecurityAdd     - Callback when adding paid protect product successfully
 * @param {Function} props.securityJustAdded - Callback when adding paid protect product was recently added
 * @returns {React.Component}                  Interstitial react component.
 */
const Interstitial = ( { onSecurityAdd, securityJustAdded } ) => {
	return (
		<ConnectedPricingTable
			onSecurityAdd={ onSecurityAdd }
			securityJustAdded={ securityJustAdded }
		/>
	);
};

export default Interstitial;
