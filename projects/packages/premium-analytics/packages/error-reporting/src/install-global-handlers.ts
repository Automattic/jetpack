import { getScriptData } from '@automattic/jetpack-script-data';
import { isChunkLoadError } from './chunk-recovery';
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
		if ( ! ( reason instanceof Error ) ) {
			return;
		}

		// Firefox rejects a failed dynamic import with no stack at all. The reporter attributes
		// that one by the module its message names, so it must not be dropped for want of one.
		if ( reason.stack || isChunkLoadError( reason.message, reason.name ) ) {
			reportError( reason, 'unhandledrejection' );
		}
	} );
}
