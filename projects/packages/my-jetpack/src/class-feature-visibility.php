<?php
/**
 * Resolves which items a host keeps off the My Jetpack Features page.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Feature_Policy;

/**
 * The Features page counterpart to the sidebar's `jetpack_admin_menu_visibility`.
 *
 * Display only: forcing a module on or off is `jetpack_active_modules`, which the page
 * already honors by dropping the toggle. `jetpack_feature_policy` feeds that filter, this one,
 * and the sidebar's alike, so one policy covers both surfaces.
 */
class Feature_Visibility {

	/**
	 * Slugs a host has hidden from the page.
	 *
	 * @return string[] Product card and module slugs, in the order the host named them.
	 */
	public static function get_hidden() {
		if ( method_exists( Feature_Policy::class, 'ensure_hooks' ) ) {
			Feature_Policy::ensure_hooks();
		}

		/**
		 * Filters which items appear on the My Jetpack Features page.
		 *
		 * Keys are product or module slugs, and a Features grid entry also answers to its own
		 * slug. 'hidden' keeps the item off the page, search included; anything else lists it.
		 * The whole map is passed so that two mu-plugins setting different keys merge.
		 *
		 * @since 6.6.0
		 *
		 * @param array $states Map of slug to state, empty until a host adds to it.
		 */
		$states = apply_filters( 'jetpack_my_jetpack_feature_visibility', array() );

		if ( ! is_array( $states ) ) {
			return array();
		}

		$hidden = defined( Admin_Menu::class . '::VISIBILITY_HIDDEN' ) ? Admin_Menu::VISIBILITY_HIDDEN : 'hidden';

		return array_keys(
			array_filter(
				$states,
				function ( $state ) use ( $hidden ) {
					return $hidden === $state;
				}
			)
		);
	}
}
