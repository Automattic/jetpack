<?php

require_once dirname( __FILE__ ) . '/class.json-api-site-jetpack-base.php';

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

	protected function current_theme_supports( $feature_name ) {
		return current_theme_supports( $feature_name );
	}

	protected function get_theme_support( $feature_name ) {
		return get_theme_support( $feature_name );
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
		if ( function_exists( 'jetpack_site_icon_url' ) && function_exists( 'jetpack_photon_url' ) ) {
			return array(
				'img' => (string) jetpack_photon_url( jetpack_site_icon_url( get_current_blog_id() , 80 ), array( 'w' => 80 ), 'https' ),
				'ico' => (string) jetpack_photon_url( jetpack_site_icon_url( get_current_blog_id() , 16 ), array( 'w' => 16 ), 'https' ),
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

	/**
	 * Post functions
	 */

	function wrap_post( $post, $context ) {
		return new Jetpack_Post( $this, $post, $context );
	}

}
