<?php

new WPCOM_JSON_API_GET_Site_V1_2_Endpoint( array(
	'description' => 'Get information about a site.',
	'group'       => 'sites',
	'stat'        => 'sites:X',
	'allowed_if_flagged' => true,
	'method'      => 'GET',
	'min_version' => '1.2',
	'path'        => '/sites/%s',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'context' => false,
	),

	'response_format' => WPCOM_JSON_API_GET_Site_V1_2_Endpoint::$site_format,

	'example_request' => 'https://public-api.wordpress.com/rest/v1.2/sites/en.blog.wordpress.com/',
) );

class WPCOM_JSON_API_GET_Site_V1_2_Endpoint extends WPCOM_JSON_API_GET_Site_Endpoint {

	public static $site_format = array(
		'ID'                => '(int) Site ID',
		'name'              => '(string) Title of site',
		'description'       => '(string) Tagline or description of site',
		'URL'               => '(string) Full URL to the site',
		'capabilities'      => '(array) Array of capabilities for the current user on this site.',
		'jetpack'           => '(bool)  Whether the site is a Jetpack site or not',
		'is_multisite'      => '(bool) Whether the site is a Multisite site or not. Always true for WP.com sites.',
		'post_count'        => '(int) The number of posts the site has',
		'subscribers_count' => '(int) The number of subscribers the site has',
		'locale'            => '(string) Primary locale code of the site',
		'icon'              => '(array) An array of icon formats for the site',
		'logo'              => '(array) The site logo, set in the Customizer',
		'visible'           => '(bool) If this site is visible in the user\'s site list',
		'is_private'        => '(bool) If the site is a private site or not',
		'is_coming_soon'    => '(bool) If the site is a "coming soon" site or not',
		'single_user_site'  => '(bool) Whether the site is single user. Only returned for WP.com sites and for Jetpack sites with version 3.4 or higher.',
		'is_vip'            => '(bool) If the site is a VIP site or not.',
		'is_following'      => '(bool) If the current user is subscribed to this site in the reader',
		'options'           => '(array) An array of options/settings for the blog. Only viewable by users with post editing rights to the site. Note: Post formats is deprecated, please see /sites/$id/post-formats/',
		'plan'              => '(array) Details of the current plan for this site.',
		'updates'           => '(array) An array of available updates for plugins, themes, wordpress, and languages.',
		'jetpack_modules'   => '(array) A list of active Jetpack modules.',
		'meta'              => '(object) Meta data',
		'quota'             => '(array) An array describing how much space a user has left for uploads',
		'launch_status'     => '(string) A string describing the launch status of a site',
		'migration_status'  => '(string) A string describing the migration status of the site.',
		'is_fse_active'     => '(bool) If the site has Full Site Editing active or not.',
		'is_fse_eligible'   => '(bool) If the site is capable of Full Site Editing or not',
	);


	function callback( $path = '', $blog_id = 0 ) {
		add_filter( 'sites_site_format', array( $this, 'site_format' ) );

		return parent::callback( $path, $blog_id );
	}

	public function site_format( $format ) {
		return self::$site_format;
	}
}
