import React from 'react';
import ConnectedPricingTable from '../pricing-table';

/**
 * Intersitial Protect component.
 *
 * @param {object} props                 - Component props
 * @param {Function} props.onScanAdd     - Callback when adding paid protect product successfully
 * @param {Function} props.scanJustAdded - Callback when adding paid protect product was recently added
 * @returns {React.Component}                  Interstitial react component.
 */
const Interstitial = ( { onScanAdd, scanJustAdded } ) => {
	return <ConnectedPricingTable onScanAdd={ onScanAdd } scanJustAdded={ scanJustAdded } />;
};

export default Interstitial;
