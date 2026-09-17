<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\CSS_Proxy;

class Generator {

	const GENERATE_QUERY_ACTION = 'jb-generate-critical-css';

	public static function init() {
		$generator = new static();
		if ( static::is_generating_critical_css() ) {
			add_action( 'wp_head', array( $generator, 'display_generate_meta' ), 0 );
			add_filter( 'wp_redirect', array( $generator, 'prevent_login_redirect' ), PHP_INT_MAX );
			$generator->force_logged_out_render();
		}
	}

	/**
	 * Force the current page to render as viewed by a logged out user. Useful when generating
	 * Critical CSS.
	 */
	private function force_logged_out_render() {
		$current_user_id = get_current_user_id();

		if ( 0 !== $current_user_id ) {
			// Force current user to 0 to ensure page is rendered as a non-logged-in user.
			wp_set_current_user( 0 );

			// Turn off display of admin bar.
			add_filter( 'show_admin_bar', '__return_false', PHP_INT_MAX );
		}
	}

	/**
	 * Terminate generation requests that redirect to the login page.
	 *
	 * @since $$next-version$$
	 *
	 * @param string|false $location The path or URL to redirect to.
	 * @return string|false
	 */
	public function prevent_login_redirect( $location ) {
		if ( ! is_string( $location ) ) {
			return $location;
		}

		$target = wp_parse_url( $location );
		if ( ! is_array( $target ) || empty( $target['path'] ) ) {
			return $location;
		}

		wp_parse_str( $target['query'] ?? '', $target_query );

		foreach ( array( wp_login_url(), site_url( 'wp-login.php', 'login' ) ) as $login_url ) {
			$login = wp_parse_url( $login_url );
			if ( ! is_array( $login ) || empty( $login['path'] ) ) {
				continue;
			}

			$same_scheme = empty( $target['scheme'] ) || ( isset( $login['scheme'] ) && 0 === strcasecmp( $target['scheme'], $login['scheme'] ) );
			$same_host   = empty( $target['host'] ) || ( isset( $login['host'] ) && 0 === strcasecmp( $target['host'], $login['host'] ) );
			if ( ! $same_scheme || ! $same_host || untrailingslashit( $target['path'] ) !== untrailingslashit( $login['path'] ) ) {
				continue;
			}

			wp_parse_str( $login['query'] ?? '', $login_query );
			foreach ( $login_query as $key => $value ) {
				if ( ! array_key_exists( $key, $target_query ) || $target_query[ $key ] !== $value ) {
					continue 2;
				}
			}

			wp_die(
				esc_html__( 'Critical CSS cannot be generated for a page that requires login.', 'jetpack-boost' ),
				'',
				array( 'response' => 403 )
			);
		}

		return $location;
	}

	/**
	 * Return true if page is loaded to generate critical CSS
	 *
	 * phpcs:disable WordPress.Security.NonceVerification.Recommended
	 */
	public static function is_generating_critical_css() {
		return isset( $_GET[ self::GENERATE_QUERY_ACTION ] );
	}

	/**
	 * Get a Critical CSS status block, adding in local generation nonces (if applicable).
	 * i.e.: Call this method to supply enough Critical CSS status to kick off local generation,
	 * such as in response to a request-generate API call or during page initialization.
	 */
	public function get_generation_metadata() {
		$status = array();

		// Add a user-bound nonce to use when proxying CSS for Critical CSS generation.
		$status['proxy_nonce'] = wp_create_nonce( CSS_Proxy::NONCE_ACTION );

		return $status;
	}

	/**
	 * Renders a <meta> tag used to verify this is a valid page to generate Critical CSS with.
	 */
	public function display_generate_meta() {
		?>
		<meta name="<?php echo esc_attr( self::GENERATE_QUERY_ACTION ); ?>" content="true"/>
		<?php
	}
}
