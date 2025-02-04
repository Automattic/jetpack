import { store as coreStore } from '@wordpress/core-data';
import { SHOW_PRICING_PAGE_KEY } from '../constants';

/**
 * Sets the Show Pricing Page enabled status.
 *
 * @param  isEnabled - The new enabled status.
 * @return {Function} A thunk.
 */
export function setShowPricingPage( isEnabled: boolean ) {
	return async function ( { registry } ) {
		const { saveSite } = registry.dispatch( coreStore );

		await saveSite( { [ SHOW_PRICING_PAGE_KEY ]: isEnabled } );
	};
}
