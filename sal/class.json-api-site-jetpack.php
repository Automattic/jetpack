<?php

use Automattic\Jetpack\Sync\Functions;

require_once dirname( __FILE__ ) . '/class.json-api-site-jetpack-base.php';
require_once dirname( __FILE__ ) . '/class.json-api-post-jetpack.php';

// this code runs on Jetpack (.org) sites
class Jetpack_Site extends Abstract_Jetpack_Site {

	protected function get_mock_option( $name ) {
		return get_option( 'jetpack_'.$name );
	}

	protected function get_constant( $name ) {
		if ( defined( $name) ) {
			return constant( $name );
		}
		return null;
	}

	protected function main_network_site() {
		return network_site_url();
	}

	protected function wp_version() {
		global $wp_version;
		return $wp_version;
	}

	protected function max_upload_size() {
		return wp_max_upload_size();
	}

	protected function wp_memory_limit() {
		return wp_convert_hr_to_bytes( WP_MEMORY_LIMIT );
	}

	protected function wp_max_memory_limit() {
		return wp_convert_hr_to_bytes( WP_MAX_MEMORY_LIMIT );
	}

	protected function is_main_network() {
		return Jetpack::is_multi_network();
	}

	public function is_multisite() {
		return (bool) is_multisite();
	}

	public function is_single_user_site() {
		return (bool) Jetpack::is_single_user_site();
	}

	protected function is_version_controlled() {
		return Functions::is_version_controlled();
	}

	protected function file_system_write_access() {
		return Functions::file_system_write_access();
	}

	protected function current_theme_supports( $feature_name ) {
		return current_theme_supports( $feature_name );
	}

	protected function get_theme_support( $feature_name ) {
		return get_theme_support( $feature_name );
	}

	public function get_updates() {
		return (array) Jetpack::get_updates();
	}

	function get_id() {
		return $this->platform->token->blog_id;
	}

	function has_videopress() {
		// TODO - this only works on wporg site - need to detect videopress option for remote Jetpack site on WPCOM
		$videopress = Jetpack_Options::get_option( 'videopress', array() );
		if ( isset( $videopress['blog_id'] ) && $videopress['blog_id'] > 0 ) {
			return true;
		}

		return false;
	}

	function upgraded_filetypes_enabled() {
		return true;
	}

	function is_mapped_domain() {
		return true;
	}

	function is_redirect() {
		return false;
	}

	function is_following() {
		return false;
	}

	function has_wordads() {
		return Jetpack::is_module_active( 'wordads' );
	}

	function get_frame_nonce() {
		return false;
	}

	function get_jetpack_frame_nonce() {
		return false;
	}

	function is_headstart_fresh() {
		return false;
	}

	function allowed_file_types() {
		$allowed_file_types = array();

		// https://codex.wordpress.org/Uploading_Files
		$mime_types = get_allowed_mime_types();
		foreach ( $mime_types as $type => $mime_type ) {
			$extras = explode( '|', $type );
			foreach ( $extras as $extra ) {
				$allowed_file_types[] = $extra;
			}
		}

		return $allowed_file_types;
	}

	function is_private() {
		return false;
	}

	function get_plan() {
		return false;
	}

	function get_subscribers_count() {
		return 0; // special magic fills this in on the WPCOM side
	}

	function get_capabilities() {
		return false;
	}

	function get_locale() {
		return get_bloginfo( 'language' );
	}

	function is_jetpack() {
		return true;
	}

	public function get_jetpack_version() {
		return JETPACK__VERSION;
	}

	function get_ak_vp_bundle_enabled() {}

	function get_jetpack_seo_front_page_description() {
		return Jetpack_SEO_Utils::get_front_page_meta_description();
	}

	function get_jetpack_seo_title_formats() {
		return Jetpack_SEO_Titles::get_custom_title_formats();
	}

	function get_verification_services_codes() {
		return get_option( 'verification_services_codes', null );
	}

	function get_podcasting_archive() {
		return null;
	}

	function is_connected_site() {
		return true;
	}

	function current_user_can( $role ) {
		return current_user_can( $role );
	}

	/**
	 * Check if full site editing should be considered as currently active. Full site editing
	 * requires the FSE plugin to be installed and activated, as well the current
	 * theme to be FSE compatible. The plugin can also be explicitly disabled via the
	 * a8c_disable_full_site_editing filter.
	 *
	 * @since 7.7.0
	 *
	 * @return bool true if full site editing is currently active.
	 */
	function is_fse_active() {
		if ( ! Jetpack::is_plugin_active( 'full-site-editing/full-site-editing-plugin.php' ) ) {
			return false;
		}
		if (
			/**
			 * Allow disabling Full Site Editing, even when the FSE plugin is active.
			 *
			 * @module json-api
			 *
			 * @since 7.7.0
			 *
			 * @param bool $disable_fse Disable Full Site Editing. Defaults to false.
			 */
			apply_filters( 'a8c_disable_full_site_editing', false )
		) {
			return false;
		}
		$has_is_supported_theme_method = method_exists( '\A8C\FSE\Full_Site_Editing', 'is_supported_theme' );
		$has_normalize_theme_slug      = method_exists( '\A8C\FSE\Full_Site_Editing', 'normalize_theme_slug' );
		if ( $has_is_supported_theme_method && $has_normalize_theme_slug ) {
			$slug = \A8C\FSE\Full_Site_Editing::get_instance()->normalize_theme_slug( get_option( 'stylesheet' ) );
			return \A8C\FSE\Full_Site_Editing::get_instance()->is_supported_theme( $slug );
		}
		return false;
	}

	/**
	 * Post functions
	 */

	function wrap_post( $post, $context ) {
		return new Jetpack_Post( $this, $post, $context );
	}

}
