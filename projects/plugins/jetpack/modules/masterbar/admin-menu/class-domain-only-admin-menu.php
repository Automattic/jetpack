<?php
/**
 * Domain-only sites Admin Menu file.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require_once __DIR__ . '/class-base-admin-menu.php';

/**
 * Class Domain_Only_Admin_Menu.
 */
class Domain_Only_Admin_Menu extends Base_Admin_Menu {

	/**
	 * Whether to use wp-admin pages rather than Calypso.
	 *
	 * Options:
	 * false - Calypso (Default).
	 * true  - wp-admin.
	 *
	 * @return bool
	 */
	public function should_link_to_wp_admin() {
		return false;
	}

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		global $menu, $submenu;

		$menu    = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu = array(); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		if ( ! $this->is_api_request ) {
			$nudge = $this->get_upsell_nudge();
			if ( $nudge ) {
				parent::add_upsell_nudge( $nudge );
			}
		}

		add_menu_page( esc_attr__( 'Settings', 'jetpack' ), __( 'Settings', 'jetpack' ), 'manage_options', 'https://wordpress.com/domains/manage/' . $this->domain, null, 'dashicons-admin-settings' );
	}

	/**
	 * Returns the first available upsell nudge.
	 *
	 * @return array
	 */
	public function get_upsell_nudge() {
		require_lib( 'jetpack-jitm/jitm-engine' );
		$jitm_engine = new JITM\Engine();

		$message_path = 'calypso:sites:sidebar_notice';
		$current_user = wp_get_current_user();
		$user_id      = $current_user->ID;
		$user_roles   = implode( ',', $current_user->roles );
		$query_string = array(
			'message_path' => 'calypso:sites:sidebar_notice',
		);

		// Get the top message only.
		$message = $jitm_engine->get_top_messages( $message_path, $user_id, $user_roles, $query_string )[0];

		if ( $message ) {
			return array(
				'content'                      => $message->content['message'],
				'cta'                          => $message->CTA['message'], // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				'link'                         => $message->CTA['link'], // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				'tracks_impression_event_name' => $message->tracks['display']['name'],
				'tracks_impression_cta_name'   => $message->tracks['display']['props']['cta_name'],
				'tracks_click_event_name'      => $message->tracks['click']['name'],
				'tracks_click_cta_name'        => $message->tracks['click']['props']['cta_name'],
			);
		}
	}
}
