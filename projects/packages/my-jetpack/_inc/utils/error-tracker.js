/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';

/**
 * Initialize JPJSErrorTracker for error monitoring
 */
export function initializeErrorTracker() {
	if ( typeof window.JPJSErrorTracker === 'function' ) {
		window.myJetpackErrorTracker = new window.JPJSErrorTracker( error => {
			// Add My Jetpack context to errors
			error.context = 'my-jetpack';
			error.route = window.location.hash;

			// Send to Jetpack Analytics
			try {
				// Prepare error data for analytics
				const errorProperties = {
					error_message: error.message ? error.message.substring( 0, 100 ) : 'No message',
					error_filename: error.filename || 'unknown',
					error_lineno: error.lineno || 0,
					error_colno: error.colno || 0,
					error_route: error.route || window.location.hash || 'none',
					error_user_agent: navigator.userAgent.substring( 0, 100 ),
					error_viewport_width: window.innerWidth,
					error_viewport_height: window.innerHeight,
				};

				// Record error event
				jetpackAnalytics.tracks.recordEvent( 'jetpack_my_jetpack_js_error', errorProperties );
			} catch ( analyticsError ) {
				// eslint-disable-next-line no-console
				console.error( 'Failed to send error to analytics:', analyticsError );
			}
		} );
	}
}
