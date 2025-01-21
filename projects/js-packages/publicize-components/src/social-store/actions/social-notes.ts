import { store as coreStore } from '@wordpress/core-data';
import { SOCIAL_NOTES_CONFIG_KEY, SOCIAL_NOTES_ENABLED_KEY } from '../constants';
import { SocialNotesConfig } from '../types';

/**
 * Sets the Social Notes enabled status.
 *
 * @param  isEnabled - The new enabled status.
 *
 * @return {Function} A thunk.
 */
export function toggleSocialNotes( isEnabled: boolean ) {
	return async function ( { registry } ) {
		const { saveSite } = registry.dispatch( coreStore );

		await saveSite( { [ SOCIAL_NOTES_ENABLED_KEY ]: isEnabled } );
	};
}

/**
 * Updates the Social Notes Config
 *
 * @param {Partial< SocialNotesConfig >} data - The data to save.
 *
 * @return {Function} A thunk.
 */
export function updateSocialNotesConfig( data: Partial< SocialNotesConfig > ) {
	return async function ( { registry } ) {
		const { saveSite } = registry.dispatch( coreStore );

		await saveSite( { [ SOCIAL_NOTES_CONFIG_KEY ]: data } );
	};
}
