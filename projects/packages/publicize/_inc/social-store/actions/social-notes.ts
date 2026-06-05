import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { SOCIAL_NOTES_CONFIG_KEY, SOCIAL_NOTES_ENABLED_KEY } from '../constants';
import { SocialNotesConfig } from '../types';
import type { store } from '../index';
import type { ThunkArgs } from '@wordpress/data';

/**
 * Surfaces an error notice if the most recent site save failed.
 *
 * @param registry - The data registry passed to the thunk.
 * @param message  - The user-facing error message to show on failure.
 */
function noticeOnSaveError( registry, message: string ) {
	const lastError = registry.select( coreStore ).getLastEntitySaveError( 'root', 'site' );
	if ( lastError ) {
		const { createErrorNotice } = registry.dispatch( noticesStore );
		createErrorNotice( lastError?.message ? `${ message } ${ lastError.message }` : message, {
			type: 'snackbar',
		} );
	}
}

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

		noticeOnSaveError(
			registry,
			__( 'There was an error saving the Social Notes setting.', 'jetpack-publicize-pkg' )
		);
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
	return async function ( { registry, select }: ThunkArgs< typeof store > ) {
		const prevConfig = select.getSocialSettings().socialNotes.config;

		const { saveSite } = registry.dispatch( coreStore );

		await saveSite( { [ SOCIAL_NOTES_CONFIG_KEY ]: { ...prevConfig, ...data } } );

		noticeOnSaveError(
			registry,
			__( 'There was an error saving the Social Notes settings.', 'jetpack-publicize-pkg' )
		);
	};
}
