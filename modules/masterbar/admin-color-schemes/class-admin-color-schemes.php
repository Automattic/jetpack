<?php
/**
 * Unifies admin color scheme selection across WP.com sites.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

/**
 * Unifies admin color scheme selection across WP.com sites.
 */
class Admin_Color_Schemes {

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'admin_init', array( $this, 'init' ) );
	}

	/**
	 * Init.
	 */
	public function init() {
		// Start here.
	}
}
