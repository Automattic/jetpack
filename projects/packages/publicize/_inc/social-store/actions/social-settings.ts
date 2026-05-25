import { store as coreStore } from '@wordpress/core-data';
import { MESSAGE_TEMPLATE_KEY, SHOW_PRICING_PAGE_KEY } from '../constants';

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

/**
 * Saves the global message template.
 *
 * @param  value - The new template string. Empty string is allowed and clears the user-set value.
 * @return {Function} A thunk.
 */
export function setMessageTemplate( value: string ) {
	return async function ( { registry } ) {
		const { saveSite } = registry.dispatch( coreStore );

		await saveSite( { [ MESSAGE_TEMPLATE_KEY ]: value } );
	};
}
