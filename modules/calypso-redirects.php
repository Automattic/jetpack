<?php

if ( ! class_exists( 'Calypso_Redirects' ) ) :

class Calypso_Redirects {

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'menu_redirects' ), 30 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );

		add_filter( 'allowed_redirect_hosts', array( $this, 'allow_calypso_domain' ), 10, 1 );

		// register redirect handlers
		add_action( 'load-users_page_calypso-users', array( $this, 'users_redirect' ) );
		add_action( 'load-users_page_calypso-users-new', array( $this, 'users_new_redirect' ) );
		add_action( 'load-users_page_calypso-users-profile', array( $this, 'users_profile_redirect' ) );
		add_action( 'load-users_page_calypso-users-settings', array( $this, 'users_settings_redirect' ) );

		add_action( 'load-toplevel_page_calypso-plugins', array( $this, 'plugins_redirect' ) );
	}

	private function register_user_redirects() {
		remove_submenu_page( 'users.php', 'users.php' );
		remove_submenu_page( 'users.php', 'user-new.php' );
		remove_submenu_page( 'users.php', 'profile.php' );

		// replace each menu item one by one with its redirect
		add_submenu_page( 'users.php', __( 'All Users' ), __( 'All Users' ), 'list_users', 'calypso-users', array( $this, 'users_redirect' ) );
		add_submenu_page( 'users.php', __( 'Invite New' ), __( 'Invite New' ), 'promote_users', 'calypso-users-new', array( $this, 'users_new_redirect' ) );
		add_submenu_page( 'users.php', __( 'My Profile' ), __( 'My Profile' ), 'read', 'calypso-users-profile', array( $this, 'users_profile_redirect' ) );
	}

	private function register_track_event( $event ) {
		// record in tracks
		jetpack_require_lib( 'tracks/client' );
		jetpack_tracks_record_event( wp_get_current_user(), $event );
	}

	public function allow_calypso_domain( $domains ) {
		$domains[] = 'wordpress.com';

		return $domains;
	}

	public function enqueue_scripts() {
		wp_enqueue_style( 'calypso-redirects-css', plugins_url( 'calypso-redirects/calypso-redirects.css' , __FILE__ ), array(), '20170922-1' );

		// support rtl languages
		wp_style_add_data( 'calypso-redirects-css', 'rtl', 'replace' );
	}

	public function plugins_redirect() {
		$this->register_track_event( 'jetpack_admin_calypso_plugins_redirect' );

		$site_slug = Jetpack::build_raw_urls( get_home_url() );
		wp_safe_redirect( 'https://wordpress.com/plugins/' . $site_slug );
		exit;
	}

	public function load_users_redirect() {
		$this->register_track_event( 'jetpack_admin_calypso_load_users_php_redirect' );

		$site_slug = Jetpack::build_raw_urls( get_home_url() );
		wp_safe_redirect( 'https://wordpress.com/people/team/' . $site_slug );
		exit;
	}

	public function users_redirect() {
		$this->register_track_event( 'jetpack_admin_calypso_users_redirect' );

		$site_slug = Jetpack::build_raw_urls( get_home_url() );
		wp_safe_redirect( 'https://wordpress.com/people/team/' . $site_slug );
		exit;
	}

	public function users_new_redirect() {
		$this->register_track_event( 'jetpack_admin_calypso_users_add_new_redirect' );

		$site_slug = Jetpack::build_raw_urls( get_home_url() );
		wp_safe_redirect( 'https://wordpress.com/people/new/' . $site_slug );
		exit;
	}

	public function users_profile_redirect() {
		$this->register_track_event( 'jetpack_admin_calypso_users_profile_redirect' );

		wp_safe_redirect( 'https://wordpress.com/me' );
		exit;
	}

	public function menu_redirects() {
		add_menu_page( __( 'Plugins' ), __( 'Plugins' ), 'manage_options', 'calypso-plugins', array( $this, 'plugins_redirect' ), 'dashicons-admin-plugins', 65 );

		$this->register_user_redirects();
	}

}

new Calypso_Redirects();

endif; // end class exists check
