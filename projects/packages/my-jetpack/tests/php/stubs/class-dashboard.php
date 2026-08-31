<?php
/**
 * Test stub for the Forms package Dashboard.
 *
 * The my-jetpack package does not depend on jetpack-forms, so this stub lets us
 * verify that Jetpack_Forms::get_manage_url() defers to the canonical helper when
 * the Forms package is present at runtime (as it is inside the Jetpack plugin).
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\Forms\Dashboard;

if ( ! class_exists( __NAMESPACE__ . '\Dashboard' ) ) {
	/**
	 * Minimal stub exposing get_forms_admin_url().
	 */
	class Dashboard {
		/**
		 * Return a canonical Forms admin URL.
		 *
		 * @return string
		 */
		public static function get_forms_admin_url() {
			return 'https://example.org/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin';
		}
	}
}
