<?php
/**
 * Load block patterns from the API.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Hide Jetpack form patterns.
 * The reason is to show only the Dotcom pattern library.
 */
function wpcom_unregister_jetpack_patterns() {
	// @TODO: It would be better to add 'source: jetpack' when registering them in https://github.com/Automattic/jetpack/blob/3c4c16b8e9b34c8b6e798839ddf029a5c9a59e77/projects/plugins/jetpack/modules/contact-form.php#L152
	// and then here just filter them by source rather than by name.
	$pattern_names = array(
		'contact-form',
		'newsletter-form',
		'rsvp-form',
		'registration-form',
		'appointment-form',
		'feedback-form',
	);
	foreach ( $pattern_names as $pattern_name ) {
		$pattern = \WP_Block_Patterns_Registry::get_instance()->get_registered( $pattern_name );
		if ( $pattern ) {
			unregister_block_pattern( $pattern_name );
		}
	}
}

/**
 * Return a function that loads and register block patterns from the API. This
 * function can be registered to the `rest_dispatch_request` filter.
 *
 * @param callable $register_patterns_func A function that when called will
 * register the relevant block patterns in the registry.
 */
function register_patterns_on_api_request( $register_patterns_func ) {
	/**
	 * Load editing toolkit block patterns from the API.
	 *
	 * It will only register the patterns for certain allowed requests and
	 * return early otherwise.
	 *
	 * @param mixed           $response
	 * @param WP_REST_Request $request
	 */
	return function ( $response, $request ) use ( $register_patterns_func ) {
		/**
		 * Do nothing if it is loaded in the ETK.
		 */
		if ( class_exists( 'A8C\FSE\Block_Patterns_From_API' ) ) {
			return $response;
		}

		$route = $request->get_route();
		// Matches either /wp/v2/sites/123/block-patterns/patterns or /wp/v2/block-patterns/patterns
		// to handle the API format of both WordPress.com and WordPress core.
		$request_allowed = preg_match( '/^\/wp\/v2\/(sites\/[0-9]+\/)?block\-patterns\/(patterns|categories)$/', $route );

		if ( ! $request_allowed || ! apply_filters( 'a8c_enable_block_patterns_api', false ) ) {
			return $response;
		}

		$register_patterns_func();

		wpcom_unregister_jetpack_patterns();

		return $response;
	};
}
add_filter(
	'rest_dispatch_request',
	register_patterns_on_api_request(
		function () {
			require_once __DIR__ . '/class-wpcom-block-patterns-from-api.php';
			( new Wpcom_Block_Patterns_From_Api() )->register_patterns();
		}
	),
	11,
	2
);

/**
 * Hide patterns bundled in core and from the Dotorg pattern directory.
 * The reason is to show only the Dotcom pattern library.
 */
function wpcom_unregister_core_block_patterns() {
	remove_theme_support( 'core-block-patterns' );
}

add_action( 'after_setup_theme', 'wpcom_unregister_core_block_patterns' );
