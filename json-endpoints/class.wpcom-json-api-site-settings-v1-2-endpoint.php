<?php
/**
 * WARNING: This file is distributed verbatim in Jetpack.
 * There should be nothing WordPress.com specific in this file.
 *
 * @hide-in-jetpack
 * @autounit api site-settings
 */

class WPCOM_JSON_API_Site_Settings_V1_2_endpoint extends WPCOM_JSON_API_Site_Settings_Endpoint {

	public static $site_format = array(
		'ID'          => '(int) Site ID',
		'name'        => '(string) Title of site',
		'description' => '(string) Tagline or description of site',
		'URL'         => '(string) Full URL to the site',
		'locale'      => '(string) Locale code of the site',
		'settings'    => '(array) An array of options/settings for the blog. Only viewable by users with post editing rights to the site.',
	);


	function callback( $path = '', $blog_id = 0 ) {
		add_filter( 'site_settings_endpoint_update_locale', array( $this, 'update_locale' ) );
		add_filter( 'site_settings_endpoint_get',           array( $this, 'return_locale' ) );
		add_filter( 'site_settings_site_format',            array( $this, 'site_format' ) );
		return parent::callback( $path, $blog_id );
	}


	protected function get_locale( $key ) {
		if ( 'locale' == $key ) {
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				return (string) get_blog_lang_code();
			} else {
				return get_locale();
			}
		}

		return false;
	}

	public function return_locale( $settings ) {
		return $settings + array( 'locale' => $this->get_locale( 'locale' ) );
	}

	public function update_locale( $value ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$lang_id = get_lang_id_by_code( $value );
			if ( ! empty( $lang_id ) ) {
				if ( update_option( 'lang_id', $lang_id ) ) {
					return true;
				}
			}
		}
		return false;
	}

	public function site_format( $format ) {
		return self::$site_format;
	}
}
