import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { MESSAGE_TEMPLATE_KEY, OPEN_GRAPH_SETTINGS_KEY, SHOW_PRICING_PAGE_KEY } from '../constants';
import { OpenGraphSettingsConfig } from '../types';

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
		const { getLastEntitySaveError } = registry.select( coreStore );
		const { createErrorNotice } = registry.dispatch( noticesStore );

		await saveSite( { [ MESSAGE_TEMPLATE_KEY ]: value } );

		const lastError = getLastEntitySaveError( 'root', 'site' );
		if ( lastError ) {
			let message: string = __(
				'There was an error saving the default share message.',
				'jetpack-publicize-pkg'
			);
			if ( lastError?.message ) {
				message += ' ' + lastError.message;
			}
			createErrorNotice( message, { type: 'snackbar' } );
		}
	};
}

/**
 * Saves the default Open Graph image settings.
 *
 * @param  data - The Open Graph settings to save.
 * @return {Function} A thunk.
 */
export function updateOpenGraphSettings( data: Partial< OpenGraphSettingsConfig > ) {
	return async function ( { registry } ) {
		const { saveSite } = registry.dispatch( coreStore );
		const { getLastEntitySaveError } = registry.select( coreStore );
		const { createErrorNotice } = registry.dispatch( noticesStore );

		await saveSite( { [ OPEN_GRAPH_SETTINGS_KEY ]: data } );

		const lastError = getLastEntitySaveError( 'root', 'site' );
		if ( lastError ) {
			let message: string = __(
				'There was an error saving the default social image.',
				'jetpack-publicize-pkg'
			);
			if ( lastError?.message ) {
				message += ' ' + lastError.message;
			}
			createErrorNotice( message, { type: 'snackbar' } );
		}
	};
}
