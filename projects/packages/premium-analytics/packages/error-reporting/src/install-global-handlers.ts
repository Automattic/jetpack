import { getScriptData } from '@automattic/jetpack-script-data';
import { reportError } from './report-error';

let installed = false;

/**
 * Forwards uncaught errors and unhandled rejections on `window` to the reporter, once per page.
 */
export function installGlobalErrorHandlers(): void {
	if ( installed || ! getScriptData()?.premium_analytics?.error_reporting?.enabled ) {
		return;
	}

	installed = true;

	window.addEventListener( 'error', event => {
		if ( event.error ) {
			reportError( event.error, 'error' );
		}
	} );

	window.addEventListener( 'unhandledrejection', event => {
		const { reason } = event;
		if ( reason instanceof Error && reason.stack ) {
			reportError( reason, 'unhandledrejection' );
		}
	} );
}
