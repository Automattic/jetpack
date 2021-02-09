<?php
/**
 * Module Name: Cloudflare Analytics
 * Module Description: Let WPCOM users automatically insert a Cloudflare analytics JS snippet into their site header.
 * Requires Connection: Yes
 * Auto Activate: No
 *
 * @package automattic/jetpack
 */

/**
 * Bail if accessed directly
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * WP_Cloudflare_Analytics class.
 */
class WP_Cloudflare_Analytics {

	/**
	 * Manages the insertion of Cloudflare analytics snippets into a user's
	 * site <head>.
	 *
	 * @var WP_Cloudflare_Analytics Static property to hold our singleton instance
	 */
	private static $instance = false;

	/**
	 * Constructor method
	 * Causes Cloudflare JS snippet to be included during head rendering.
	 */
	public function __construct() {
		add_action( 'wp_head', array( $this, 'insert_code' ), 999 );
	}

	/**
	 * Function to instantiate our class and make it a singleton
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * This injects Cloudflare analytics code into the footer of the page.
	 * Called exclusively by wp_head action
	 */
	public function insert_code() {
		$option      = get_option( 'cloudflare_analytics' );
		$tracking_id = isset( $option['code'] ) ? $option['code'] : '';
		if ( empty( $tracking_id ) ) {
			echo "<!-- Your Cloudflare Analytics Plugin is missing the tracking ID -->\r\n";
			return;
		}

		// If we're in the admin_area, return without inserting code.
		if ( is_admin() ) {
			return;
		}

		$this->render_code( $tracking_id );
	}

	/**
	 * Renders Cloudflare analytics code snippet.
	 *
	 * @param string $tracking_id Cloudflare Analytics tracking ID.
	 */
	private function render_code( $tracking_id ) {
		printf(
			"<!-- Cloudflare Web Analytics -->
            <script defer
                src='https://static.cloudflareinsights.com/beacon.min.js'
                data-cf-beacon='{\"token\": \"%s\"}'>
            </script>
            <!-- End Cloudflare Web Analytics -->\r\n",
			esc_html( $tracking_id )
		);
	}
}
