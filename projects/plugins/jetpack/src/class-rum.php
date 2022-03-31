<?php
/**
 * RUM class.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

/**
 * RUM class.
 */
class RUM {
	/**
	 * Prevents the RUM from being intialized more then once.
	 *
	 * @var bool
	 */
	private $initalized = false;

	/**
	 * Initialization function.
	 */
	public function init() {
		if ( $this->initalized ) {
			return;
		}
		$this->initalized = true;

		// Collecting RUM performance data
		add_action( 'wp_footer', array( $this, 'jetpack_footer_rum_js' ) );
		add_action( 'admin_footer', array( $this, 'jetpack_footer_rum_js' ) );
	}

	/**
	 * Collect RUM performance data
	 *
	 * @access public
	 */
	public function jetpack_footer_rum_js() {
		// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
		echo "<script defer id='bilmur' data-provider='wordpress.com' data-service='jetpack' src='https://s0.wp.com/wp-content/js/bilmur.min.js'></script>\n";
	}
}
