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
			$old_master_user   = Jetpack_Options::get_option( 'master_user' );
			$new_master_user   = $_POST['jetpack-new-master'];
			$user_token        = Jetpack_Data::get_access_token( $new_master_user );
			$is_user_connected = $user_token && ! is_wp_error( $user_token );
			if ( current_user_can( 'manage_options' ) && $is_user_connected ) {
				Jetpack::log( 'switch_master_user', array( 'old_master' => $old_master_user, 'new_master' => $new_master_user ) );
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
	function jetpack_are_other_users_linked_and_admin() {
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

		return true;
	}

	/*
	 * All the data we'll need about the Master User
	 * for the My Jetpack page template
	 *
	 * @return array
	 */
	function jetpack_master_user_data() {
		$master_user           = get_userdata( Jetpack_Options::get_option( 'master_user' ) );
		$master_user_data_com  = Jetpack::get_connected_user_data( $master_user->ID );
		$gravatar              = sprintf( '<a href="%s">%s</a>', get_edit_user_link( $master_user->ID ), get_avatar( $master_user->ID, 40 ) );

		$master_user_data = array(
			'masterUser'     => $master_user,
			'masterDataCom'  => $master_user_data_com,
			'gravatar'       => $gravatar,
		);

		return $master_user_data;
	}

	/*
	 * All the data we'll need about the Current User
	 *
	 * @return array
	 */
	function jetpack_current_user_data() {
		global $current_user;
		$is_master_user = $current_user->ID == Jetpack_Options::get_option( 'master_user' );
		$dotcom_data    = Jetpack::get_connected_user_data();

		$current_user_data = array(
			'isUserConnected' => Jetpack::is_user_connected( $current_user->ID ),
			'isMasterUser'    => $is_master_user,
			'adminUsername'   => $current_user->user_login,
			'userComData'     => $dotcom_data,
			'gravatar'        => sprintf( '<a href="%s">%s</a>', get_edit_user_link( $current_user->ID ), get_avatar( $current_user->ID, 40 ) ),
		);

		return $current_user_data;
	}

	// Load up admin scripts
	function page_admin_scripts() {
		wp_enqueue_script( 'jp-connection-js', plugins_url( '_inc/jp-connection.js', JETPACK__PLUGIN_FILE ), array( 'jquery', 'wp-util' ), JETPACK__VERSION . 'yep' );

		wp_localize_script( 'jp-connection-js', 'jpConnection',
			array(
				'jetpackIsActive'    => Jetpack::is_active(),
				'showPrimaryUserRow' => $this->jetpack_show_primary_user_row(),
				'otherAdminsLinked'  => $this->jetpack_are_other_users_linked_and_admin(),
				'masterUser'         => $this->jetpack_master_user_data(),
				'currentUser'        => $this->jetpack_current_user_data(),
				'alertText'          => __( 'You must link another admin account before switching primary account holders.', 'jetpack' ),
			)
		);
	}
}
