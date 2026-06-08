<?php
/**
 * Handles fetching of the site's plan and products from WordPress.com and caching values locally.
 *
 * @package automattic/jetpack-plans
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;

/**
 * Provides methods methods for fetching the site's plan and products from WordPress.com.
 */
class Current_Plan {
	/**
	 * A cache variable to hold the active plan for the current request.
	 *
	 * @var array
	 */
	private static $active_plan_cache;

	/**
	 * Simple Site-specific features available.
	 * Their calculation can be expensive and slow, so we're caching it for the request.
	 *
	 * @var array Site-specific features
	 */
	private static $simple_site_specific_features = array();

	/**
	 * The name of the option that will store the site's plan.
	 *
	 * @var string
	 */
	const PLAN_OPTION = 'jetpack_active_plan';

	/**
	 * The name of the option that will store the site's products.
	 *
	 * @var string
	 */
	const SITE_PRODUCTS_OPTION = 'jetpack_site_products';

	const PLAN_DATA = array(
		'free'     => array(
			'plans'    => array(
				'jetpack_free',
			),
			'supports' => array(
				'advanced-seo',
				'opentable',
				'calendly',
				'send-a-message',
				'sharing-block',
				'whatsapp-button',
				'social-previews',
				'videopress',
				'videopress/video',
				'v6-video-frame-poster',

				'core/video',
				'core/cover',
				'core/audio',
				'multistep-form',
				'form-webhooks',
			),
		),
		'personal' => array(
			'plans'    => array(
				'jetpack_personal',
				'jetpack_personal_monthly',
				'personal-bundle',
				'personal-bundle-monthly',
				'personal-bundle-2y',
				'personal-bundle-3y',
				'starter-plan',
			),
			'supports' => array(
				'akismet',
				'payments',
				'videopress',
			),
		),
		'premium'  => array(
			'plans'    => array(
				'jetpack_premium',
				'jetpack_premium_monthly',
				'value_bundle',
				'value_bundle-monthly',
				'value_bundle-2y',
				'value_bundle-3y',
				'jetpack_creator_yearly',
				'jetpack_creator_bi_yearly',
				'jetpack_creator_monthly',
			),
			'supports' => array(
				'simple-payments',
				'vaultpress',
				'videopress',
				'republicize',
			),
		),
		'security' => array(
			'plans'    => array(
				'jetpack_security_daily',
				'jetpack_security_daily_monthly',
				'jetpack_security_realtime',
				'jetpack_security_realtime_monthly',
				'jetpack_security_t1_yearly',
				'jetpack_security_t1_monthly',
				'jetpack_security_t2_yearly',
				'jetpack_security_t2_monthly',
			),
			'supports' => array(),
		),
		'business' => array(
			'plans'    => array(
				'jetpack_business',
				'jetpack_business_monthly',
				'business-bundle',
				'business-bundle-monthly',
				'business-bundle-2y',
				'business-bundle-3y',
				'ecommerce-bundle',
				'ecommerce-bundle-monthly',
				'ecommerce-bundle-2y',
				'ecommerce-bundle-3y',
				'pro-plan',
				'wp_bundle_migration_trial_monthly',
				'wp_bundle_hosting_trial_monthly',
				'ecommerce-trial-bundle-monthly',
				'wooexpress-small-bundle-yearly',
				'wooexpress-small-bundle-monthly',
				'wooexpress-medium-bundle-yearly',
				'wooexpress-medium-bundle-monthly',
				'wp_com_hundred_year_bundle_centennially',
			),
			'supports' => array(
				'ai-seo-enhancer',
			),
		),

		'complete' => array(
			'plans'    => array(
				'jetpack_complete',
				'jetpack_complete_monthly',
				'vip',
			),
			'supports' => array(
				'field-file', // Forms
				'social-image-generator',
			),
		),
	);

	/**
	 * Given a response to the `/sites/%d` endpoint, will parse the response and attempt to set the
	 * site's plan and products from the response.
	 *
	 * @param array $response The response from `/sites/%d`.
	 * @return bool Was the plan successfully updated?
	 */
	public static function update_from_sites_response( $response ) {
		// Bail if there was an error or malformed response.
		if ( is_wp_error( $response ) || ! is_array( $response ) || ! isset( $response['body'] ) ) {
			return false;
		}

		$body = wp_remote_retrieve_body( $response );
		if ( is_wp_error( $body ) ) {
			return false;
		}

		// Decode the results.
		$results = json_decode( $body, true );

		if ( ! is_array( $results ) ) {
			return false;
		}

		if ( isset( $results['products'] ) ) {
			// Store the site's products in an option and return true if updated.
			self::store_data_in_option( self::SITE_PRODUCTS_OPTION, $results['products'] );
		}

		if ( ! isset( $results['plan'] ) ) {
			return false;
		}

		$current_plan = get_option( self::PLAN_OPTION, array() );

		if ( ! empty( $current_plan ) && $current_plan === $results['plan'] ) {
			// Bail if the plans array hasn't changed.
			return false;
		}

		// Store the new plan in an option and return true if updated.
		$result = self::store_data_in_option( self::PLAN_OPTION, $results['plan'] );

		if ( $result ) {
			// Reset the cache since we've just updated the plan.
			self::$active_plan_cache = null;
		}

		return $result;
	}

	/**
	 * Store data in an option.
	 *
	 * @param string $option The name of the option that will store the data.
	 * @param array  $data Data to be store in an option.
	 * @return bool Were the subscriptions successfully updated?
	 */
	private static function store_data_in_option( $option, $data ) {
		$result = update_option( $option, $data, true );

		// If something goes wrong with the update, so delete the current option and then update it.
		if ( ! $result ) {
			delete_option( $option );
			$result = update_option( $option, $data, true );
		}

		return $result;
	}

	/**
	 * Make an API call to WordPress.com for plan status
	 *
	 * @uses Jetpack_Options::get_option()
	 * @uses Client::wpcom_json_api_request_as_blog()
	 * @uses update_option()
	 *
	 * @access public
	 * @static
	 *
	 * @return bool True if plan is updated, false if no update
	 */
	public static function refresh_from_wpcom() {
		$site_id = Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return false;
		}

		// Make the API request.

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d?force=wpcom', $site_id ),
			'1.1'
		);

		return self::update_from_sites_response( $response );
	}

	/**
	 * Get the plan that this Jetpack site is currently using.
	 *
	 * @uses get_option()
	 *
	 * @access public
	 * @static
	 *
	 * @return array Active Jetpack plan details
	 */
	public static function get() {
		// this can be expensive to compute so we cache for the duration of a request.
		if ( is_array( self::$active_plan_cache ) && ! empty( self::$active_plan_cache ) ) {
			return self::$active_plan_cache;
		}

		$plan = get_option( self::PLAN_OPTION, array() );

		// Set the default options.
		$plan = wp_parse_args(
			$plan,
			array(
				'product_slug' => 'jetpack_free',
				'class'        => 'free',
				'features'     => array(
					'active' => array(),
				),
			)
		);

		list( $plan['class'], $supports ) = self::get_class_and_features( $plan['product_slug'] );

		$modules = new Modules();
		foreach ( $modules->get_available() as $module_slug ) {
			$module = $modules->get( $module_slug );
			if ( ! isset( $module ) || ! is_array( $module ) ) {
				continue;
			}
			if ( in_array( 'free', $module['plan_classes'], true ) || in_array( $plan['class'], $module['plan_classes'], true ) ) {
				$supports[] = $module_slug;
			}
		}

		$plan['supports'] = $supports;

		self::$active_plan_cache = $plan;

		return $plan;
	}

	/**
	 * Get the site's products.
	 *
	 * @uses get_option()
	 *
	 * @access public
	 * @static
	 *
	 * @return array Active Jetpack products
	 */
	public static function get_products() {
		return get_option( self::SITE_PRODUCTS_OPTION, array() );
	}

	/**
	 * Get the class of plan and a list of features it supports
	 *
	 * @param string $plan_slug The plan that we're interested in.
	 * @return array Two item array, the plan class and the an array of features.
	 */
	private static function get_class_and_features( $plan_slug ) {
		$features = array();
		foreach ( self::PLAN_DATA as $class => $details ) {
			$features = array_merge( $features, $details['supports'] );
			if ( in_array( $plan_slug, $details['plans'], true ) ) {
				return array( $class, $features );
			}
		}
		return array( 'free', self::PLAN_DATA['free']['supports'] );
	}

	/**
	 * Gets the minimum plan slug that supports the given feature
	 *
	 * @param string $feature The name of the feature.
	 * @return string|bool The slug for the minimum plan that supports.
	 *  the feature or false if not found
	 */
	public static function get_minimum_plan_for_feature( $feature ) {
		foreach ( self::PLAN_DATA as $details ) {
			if ( in_array( $feature, $details['supports'], true ) ) {
				return $details['plans'][0];
			}
		}
		return false;
	}

	/**
	 * Determine whether the active plan supports a particular feature
	 *
	 * @uses self::get()
	 *
	 * @access public
	 * @static
	 *
	 * @param string $feature The module or feature to check.
	 * @param bool   $refresh_from_wpcom Refresh the local plan cache from wpcom.
	 *
	 * @return bool True if plan supports feature, false if not
	 */
	public static function supports( $feature, $refresh_from_wpcom = false ) {
		if ( $refresh_from_wpcom ) {
			self::refresh_from_wpcom();
		}

		// Hijack the feature eligibility check on WordPress.com sites since they are gated differently.
		$should_wpcom_gate_feature = (
			function_exists( 'wpcom_site_has_feature' ) &&
			function_exists( 'wpcom_feature_exists' ) &&
			wpcom_feature_exists( $feature )
		);
		if ( $should_wpcom_gate_feature ) {
			return wpcom_site_has_feature( $feature );
		}

		// Search product bypasses plan feature check.
		if ( 'search' === $feature && (bool) get_option( 'has_jetpack_search_product' ) ) {
			return true;
		}

		// As of Q3 2021 - a videopress free tier is available to all plans.
		if ( 'videopress' === $feature ) {
			return true;
		}

		// As of 05 2023 - all plans support Earn features (minus 'simple-payments').
		if ( in_array( $feature, array( 'donations', 'recurring-payments', 'premium-content/container' ), true ) ) {
			return true;
		}

		$plan = self::get();

		if (
			in_array( $feature, $plan['supports'], true )
			|| in_array( $feature, $plan['features']['active'], true )
		) {
			return true;
		}

		return false;
	}

	/**
	 * Retrieve site-specific features for Simple sites.
	 *
	 * See Jetpack_Gutenberg::get_site_specific_features()
	 *
	 * @return array
	 */
	public static function get_simple_site_specific_features() {
		$is_simple_site = defined( 'IS_WPCOM' ) && constant( 'IS_WPCOM' );

		if ( ! $is_simple_site ) {
			return array(
				'active'    => array(),
				'available' => array(),
			);
		}

		$current_blog_id = get_current_blog_id();

		// Return the cached value if it exists.
		if ( isset( self::$simple_site_specific_features[ $current_blog_id ] ) ) {
			return self::$simple_site_specific_features[ $current_blog_id ];
		}

		if ( ! class_exists( '\Store_Product_List' ) ) {
			require WP_CONTENT_DIR . '/admin-plugins/wpcom-billing/store-product-list.php';
		}

		$simple_site_specific_features = \Store_Product_List::get_site_specific_features_data( $current_blog_id );

		self::$simple_site_specific_features[ $current_blog_id ] = $simple_site_specific_features;

		return $simple_site_specific_features;
	}
}
