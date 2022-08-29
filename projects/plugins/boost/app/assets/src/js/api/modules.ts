import { __, sprintf } from '@wordpress/i18n';
import api from './api';

export async function setModuleState( name: string, status: boolean ): Promise< boolean > {
	const response = await api.post< boolean >( `/module/${ name }/status`, {
		status,
	} );

	// We're expecting a boolean to be returned.
	if ( true !== response && false !== response ) {
		const errorString = JSON.stringify( response );
		throw new Error(
			sprintf(
				/* translators: %s refers to the error message. */
				__( 'Unexpected data received from WordPress: %s', 'jetpack-boost' ),
				errorString
			)
		);
	}

	// Catch race conditions
	// If 2 instances are trying to update at almost the same time.
	// Silently fall back to previous status.
	if ( response !== status ) {
		return ! status;
	}

	return response;
}
