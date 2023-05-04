<?php
/**
 * Search product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\My_Jetpack\Hybrid_Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;

/**
 * Class responsible for handling the Social product
 */
class Social extends Hybrid_Product {

	const FREE_TIER_SLUG     = 'free';
	const BASIC_TIER_SLUG    = 'basic';
	const ADVANCED_TIER_SLUG = 'advanced';

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'social';

	/**
	 * The Jetpack module name
	 *
	 * @var string
	 */
	public static $module_name = 'publicize';

	/**
	 * The slug of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_slug = 'jetpack-social';

	/**
	 * Social has a standalone plugin
	 *
	 * @var bool
	 */
	public static $has_standalone_plugin = true;

	/**
	 * The filename (id) of the plugin associated with this product.
	 *
	 * @var string
	 */
	public static $plugin_filename = array(
		'jetpack-social/jetpack-social.php',
		'social/jetpack-social.php',
		'jetpack-social-dev/jetpack-social.php',
	);

	/**
	 * Get the internationalized product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return __( 'Social', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return __( 'Jetpack Social', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Write once, post anywhere', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		return __( 'Promote your content on social media by automatically publishing when you publish on your site.', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Social features list
	 */
	public static function get_features() {
		return array(
			__( 'Post to social networks', 'jetpack-my-jetpack' ),
			__( 'Schedule publishing', 'jetpack-my-jetpack' ),
			__( 'Supports the major social networks', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * Get the product's available tiers
	 *
	 * @return string[] Slugs of the available tiers
	 */
	public static function get_tiers() {
		return array(
			self::ADVANCED_TIER_SLUG,
			self::BASIC_TIER_SLUG,
			self::FREE_TIER_SLUG,
		);
	}

	/**
	 * Get the internationalized comparison of free vs upgraded features
	 *
	 * @return array[] Protect features comparison
	 */
	public static function get_features_by_tier() {
		return array(
			array(
				'name'  => __( 'Number of shares in 30 days', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array(
						'included'    => true,
						'description' => __( 'Up to 30', 'jetpack-my-jetpack' ),
					),
					self::BASIC_TIER_SLUG    => array(
						'included'           => true,
						'struck_description' => __( 'Up to 1,000', 'jetpack-my-jetpack' ),
						'description'        => __( 'Unlimited', 'jetpack-my-jetpack' ),
						'info'               => array(
							'title'   => __( 'Unlimited shares', 'jetpack-my-jetpack' ),
							'content' => __( 'We are working on exciting new features for Jetpack Social. In the meantime, enjoy unlimited shares for a limited time!', 'jetpack-my-jetpack' ),
						),
					),
					self::ADVANCED_TIER_SLUG => array(
						'included'           => true,
						'struck_description' => __( 'Up to 1,000', 'jetpack-my-jetpack' ),
						'description'        => __( 'Unlimited', 'jetpack-my-jetpack' ),
						'info'               => array(
							'title'   => __( 'Unlimited shares', 'jetpack-my-jetpack' ),
							'content' => __( 'We are working on exciting new features for Jetpack Social. In the meantime, enjoy unlimited shares for a limited time!', 'jetpack-my-jetpack' ),
						),
					),
				),
			),
			array(
				'name'  => __( 'Priority support', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::BASIC_TIER_SLUG    => array( 'included' => true ),
					self::ADVANCED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Schedule posting', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::BASIC_TIER_SLUG    => array( 'included' => true ),
					self::ADVANCED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Twitter, Facebook, LinkedIn & Tumblr', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::BASIC_TIER_SLUG    => array( 'included' => true ),
					self::ADVANCED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Customize publications', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::BASIC_TIER_SLUG    => array( 'included' => true ),
					self::ADVANCED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Recycle content', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __( 'Repurpose, reuse or republish already published content.', 'jetpack-my-jetpack' ),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => true ),
					self::BASIC_TIER_SLUG    => array( 'included' => true ),
					self::ADVANCED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Engagement optimizer', 'jetpack-my-jetpack' ),
				'info'  => array(
					'content' => __( 'Enhance social media engagement with personalized posts.', 'jetpack-my-jetpack' ),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::BASIC_TIER_SLUG    => array( 'included' => false ),
					self::ADVANCED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Video sharing', 'jetpack-my-jetpack' ),
				'info'  => array(
					'title'   => __( 'Coming soon', 'jetpack-my-jetpack' ),
					'content' => __( 'Upload and share videos to your social platforms.', 'jetpack-my-jetpack' ),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::BASIC_TIER_SLUG    => array( 'included' => false ),
					self::ADVANCED_TIER_SLUG => array(
						'included'    => true,
						'description' => __( 'Coming soon', 'jetpack-my-jetpack' ),
					),
				),
			),
			array(
				'name'  => __( 'Multi-image sharing', 'jetpack-my-jetpack' ),
				'info'  => array(
					'title'   => __( 'Coming soon', 'jetpack-my-jetpack' ),
					'content' => __( 'Share multiple images at once on social media platforms.', 'jetpack-my-jetpack' ),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::BASIC_TIER_SLUG    => array( 'included' => false ),
					self::ADVANCED_TIER_SLUG => array(
						'included'    => true,
						'description' => __( 'Coming soon', 'jetpack-my-jetpack' ),
					),
				),
			),
			array(
				'name'  => __( 'Image generator', 'jetpack-my-jetpack' ),
				'info'  => array(
					'title'   => __( 'Coming soon', 'jetpack-my-jetpack' ),
					'content' => __( 'Automatically create custom images, saving you hours of tedious work.', 'jetpack-my-jetpack' ),
				),
				'tiers' => array(
					self::FREE_TIER_SLUG     => array( 'included' => false ),
					self::BASIC_TIER_SLUG    => array( 'included' => false ),
					self::ADVANCED_TIER_SLUG => array(
						'included'    => true,
						'description' => __( 'Coming soon', 'jetpack-my-jetpack' ),
					),
				),
			),
		);
	}

	/**
	 * Get the product pricing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		return array(
			'tiers'                       => array(
				self::FREE_TIER_SLUG     => array(
					'available' => true,
					'is_free'   => true,
				),
				self::BASIC_TIER_SLUG    => array_merge(
					array(
						'available'          => true,
						'wpcom_product_slug' => 'jetpack_social_basic_yearly',
						'call_to_action'     => __( 'Get Basic plan', 'jetpack-my-jetpack' ),
					),
					Wpcom_Products::get_product_pricing( 'jetpack_social_basic_yearly' )
				),
				self::ADVANCED_TIER_SLUG => array_merge(
					array(
						'available'          => true,
						'wpcom_product_slug' => 'jetpack_social_advanced_yearly',
						'call_to_action'     => __( 'Get Advanced plan', 'jetpack-my-jetpack' ),
					),
					Wpcom_Products::get_product_pricing( 'jetpack_social_advanced_yearly' )
				),
			),
			'show_intro_offer_disclaimer' => true,
		);
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_social';
	}

	/**
	 * Get the URL where the user manages the product.
	 *
	 * If the standalone plugin is active,
	 * it will redirect to the standalone plugin settings page.
	 * Otherwise, it will redirect to the Jetpack settings page.
	 *
	 * @return string
	 */
	public static function get_manage_url() {
		if ( static::is_standalone_plugin_active() ) {
			return admin_url( 'admin.php?page=jetpack-social' );
		}

		return admin_url( 'admin.php?page=jetpack#/settings?term=publicize' );
	}

	/**
	 * Has Required Tier
	 *
	 * @return array Array of tier slugs and whether or not they are supported.
	 */
	public static function has_required_tier() {
		static $has_paid_plan = null;
		if ( ! $has_paid_plan ) {
			$has_paid_plan = Current_Plan::supports( 'social-shares-1000' );
		}

		return array(
			self::FREE_TIER_SLUG     => true,
			self::BASIC_TIER_SLUG    => $has_paid_plan,
			self::ADVANCED_TIER_SLUG => $has_paid_plan,
		);
	}

	/**
	 * Activates the product by installing and activating its plugin
	 *
	 * @param bool|WP_Error $current_result Is the result of the top level activation actions. You probably won't do anything if it is an WP_Error.
	 * @return boolean|\WP_Error
	 */
	public static function do_product_specific_activation( $current_result ) {

		$product_activation = parent::do_product_specific_activation( $current_result );

		if ( is_wp_error( $product_activation ) && 'module_activation_failed' === $product_activation->get_error_code() ) {
			// A bundle is not a module. There's nothing in the plugin to be activated, so it's ok to fail to activate the module.
			$product_activation = true;
		}

		// We just "got started" in My Jetpack, so skip the in-plugin experience.
		update_option( 'jetpack-social_show_pricing_page', false );

		return $product_activation;
	}
}
