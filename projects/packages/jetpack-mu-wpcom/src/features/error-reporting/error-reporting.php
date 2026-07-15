<?php
/**
 * Error reporting from wp-admin / Gutenberg context for Simple Sites and WoA.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Inline  error handler that will capture errors before the main handler has a chance to.
 *
 * Errors are pushed to a global array called `_jsErr` which is then verified in the main handler.
 *
 * @see index.js
 */
function wpcom_head_error_handler() {
	?><script type="text/javascript">
		window._headJsErrorHandler = function( errEvent ) {
			window._jsErr = window._jsErr || [];
			window._jsErr.push( errEvent );
		}
		window.addEventListener( 'error', window._headJsErrorHandler );
	</script>
	<?php
}

/**
 * Limit the attribute to script elements that point to scripts served from s0.wp.com.
 *
 * We might want to add stats.wp.com and widgets.wp.com here, too. See https://wp.me/pMz3w-cCq#comment-86959.
 * "Staticized" (aka minified or concatenaded) scripts don't go through this pipeline, so they are not processed
 * by this filter. The attribute is added to those directly in jsconcat, see D57238-code.
 *
 * @param string $tag String containing the def of a script tag.
 */
function wpcom_add_crossorigin_to_script_elements( $tag ) {
	$end_of_tag = strpos( $tag, '>' );
	if ( false === $end_of_tag ) {
		return $tag;
	}

	/*
	 * Get JUST the <script ...> tag, not anything else. $tag can include the content of the script as well.
	 * Assumes that $tag begins with <script..., which does seem to be the case in our testing.
	 */
	$script_tag = substr( $tag, 0, $end_of_tag + 1 );

	// If the src of that script tag points to an internal domain, set crossorigin=anonymous.
	if ( preg_match( '/<script.*src=.*(s0\.wp\.com|stats\.wp\.com|widgets\.wp\.com).*>/', $script_tag ) ) { // phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript
		// Update the src of the <script...> tag.
		$new_tag = str_replace( ' src=', " crossorigin='anonymous' src=", $script_tag );

		// Then, find the original script_tag within the ENTIRE $tag, and replace it with the updated version. Now the script includes crossorigin=anonymous.
		return str_replace( $script_tag, $new_tag, $tag );
	}

	return $tag;
}

/**
 * Enqueue assets
 */
function wpcom_enqueue_error_reporting_script() {
	// Bail if ETK has enqueued its script.
	if ( wp_script_is( 'a8c-fse-error-reporting-script' ) ) {
		return;
	}

	$asset_file          = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/error-reporting/error-reporting.asset.php';
	$script_dependencies = $asset_file['dependencies'] ?? array();
	$script_version      = $asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/error-reporting/error-reporting.js' );
	$script_id           = 'wpcom-error-reporting-script';

	wp_enqueue_script(
		$script_id,
		plugins_url( 'build/error-reporting/error-reporting.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$script_dependencies,
		$script_version,
		true
	);

	/**
	 * Filter to enable Sentry error reporting.
	 *
	 * @param bool $enabled Whether Sentry should be activated.
	 */
	$activate_sentry = apply_filters( 'a8c_enable_sentry_error_reporting', false );

	wp_localize_script(
		$script_id,
		'WPcom_Error_Reporting_Config',
		array(
			'shouldActivateSentry' => $activate_sentry ? 'true' : 'false',
			'releaseName'          => defined( 'WPCOM_DEPLOYED_GIT_HASH' ) ? 'WPCOM_' . WPCOM_DEPLOYED_GIT_HASH : 'WPCOM_NO_RELEASE',
		)
	);
}

/**
 * Can be used to toggle the Error Reporting functionality.
 *
 * @param bool true if Error Reporting should be enabled, false otherwise.
 */
if ( apply_filters( 'a8c_enable_error_reporting', false ) ) {
	add_action( 'admin_print_scripts', 'wpcom_head_error_handler', 0 );
	add_filter( 'script_loader_tag', 'wpcom_add_crossorigin_to_script_elements', 99, 2 );

	// We load as last as possible for performance reasons. The head handler will capture errors until the main handler is loaded.
	add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_error_reporting_script', 100 );
}
