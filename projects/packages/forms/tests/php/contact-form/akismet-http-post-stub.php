<?php
/**
 * Global stub for Akismet's HTTP client, so the contact form's Akismet check is reachable
 * without the plugin. Defining AKISMET_VERSION instead would be permanent and would change
 * what every later test stores on a feedback post.
 *
 * @package automattic/jetpack-forms
 */

if ( ! function_exists( 'akismet_http_post' ) ) {
	/**
	 * Stand in for Akismet's comment-check call.
	 *
	 * @param string $request Query string of the values being checked.
	 * @param string $host    API host.
	 * @param string $path    API path.
	 * @param string $port    API port.
	 *
	 * @return array Akismet-shaped response: response headers, then the body.
	 */
	function akismet_http_post( $request, $host, $path, $port = 80 ) { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound -- Akismet owns this name.
		/**
		 * Test-only filter letting each test decide what Akismet answered.
		 *
		 * @param array  $response Akismet-shaped response.
		 * @param string $request  Query string of the values being checked.
		 * @param string $host     API host.
		 * @param string $path     API path.
		 * @param string $port     API port.
		 */
		return apply_filters( 'jetpack_forms_test_akismet_response', array( array(), 'false' ), $request, $host, $path, $port );
	}
}
