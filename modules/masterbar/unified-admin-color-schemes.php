<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Unifies admin color scheme selection across WP.com sites.
 */
class A8C_WPCOM_Unified_Admin_Color_Schemes {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'admin_init', array( $this, 'init' ) );
	}

	public function init() {
		// Start here
	}
}
