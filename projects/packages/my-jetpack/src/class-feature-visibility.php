<?php
/**
 * Resolves which items a host keeps off the My Jetpack Features page.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;

/**
 * The Features page counterpart to the sidebar's `jetpack_admin_menu_visibility`.
 *
 * Display only: forcing a module on or off is `jetpack_active_modules`, which the page
 * already honors by dropping the toggle.
 */
class Feature_Visibility {

	/**
	 * Slugs a host has hidden from the page.
	 *
	 * @return string[] Product card and module slugs, in the order the host named them.
	 */
	public static function get_hidden() {
		/**
		 * Filters which items appear on the My Jetpack Features page.
		 *
		 * Keys are product card or module slugs. 'hidden' keeps the item off the page, including
		 * its search results; 'default', or leaving the item out, lists it as usual. The whole
		 * map is passed so that two mu-plugins setting different keys merge rather than clobber.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $states Map of slug to state, empty until a host adds to it.
		 */
		$states = apply_filters( 'jetpack_my_jetpack_feature_visibility', array() );

		if ( ! is_array( $states ) ) {
			return array();
		}

		return array_keys(
			array_filter(
				$states,
				function ( $state ) {
					return Admin_Menu::VISIBILITY_HIDDEN === $state;
				}
			)
		);
	}
}
