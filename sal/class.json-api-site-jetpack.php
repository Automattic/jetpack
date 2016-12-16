<?php

require_once dirname( __FILE__ ) . '/class.json-api-site-jetpack-base.php';
require_once dirname( __FILE__ ) . '/class.json-api-post-jetpack.php';

// this code runs on Jetpack (.org) sites
class Jetpack_Site extends Abstract_Jetpack_Site {

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

	protected function is_main_network() {
		return Jetpack::is_multi_network();
	}

	protected function is_multi_site() {
		return is_multisite();
	}

	protected function is_version_controlled() {
		return Jetpack_Sync_Functions::is_version_controlled();
	}

	protected function file_system_write_access() {
		return Jetpack_Sync_Functions::file_system_write_access();
	}

	protected function current_theme_supports( $feature_name ) {
		return current_theme_supports( $feature_name );
	}

	protected function get_theme_support( $feature_name ) {
		return get_theme_support( $feature_name );
	}

	protected function get_updates() {
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
		// TODO: any way to detect wordads on the site, or does it need to be modified on the way through?
		return false;
	}

	function get_frame_nonce() {
		return false;
	}

	function allowed_file_types() {
		$allowed_file_types = array();

		// http://codex.wordpress.org/Uploading_Files
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

	function get_icon() {
		if ( function_exists( 'get_site_icon_url' ) && function_exists( 'jetpack_photon_url' ) ) {
			return array(
				'img' => (string) jetpack_photon_url( get_site_icon_url( 80, '', get_current_blog_id() ), array( 'w' => 80 ), 'https' ),
				'ico' => (string) jetpack_photon_url( get_site_icon_url( 16, '', get_current_blog_id() ), array( 'w' => 16 ), 'https' ),
			);
		}

		return null;
	}

	function is_jetpack() {
		return true;
	}

	protected function get_jetpack_version() {
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

	/**
	 * Post functions
	 */

	function wrap_post( $post, $context ) {
		return new Jetpack_Post( $this, $post, $context );
	}

}
