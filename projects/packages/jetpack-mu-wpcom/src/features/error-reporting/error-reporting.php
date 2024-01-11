<?php
/**
 * Error reporting from wp-admin / Gutenberg context for Simple Sites and WoA.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Whether the site is eligible for Error Reporting, which is a feature that's specific to WPCOM.
 *
 * By default, sites should not be eligible.
 *
 * @return bool True if current site is eligible for error reporting, false otherwise.
 */
function wpcom_is_site_eligible_for_error_reporting() {
	/**
	 * Can be used to toggle the Error Reporting functionality.
	 *
	 * @param bool true if Error Reporting should be enabled, false otherwise.
	 */
	return apply_filters( 'a8c_enable_error_reporting', false );
}

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
 * Temporary function to feature flag Sentry by segment.
 *
 * We'll be testing it on production (simple sites) for a while to see if it's feasible to
 * activate it for all sites and perhaps get rid of our custom solution. If it works well,
 * we'll activate for all simple sites and look into activating it for WoA, too.
 *
 * @param int $user_id The user id.
 * @return bool
 */
function wpcom_user_in_sentry_test_segment( $user_id ) {
	$current_segment = 10; // Segment of existing users that will get this feature in %.
	$user_segment    = $user_id % 100;

	/*
	 * We get the last two digits of the user id and that will be used to decide in what
	 * segment the user is. i.e if current_segment is 10, then only ids that end in < 10
	 * will be considered part of the segment.
	 */
	return $user_segment < $current_segment;
}

/**
 * Return whether Sentry should be activated for a given user.
 *
 * In this phase, a12s have the possibility of configuring what error reporter to use
 * through the sticker. a12s should not be covered by the segment logic.
 *
 * Regular users have the error reporter chosen based on the segmentation logic, only.
 *
 * @param int $user_id The user id. Used to check if the user is A8C or in the Sentry test segment.
 * @param int $blog_id The blog ID. Usually the value of `get_current_blog_id`. Used to check if the sticker is applied if user is A8C.
 */
function wpcom_should_activate_sentry( $user_id, $blog_id ) {
	return ( is_automattician( $user_id ) && has_blog_sticker( 'error-reporting-use-sentry', $blog_id ) )
		|| ( ! is_automattician( $user_id ) && wpcom_user_in_sentry_test_segment( $user_id ) );
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
	$script_dependencies = isset( $asset_file['dependencies'] ) ? $asset_file['dependencies'] : array();
	$script_version      = isset( $asset_file['version'] ) ? $asset_file['version'] : filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/error-reporting/error-reporting.js' );
	$script_id           = 'wpcom-error-reporting-script';

	wp_enqueue_script(
		$script_id,
		plugins_url( 'build/error-reporting/error-reporting.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$script_dependencies,
		$script_version,
		true
	);

	wp_localize_script(
		$script_id,
		'WPcom_Error_Reporting_Config',
		array(
			'shouldActivateSentry' => wpcom_should_activate_sentry( get_current_user_id(), get_current_blog_id() ) ? 'true' : 'false',
			'releaseName'          => defined( 'WPCOM_DEPLOYED_GIT_HASH' ) ? 'WPCOM_' . WPCOM_DEPLOYED_GIT_HASH : 'WPCOM_NO_RELEASE',
		)
	);
}

if ( wpcom_is_site_eligible_for_error_reporting() ) {
	add_action( 'admin_print_scripts', 'wpcom_head_error_handler', 0 );
	add_filter( 'script_loader_tag', 'wpcom_add_crossorigin_to_script_elements', 99, 2 );

	// We load as last as possible for performance reasons. The head handler will capture errors until the main handler is loaded.
	add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_error_reporting_script', 100 );
}
