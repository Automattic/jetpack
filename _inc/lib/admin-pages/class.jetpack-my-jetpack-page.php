<?php
include_once( 'class.jetpack-admin-page.php' );
include_once( JETPACK__PLUGIN_DIR . 'class.jetpack-modules-list-table.php' );

// Builds the My Jetpack page
class Jetpack_My_Jetpack_Page extends Jetpack_Admin_Page {
	// Show the settings page only when Jetpack is connected or in dev mode
	protected $dont_show_if_not_active = true;
	function add_page_actions( $hook ) {} // There are no page specific actions to attach to the menu

	// Adds the My Jetpack page, but hides it from the submenu
	function get_page_hook() {
		return add_submenu_page( null, __( 'My Jetpack', 'jetpack' ), __( 'My Jetpack', 'jetpack' ), 'jetpack_connect_user', 'my_jetpack', array( $this, 'render' ) );
	}

	// Renders the view file
	function page_render() {
		Jetpack::init()->load_view( 'admin/my-jetpack-page.php' );
	}

	/*
	 * Handle the change in master user
	 */
	function jetpack_my_jetpack_change_user() {
		if ( ! isset( $_POST['_my_jetpack_nonce'] ) || ! wp_verify_nonce( $_POST['_my_jetpack_nonce'], 'jetpack_change_primary_user' ) ) {
			wp_die( __( 'Failed permissions, please try again.', 'jetpack' ) );
			exit;
		}

		if ( isset( $_POST['jetpack-new-master'] ) ) {
			$new_master_user   = $_POST['jetpack-new-master'];
			$user_token        = Jetpack_Data::get_access_token( $new_master_user   );
			$is_user_connected = $user_token && ! is_wp_error( $user_token );
			if ( is_admin() && $is_user_connected ) {
				Jetpack_Options::update_option( 'master_user', $new_master_user );
			}
		}
	}

	/*
	 * Determine if we should show the primary user info
	 * on the My Jetpack page
	 *
	 * @return (bool) True = show | False = Don't show
	 */
	function jetpack_show_primary_user_row() {
		$all_users = count_users();
		if ( ! current_user_can( 'jetpack_manage_modules' ) ) {
			return false;
		}

		// If only one admin
		if ( 2 > $all_users['avail_roles']['administrator'] ) {
			return false;
		}

		return true;
	}

	/*
	 * Checks to see if there are any other users available to become primary
	 * Users must both:
	 * - Be linked to wpcom
	 * - Be an admin
	 *
	 * @return bool
	 */
	function jetpack_potential_primary_users_available() {
		// If not admin, or only one admin
		if ( false === $this->jetpack_show_primary_user_row() ) {
			return false;
		}

		$users = get_users();
		$available = array();
		// If no one else is linked to dotcom
		foreach ( $users as $user ) {
			if ( isset( $user->caps['administrator'] ) && Jetpack::is_user_connected( $user->ID ) ) {
				$available[] = $user->ID;
			}
		}

		if ( 2 > count( $available ) ) {
			return false;
		}

		return 'true';
	}

	/*
	 * Info about the user's connection relationship with the site.
	 *
	 * @return array
	 */
	function jetpack_my_jetpack_logic() {
		global $current_user;
		$is_user_connected    = Jetpack::is_user_connected( $current_user->ID );
		$is_master_user       = $current_user->ID == Jetpack_Options::get_option( 'master_user' );
		$master_user_id       = Jetpack_Options::get_option( 'master_user' );
		$master_user_data_org = get_userdata( $master_user_id );
		$master_user_data_com = Jetpack::get_connected_user_data( $master_user_id );
		if ( $master_user_data_org ) {
			$edit_master_user_link = sprintf( __( '<a href="%s">%s</a>', 'jetpack' ), get_edit_user_link( $master_user_id ), $master_user_data_org->user_login );
		} else {
			$edit_master_user_link = __( 'No master user set!', 'jetpack' );
		}
		$connection_info = array(
			'isMasterUser'    => $is_master_user,
			'masterUserLink'  => $edit_master_user_link,
			'isUserConnected' => $is_user_connected,
			'master_data_com' => $master_user_data_com,
			'adminUsername'   => $current_user->user_login
		);
		return $connection_info;
	}

	// Load up admin scripts
	function page_admin_scripts() {
		wp_enqueue_script( 'jp-connection-js', plugins_url( '_inc/jp-connection.js', JETPACK__PLUGIN_FILE ), array( 'jquery', 'wp-util' ), JETPACK__VERSION . 'yep' );

		$master_user_com_data = $this->jetpack_my_jetpack_logic();
		$jetpack_user_data    = Jetpack::get_connected_user_data();
		$current_user         = wp_get_current_user();
		wp_localize_script( 'jp-connection-js', 'jpConnection',
			array(
				'connectionLogic'    => $this->jetpack_my_jetpack_logic(),
				'jetpackIsActive'    => Jetpack::is_active(),
				'showPrimaryUserRow' => $this->jetpack_show_primary_user_row(),
				'masterComData'      => $master_user_com_data['master_data_com'],
				'userComData'        => $jetpack_user_data,
				'userGrav'           => get_avatar( $current_user->ID, 40 ),
				'masterUserGrav'     => get_avatar( Jetpack_Options::get_option( 'master_user' ), 40 ),
				'potentialPrimaries' => $this->jetpack_potential_primary_users_available(),
			)
		);
	}
}
