<?php
/*
 * WARNING: This file is distributed verbatim in Jetpack.
 * There should be nothing WordPress.com specific in this file.
 *
 * @hide-in-jetpack
 */

class WPCOM_JSON_API_GET_Site_V1_2_Endpoint extends WPCOM_JSON_API_GET_Site_Endpoint {

	public static $site_format = array(
 		'ID'                => '(int) Site ID',
 		'name'              => '(string) Title of site',
 		'description'       => '(string) Tagline or description of site',
 		'URL'               => '(string) Full URL to the site',
 		'jetpack'           => '(bool)  Whether the site is a Jetpack site or not',
 		'post_count'        => '(int) The number of posts the site has',
		'subscribers_count' => '(int) The number of subscribers the site has',
		'locale'            => '(string) Primary locale code of the site',
		'icon'              => '(array) An array of icon formats for the site',
		'logo'              => '(array) The site logo, set in the Customizer',
		'visible'           => '(bool) If this site is visible in the user\'s site list',
		'is_private'        => '(bool) If the site is a private site or not',
		'is_following'      => '(bool) If the current user is subscribed to this site in the reader',
		'options'           => '(array) An array of options/settings for the blog. Only viewable by users with post editing rights to the site. Note: Post formats is deprecated, please see /sites/$id/post-formats/',
		'updates'           => '(array) An array of available updates for plugins, themes, wordpress, and languages.',
		'jetpack_modules'   => '(array) A list of active Jetpack modules.',
		'meta'              => '(object) Meta data',
	);

	function callback( $path = '', $blog_id = 0 ) {
		add_filter( 'sites_site_format', array( $this, 'site_format' ) );

		return parent::callback( $path, $blog_id );
	}

	//V1.2 renames lang to locale
	protected function process_locale( $key, $is_user_logged_in ) {
		if ( $is_user_logged_in && 'locale' == $key ) {
			if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
				if ( ! is_jetpack_site() ) {
					return (string) get_blog_lang_code();
				}
			}
		}
		return false;
	}

	public function site_format( $format ) {
		return self::$site_format;
	}
}
