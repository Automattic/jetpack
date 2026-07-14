import * as Sentry from '@sentry/browser';
import { addAction } from '@wordpress/hooks';

const shouldActivateSentry = window.WPcom_Error_Reporting_Config?.shouldActivateSentry === 'true';

/**
 * Errors that happened before this script had a chance to load are captured in a global array.
 *
 * See `./error-reporting.php`.
 */
const headErrors = window._jsErr || [];
const headErrorHandler = window._headJsErrorHandler;

/**
 * Activate Sentry.
 */
function activateSentry() {
	const SENTRY_RELEASE_NAME = window.WPcom_Error_Reporting_Config.releaseName;

	Sentry.init( {
		dsn: 'https://658ae291b00242148af6b76494d4a49a@o248881.ingest.sentry.io/5876245',
		release: SENTRY_RELEASE_NAME,
	} );

	// Capture exceptions from Gutenberg React Error Boundaries.
	addAction( 'editor.ErrorBoundary.errorLogged', 'wpcom/error-reporting', error => {
		// error is the exception's error object
		Sentry.captureException( error );
	} );

	// We still need to report the head errors, if any.
	headErrors.forEach( error => Sentry.captureException( error ) );
	Sentry.flush().then( () => delete window._jsErr );
}

/**
 * Activate the WP.com Logstash error-reporting.
 */
function activateLogstash() {
	const JS_ERROR_ENDPOINT = 'https://public-api.wordpress.com/rest/v1.1/js-error';

	const reportError = ( { error } ) => {
		// Sanitized error event objects do not include a nested error attribute. In
		// that case, we return early to prevent a needless TypeError when defining
		// `data`, below. Also, sanitized errors don't include any useful information,
		// so the sensible thing to do is to completely ignore them.
		if ( ! error ) {
			return;
		}

		const data = {
			message: error.message,
			trace: error.stack,
			url: document.location.href,
			feature: 'wp-admin',
		};

		// Send as direct `fetch` request with `x-www-form-urlencoded` content type and no extra
		// headers like `X-WP-Nonce`. Prevents triggering a preflight request.
		return (
			window
				.fetch( JS_ERROR_ENDPOINT, {
					method: 'POST',
					body: new URLSearchParams( { error: JSON.stringify( data ) } ),
				} )
				// eslint-disable-next-line no-console
				.catch( err => console.error( 'Error: Unable to record the error in Logstash.', err ) )
		);
	};

	window.addEventListener( 'error', reportError );

	// We still need to report the head errors, if any.
	Promise.allSettled( headErrors.map( reportError ) ).then( () => delete window._jsErr );
}

if ( shouldActivateSentry ) {
	activateSentry();
} else {
	activateLogstash();
}

// Remove the head handler as it's not needed anymore after we set the main one above (either Sentry or homebrew)
window.removeEventListener( 'error', headErrorHandler );
delete window._headJsErrorHandler;
