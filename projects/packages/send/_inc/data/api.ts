import { getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import type { LogEntry, LogPage, SendStatus, TestResult, Usage } from './types';

export const STATUS_PATH = '/jetpack-send/v1/status';

export type SendAction = 'setup' | 'check-dns' | 'settings' | 'reset';

type SendScriptData = { send?: { preload?: Record< string, unknown > } };

// Every route bundles this module; the first consumes the preload so later routes can't replay stale data.
const scriptData = getScriptData() as unknown as SendScriptData | undefined;
if ( scriptData?.send?.preload ) {
	apiFetch.use( apiFetch.createPreloadingMiddleware( scriptData.send.preload ) );
	delete scriptData.send.preload;
}

export const fetchStatus = () => apiFetch< SendStatus >( { path: STATUS_PATH } );

export const postAction = ( action: SendAction, data?: Record< string, unknown > ) =>
	apiFetch< SendStatus >( { path: `/jetpack-send/v1/${ action }`, method: 'POST', data } );

export const sendTest = ( to: string ) =>
	apiFetch< TestResult >( { path: '/jetpack-send/v1/test', method: 'POST', data: { to } } );

export const fetchUsage = () => apiFetch< Usage >( { path: '/jetpack-send/v1/usage' } );

export const fetchLog = ( page: number, perPage: number, status: string ) =>
	apiFetch< LogPage >( {
		path: addQueryArgs( '/jetpack-send/v1/log', { page, per_page: perPage, status } ),
	} );

export const fetchLogEntry = ( id: string ) =>
	apiFetch< LogEntry >( { path: `/jetpack-send/v1/log/${ encodeURIComponent( id ) }` } );

/**
 * A readable message from an apiFetch rejection.
 *
 * @param error - The rejection.
 * @return The message.
 */
export function errorMessage( error: unknown ): string {
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		return error.message;
	}
	return __( 'Something went wrong. Please try again.', 'jetpack-send-pkg' );
}
