<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;

use Automattic\Jetpack\Forms\ContactForm\Util;

/**
 * Understands the Jetpack Forms package.
 */
class Jetpack_Forms {

	const PACKAGE_VERSION = '0.3.0-alpha';

	/**
	 * Load the contact form module.
	 */
	public static function load_contact_form() {
		Util::init();

		if ( is_admin() && apply_filters( 'tmp_grunion_allow_editor_view', true ) ) {
			add_action( 'current_screen', '\Automattic\Jetpack\Forms\ContactForm\Editor_View::add_hooks' );
		}

		add_action( 'init', '\Automattic\Jetpack\Forms\ContactForm\Util::register_pattern' );
	}

	/**
	 * Get the plugin URL.
	 */
	public static function plugin_url() {
		return plugin_dir_url( __FILE__ );
	}
}
