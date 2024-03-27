<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\CSS_Proxy;

class Generator {

	const GENERATE_QUERY_ACTION = 'jb-generate-critical-css';

	public static function init() {
		$generator = new static();
		if ( static::is_generating_critical_css() ) {
			add_action( 'wp_head', array( $generator, 'display_generate_meta' ), 0 );
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
