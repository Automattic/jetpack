<?php
/**
 * Plugin Name: Jetpack E2E Helper
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * Provides REST API endpoints for plan data management and HTTP request interception
 * for E2E testing scenarios.
 *
 * @package automattic/jetpack
 */

add_action( 'rest_api_init', 'e2e_helper_register_rest_routes' );
add_filter( 'pre_http_request', 'e2e_intercept_plan_data_request', 1, 3 );

/**
 * Register REST API routes for E2E helper
 */
function e2e_helper_register_rest_routes() {
	register_rest_route(
		'e2e-plan-helper/v1',
		'/plan-data',
		array(
			'methods'             => 'POST',
			'callback'            => 'e2e_helper_set_plan_data',
			'permission_callback' => 'e2e_helper_admin_permission_check',
			'args'                => array(
				'plan_type' => array(
					'required'          => false,
					'default'           => 'jetpack_complete',
					'sanitize_callback' => 'sanitize_text_field',
					'validate_callback' => 'e2e_helper_validate_plan_type',
				),
			),
		)
	);
}

/**
 * Permission callback to ensure only administrators can access endpoints
 *
 * @return bool
 */
function e2e_helper_admin_permission_check() {
	return current_user_can( 'manage_options' );
}

/**
 * Validate plan type parameter
 *
 * @param string $param The plan type parameter.
 * @return bool
 */
function e2e_helper_validate_plan_type( $param ) {
	$allowed_plans = array( 'jetpack_free', 'jetpack_complete' );
	return in_array( $param, $allowed_plans, true );
}

/**
 * Set plan data endpoint callback
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response
 */
function e2e_helper_set_plan_data( $request ) {
	$plan_type = $request->get_param( 'plan_type' );

	if ( ! class_exists( 'Jetpack_Options' ) ) {
		return new WP_REST_Response(
			array( 'error' => 'Jetpack not available' ),
			500
		);
	}

	$site_id = Jetpack_Options::get_option( 'id' );
	if ( empty( $site_id ) ) {
		return new WP_REST_Response(
			array( 'error' => 'Site ID not found' ),
			500
		);
	}

	$site_url  = site_url();
	$plan_data = e2e_helper_get_plan_data( $site_id, $site_url, $plan_type );

	delete_option( 'e2e_jetpack_plan_data' );

	$success = update_option( 'e2e_jetpack_plan_data', wp_json_encode( $plan_data, JSON_UNESCAPED_SLASHES ) );

	if ( $success ) {
		return new WP_REST_Response(
			array(
				'success'       => true,
				'plan_type'     => $plan_type,
				'site_id'       => $site_id,
				'update_result' => $success,
			),
			200
		);
	} else {
		return new WP_REST_Response(
			array(
				'error' => 'Failed to update plan data',
			),
			500
		);
	}
}

/**
 * Get plan data based on plan type
 *
 * @param int    $site_id Site ID.
 * @param string $site_url Site URL.
 * @param string $plan_type Plan type slug.
 * @param string $site_name Site name.
 * @param string $description Site description.
 * @return array Plan data array.
 */
function e2e_helper_get_plan_data( $site_id, $site_url, $plan_type, $site_name = 'Whatever', $description = 'Just another WordPress site' ) {
	$plan = e2e_helper_get_plan( $plan_type );

	return array(
		'ID'                => $site_id,
		'name'              => $site_name,
		'description'       => $description,
		'URL'               => $site_url,
		'user_can_manage'   => false,
		'capabilities'      => array(
			'edit_pages'          => false,
			'edit_posts'          => false,
			'edit_others_posts'   => false,
			'edit_others_pages'   => false,
			'delete_posts'        => false,
			'delete_others_posts' => false,
			'edit_theme_options'  => false,
			'edit_users'          => false,
			'list_users'          => false,
			'manage_categories'   => false,
			'manage_options'      => false,
			'moderate_comments'   => false,
			'activate_wordads'    => false,
			'promote_users'       => false,
			'publish_posts'       => false,
			'upload_files'        => false,
			'delete_users'        => false,
			'remove_users'        => false,
			'view_stats'          => false,
		),
		'jetpack'           => true,
		'is_multisite'      => false,
		'subscribers_count' => 2,
		'lang'              => false,
		'logo'              => array(
			'id'    => 0,
			'sizes' => array(),
			'url'   => '',
		),
		'visible'           => null,
		'is_private'        => false,
		'single_user_site'  => false,
		'is_vip'            => false,
		'is_following'      => false,
		'options'           => array(
			'timezone'                            => '',
			'gmt_offset'                          => 3,
			'blog_public'                         => 1,
			'videopress_enabled'                  => false,
			'upgraded_filetypes_enabled'          => true,
			'login_url'                           => $site_url . '/wp-login.php',
			'admin_url'                           => $site_url . '/wp-admin/',
			'is_mapped_domain'                    => true,
			'is_redirect'                         => false,
			'unmapped_url'                        => $site_url,
			'featured_images_enabled'             => false,
			'theme_slug'                          => 'twentytwenty',
			'header_image'                        => false,
			'background_color'                    => false,
			'image_default_link_type'             => '',
			'image_thumbnail_width'               => 150,
			'image_thumbnail_height'              => 150,
			'image_thumbnail_crop'                => 0,
			'image_medium_width'                  => 300,
			'image_medium_height'                 => 300,
			'image_large_width'                   => 1024,
			'image_large_height'                  => 1024,
			'permalink_structure'                 => '/%year%/%monthnum%/%day%/%postname%/',
			'post_formats'                        => array(
				'aside'   => 'Aside',
				'image'   => 'Image',
				'video'   => 'Video',
				'quote'   => 'Quote',
				'link'    => 'Link',
				'gallery' => 'Gallery',
				'audio'   => 'Audio',
			),
			'default_post_format'                 => '0',
			'default_category'                    => 1,
			'allowed_file_types'                  => array(
				'jpg',
				'jpeg',
				'png',
				'gif',
				'pdf',
				'doc',
				'ppt',
				'odt',
				'pptx',
				'docx',
				'pps',
				'ppsx',
				'xls',
				'xlsx',
				'key',
				'asc',
				'mp3',
				'm4a',
				'wav',
				'ogg',
				'zip',
				'ogv',
				'mp4',
				'm4v',
				'mov',
				'wmv',
				'avi',
				'mpg',
				'3gp',
				'3g2',
			),
			'show_on_front'                       => 'posts',
			'default_likes_enabled'               => true,
			'default_sharing_status'              => true,
			'default_comment_status'              => true,
			'default_ping_status'                 => true,
			'software_version'                    => '5.3.2',
			'created_at'                          => '2018-03-30T11:09:46+00:00',
			'wordads'                             => true,
			'publicize_permanently_disabled'      => false,
			'frame_nonce'                         => '9259c8a8cb',
			'jetpack_frame_nonce'                 => '1579180048:0:52d3b39fea745e1a87ac36d8eedb8033',
			'headstart'                           => false,
			'headstart_is_fresh'                  => false,
			'ak_vp_bundle_enabled'                => 0,
			'advanced_seo_front_page_description' => '',
			'advanced_seo_title_formats'          => array(),
			'verification_services_codes'         => array(
				0        => '0',
				'google' => '',
			),
			'podcasting_archive'                  => null,
			'is_domain_only'                      => false,
			'is_automated_transfer'               => false,
			'is_wpcom_atomic'                     => false,
			'is_wpcom_store'                      => false,
			'woocommerce_is_active'               => true,
			'design_type'                         => null,
			'site_goals'                          => null,
			'site_segment'                        => false,
			'import_engine'                       => null,
			'jetpack_version'                     => '8.1',
			'main_network_site'                   => $site_url,
			'active_modules'                      => array(
				'contact-form',
				'custom-content-types',
				'custom-css',
				'gravatar-hovercards',
				'json-api',
				'latex',
				'notes',
				'post-by-email',
				'protect',
				'sharedaddy',
				'shortcodes',
				'shortlinks',
				'sitemaps',
				'stats',
				'verification-tools',
				'comment-likes',
				'related-posts',
				'subscriptions',
				'publicize',
				'copy-post',
				'monitor',
				'carousel',
				'markdown',
				'comments',
				'likes',
				'infinite-scroll',
				'wordads',
				'sso',
				'widgets',
				'widget-visibility',
				'photon',
				'photon-cdn',
			),
			'max_upload_size'                     => false,
			'wp_memory_limit'                     => '268435456',
			'wp_max_memory_limit'                 => '268435456',
			'is_multi_network'                    => false,
			'is_multi_site'                       => false,
			'file_mod_disabled'                   => array( 'wp_auto_update_core_disabled' ),
		),
		'plan'              => $plan,
		'meta'              => array(
			'links' => array(
				'self'     => 'https://public-api.wordpress.com/rest/v1.1/sites/id',
				'help'     => 'https://public-api.wordpress.com/rest/v1.1/sites/id/help',
				'posts'    => 'https://public-api.wordpress.com/rest/v1.1/sites/id/posts/',
				'comments' => 'https://public-api.wordpress.com/rest/v1.1/sites/id/comments/',
				'xmlrpc'   => $site_url . '/xmlrpc.php',
			),
		),
		'quota'             => array(
			'space_allowed'   => 2100373225472,
			'space_used'      => 0,
			'percent_used'    => 0,
			'space_available' => 2100373225472,
		),
		'launch_status'     => false,
		'site_migration'    => null,
		'is_fse_active'     => false,
		'is_fse_eligible'   => false,
	);
}

/**
 * Get plan configuration based on plan type
 *
 * @param string $plan_type Plan type slug.
 * @return array Plan configuration.
 */
function e2e_helper_get_plan( $plan_type ) {
	switch ( $plan_type ) {
		case 'jetpack_free':
			return array(
				'product_id'         => 2002,
				'product_slug'       => 'jetpack_free',
				'product_name'       => 'Jetpack Free',
				'product_name_short' => 'Free',
				'expired'            => false,
				'user_is_owner'      => false,
				'is_free'            => true,
				'features'           => array(
					'active'    => array( 'akismet', 'donations', 'recurring-payments', 'premium-content/container' ),
					'available' => array(
						'akismet'                       => array(
							'jetpack_free',
							'jetpack_premium',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
						),
						'vaultpress-backups'            => array(
							'jetpack_premium',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'vaultpress-backup-archive'     => array(
							'jetpack_premium',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'vaultpress-storage-space'      => array(
							'jetpack_premium',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'vaultpress-automated-restores' => array(
							'jetpack_premium',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'simple-payments'               => array(
							'jetpack_premium',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'support'                       => array(
							'jetpack_premium',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
						),
						'premium-themes'                => array( 'jetpack_business_monthly' ),
						'vaultpress-security-scanning'  => array( 'jetpack_business_monthly' ),
						'polldaddy'                     => array( 'jetpack_business_monthly' ),
					),
				),
			);

		case 'jetpack_complete':
			return array(
				'product_id'         => 2014,
				'product_slug'       => 'jetpack_complete',
				'product_name'       => 'Jetpack Complete',
				'product_name_short' => 'Complete',
				'expired'            => false,
				'user_is_owner'      => false,
				'is_free'            => false,
				'features'           => array(
					'active'    => array(
						'akismet',
						'send-a-message',
						'social-previews',
						'donations',
						'core/audio',
						'support',
						'wordads-jetpack',
						'donations',
						'recurring-payments',
						'premium-content/container',
					),
					'available' => array(
						'akismet'                       => array(
							'jetpack_free',
							'jetpack_premium',
							'jetpack_business',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
						),
						'send-a-message'                => array(
							'jetpack_free',
							'jetpack_premium',
							'jetpack_business',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
						),
						'social-previews'               => array(
							'jetpack_free',
							'jetpack_premium',
							'jetpack_business',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
						),
						'vaultpress-backups'            => array(
							'jetpack_premium',
							'jetpack_business',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'vaultpress-backup-archive'     => array(
							'jetpack_premium',
							'jetpack_business',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'vaultpress-storage-space'      => array(
							'jetpack_premium',
							'jetpack_business',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'vaultpress-automated-restores' => array(
							'jetpack_premium',
							'jetpack_business',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'simple-payments'               => array(
							'jetpack_premium',
							'jetpack_business',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'calendly'                      => array(
							'jetpack_premium',
							'jetpack_business',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'opentable'                     => array(
							'jetpack_premium',
							'jetpack_business',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'donations'                     => array(
							'jetpack_free',
							'jetpack_premium',
							'jetpack_business',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
						),
						'core/video'                    => array(
							'jetpack_premium',
							'jetpack_business',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'core/cover'                    => array(
							'jetpack_premium',
							'jetpack_business',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
						),
						'core/audio'                    => array(
							'jetpack_premium',
							'jetpack_business',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
						),
						'premium-content/container'     => array(
							'jetpack_free',
							'jetpack_premium',
							'jetpack_business',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
						),
						'support'                       => array(
							'jetpack_premium',
							'jetpack_business',
							'jetpack_personal',
							'jetpack_premium_monthly',
							'jetpack_business_monthly',
							'jetpack_personal_monthly',
							'jetpack_security_t1_yearly',
							'jetpack_security_t1_monthly',
							'jetpack_security_t2_yearly',
							'jetpack_security_t2_monthly',
							'jetpack_complete_monthly',
							'jetpack_security_daily',
							'jetpack_security_daily_monthly',
							'jetpack_security_realtime',
							'jetpack_security_realtime_monthly',
						),
						'premium-themes'                => array( 'jetpack_business', 'jetpack_business_monthly' ),
						'vaultpress-security-scanning'  => array( 'jetpack_business', 'jetpack_business_monthly' ),
						'polldaddy'                     => array( 'jetpack_business', 'jetpack_business_monthly' ),
					),
				),
			);

		default:
			return array();
	}
}

/**
 * Intercept WPCOM plan data request and replaces it with mocked data
 *
 * @param false|array|WP_Error $return result.
 * @param array                $_parsed_args not used.
 * @param string               $url request URL.
 */
function e2e_intercept_plan_data_request( $return, $_parsed_args, $url ) {
	if ( ! class_exists( 'Jetpack_Options' ) ) {
		return $return;
	}

	$site_id = Jetpack_Options::get_option( 'id' );

	if ( empty( $site_id ) ) {
		return $return;
	}

	// match both /sites/$site_id && /sites/$site_id? urls.
	if ( 1 === preg_match( sprintf( '/\/sites\/%d($|\?)/', $site_id ), $url ) ) {
		$plan_data = get_option( 'e2e_jetpack_plan_data' );
		if ( empty( $plan_data ) ) {
			return $return;
		}

		delete_option( 'jetpack_active_plan' );

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => $plan_data,
		);
	}

	if ( false !== stripos( $url, sprintf( '/sites/%d/wordads/status', $site_id ) ) ) {
		$site_url  = site_url();
		$json_data = sprintf( '{"ID":%d,"name":"E2E Testing","URL":"%s","approved":true,"active":true,"house":true,"unsafe":false,"status":false}', $site_id, $site_url );

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => $json_data,
		);
	}

	return $return;
}
