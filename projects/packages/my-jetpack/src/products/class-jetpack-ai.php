<?php
/**
 * AI product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\My_Jetpack\Initializer;
use Automattic\Jetpack\My_Jetpack\Product;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use WP_Post;

/**
 * Class responsible for handling the Jetpack AI product
 */
class Jetpack_Ai extends Product {

	const CURRENT_TIER_SLUG  = 'free';
	const UPGRADED_TIER_SLUG = 'upgraded';

	/**
	 * The product slug
	 *
	 * @var string
	 */
	public static $slug = 'jetpack-ai';

	/**
	 * The category of the product
	 *
	 * @var string
	 */
	public static $category = 'create';

	/**
	 * Whether this product has a free offering
	 *
	 * @var bool
	 */
	public static $has_free_offering = true;

	/**
	 * The feature slug that identifies the paid plan
	 *
	 * @var string
	 */
	public static $feature_identifying_paid_plan = 'ai-assistant';

	/**
	 * Get the Product info for the API
	 *
	 * @throws \Exception If required attribute is not declared in the child class.
	 * @return array
	 */
	public static function get_info() {
		// Call parent method to get the default info.
		$info = parent::get_info();

		// Populate the product with the feature data.
		$info['ai-assistant-feature'] = self::get_ai_assistant_feature();

		return $info;
	}

	/**
	 * Get the plugin slug - ovewrite it and return Jetpack's
	 *
	 * @return ?string
	 */
	public static function get_plugin_slug() {
		return self::JETPACK_PLUGIN_SLUG;
	}

	/**
	 * Get the plugin filename - ovewrite it and return Jetpack's
	 *
	 * @return ?string
	 */
	public static function get_plugin_filename() {
		return self::JETPACK_PLUGIN_FILENAME;
	}

	/**
	 * Get the product name
	 *
	 * @return string
	 */
	public static function get_name() {
		return 'AI';
	}

	/**
	 * Get the product title
	 *
	 * @return string
	 */
	public static function get_title() {
		return 'Jetpack AI';
	}

	/**
	 * Get the product's available tiers
	 *
	 * @return string[] Slugs of the available tiers
	 */
	public static function get_tiers() {
		if ( ! self::are_tier_plans_enabled() ) {
			return parent::get_tiers();
		}

		return array(
			self::UPGRADED_TIER_SLUG,
			self::CURRENT_TIER_SLUG,
		);
	}

	/**
	 * Get the internationalized comparison of free vs upgraded features
	 *
	 * @return array[] Protect features comparison
	 */
	public static function get_features_by_tier() {
		if ( ! self::are_tier_plans_enabled() ) {
			return parent::get_features_by_tier();
		}

		$current_tier        = self::get_current_usage_tier();
		$current_description = 0 === $current_tier
			? __( 'Up to 20 requests', 'jetpack-my-jetpack' )
			/* translators: number of requests */
			: sprintf( __( 'Up to %d requests per month', 'jetpack-my-jetpack' ), $current_tier );
		$next_tier        = self::get_next_usage_tier();
		$next_description = $next_tier === null
			? __( 'Let\'s get in touch', 'jetpack-my-jetpack' )
			/* translators: number of requests */
			: sprintf( __( 'Up to %d requests per month', 'jetpack-my-jetpack' ), $next_tier );

		return array(
			array(
				'name'  => __( 'Number of requests', 'jetpack-my-jetpack' ),
				'info'  => array(
					'title'   => __( 'Requests', 'jetpack-my-jetpack' ),
					'content' => __( 'Increase your monthly request limit. Upgrade now and have the option to further increase your requests with additional upgrades.', 'jetpack-my-jetpack' ),
				),
				'tiers' => array(
					self::CURRENT_TIER_SLUG  => array(
						'included'    => true,
						'description' => $current_description,
					),
					self::UPGRADED_TIER_SLUG => array(
						'included'    => true,
						'description' => $next_description,
					),
				),
			),
			array(
				'name'  => __( 'Generate and edit content', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::CURRENT_TIER_SLUG  => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Build forms from prompts', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::CURRENT_TIER_SLUG  => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Get feedback on posts', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::CURRENT_TIER_SLUG  => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
			array(
				'name'  => __( 'Generate featured images', 'jetpack-my-jetpack' ),
				'tiers' => array(
					self::CURRENT_TIER_SLUG  => array( 'included' => true ),
					self::UPGRADED_TIER_SLUG => array( 'included' => true ),
				),
			),
		);
	}

	/**
	 * Get the current usage tier
	 *
	 * @return int
	 */
	public static function get_current_usage_tier() {
		if ( ! self::is_site_connected() ) {
			return 0;
		}

		$info = self::get_ai_assistant_feature();

		// Bail early if it's not possible to fetch the feature data.
		if ( is_wp_error( $info ) ) {
			return 0;
		}

		$current_tier = isset( $info['current-tier']['value'] ) ? $info['current-tier']['value'] : null;

		return $current_tier;
	}

	/**
	 * Get the next usage tier
	 *
	 * @return int
	 */
	public static function get_next_usage_tier() {
		if ( ! self::is_site_connected() || ! self::has_paid_plan_for_product() ) {
			// without site connection we can't know if tiers are enabled or not,
			// hence we can't know if the next tier is 100 or 1 (unlimited).
			return 100;
		}

		$info = self::get_ai_assistant_feature();

		// Bail early if it's not possible to fetch the feature data or if it's included in a plan.
		if ( is_wp_error( $info ) || empty( $info ) ) {
			return null;
		}

		// Trust the next tier provided by the feature data.
		$next_tier = isset( $info['next-tier']['value'] ) ? $info['next-tier']['value'] : null;

		return $next_tier;
	}

	/**
	 * Get the internationalized product description
	 *
	 * @return string
	 */
	public static function get_description() {
		return __( 'Enhance your writing and productivity with our AI suite', 'jetpack-my-jetpack' );
	}

	/**
	 * Get the internationalized usage tier long description by tier
	 *
	 * @param int $tier The usage tier.
	 * @return string
	 */
	public static function get_long_description_by_usage_tier( $tier ) {
		$long_descriptions  = array(
			1   => __( 'Jetpack AI Assistant brings the power of AI right into your WordPress editor, letting your content creation soar to new heights.', 'jetpack-my-jetpack' ),
			100 => __( 'The most advanced AI technology Jetpack has to offer.', 'jetpack-my-jetpack' ),
		);
		$tiered_description = __( 'Upgrade and increase the amount of your available monthly requests to continue using the most advanced AI technology Jetpack has to offer.', 'jetpack-my-jetpack' );

		return isset( $long_descriptions[ $tier ] ) ? $long_descriptions[ $tier ] : $tiered_description;
	}

	/**
	 * Get the internationalized product long description
	 *
	 * @return string
	 */
	public static function get_long_description() {
		$next_tier = self::get_next_usage_tier();

		return self::get_long_description_by_usage_tier( $next_tier );
	}

	/**
	 * Get the internationalized usage tier features by tier
	 *
	 * @param int $tier The usage tier.
	 * @return string
	 */
	public static function get_features_by_usage_tier( $tier ) {
		$is_tier_plan = $tier && intval( $tier ) > 1;

		if ( $tier === 100 && ( ! self::is_site_connected() || ! self::has_paid_plan_for_product() ) ) {
			// in these cases, get_next_usage_tier() will return 100
			// 100 is fine as default when tiered plans are enabled, but not otherwise
			$is_tier_plan = false;
		}

		$features = array(
			__( 'High request capacity *', 'jetpack-my-jetpack' ),
			__( 'Generate text, tables, lists, and forms', 'jetpack-my-jetpack' ),
			__( 'Easily refine content to your liking', 'jetpack-my-jetpack' ),
			__( 'Make your content easier to read', 'jetpack-my-jetpack' ),
			__( 'Generate images with one-click', 'jetpack-my-jetpack' ),
			__( 'Optimize your titles for better performance', 'jetpack-my-jetpack' ),
			__( 'Priority support', 'jetpack-my-jetpack' ),
		);

		$tiered_features = array(
			__( 'Prompt based content generation', 'jetpack-my-jetpack' ),
			__( 'Generate text, tables, and lists', 'jetpack-my-jetpack' ),
			__( 'Adaptive tone adjustment', 'jetpack-my-jetpack' ),
			__( 'Superior spelling and grammar correction', 'jetpack-my-jetpack' ),
			__( 'Title & summary generation', 'jetpack-my-jetpack' ),
			__( 'Priority support', 'jetpack-my-jetpack' ),
			/* translators: %d is the number of requests. */
			sprintf( __( 'Up to %d requests per month', 'jetpack-my-jetpack' ), $tier ),
		);

		return $is_tier_plan ? $tiered_features : $features;
	}

	/**
	 * Get the internationalized features list
	 *
	 * @return array Jetpack AI features list
	 */
	public static function get_features() {
		$next_tier = self::get_next_usage_tier();

		return self::get_features_by_usage_tier( $next_tier );
	}

	/**
	 * Get the product pricing details by tier
	 *
	 * @param int|null $tier The usage tier.
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui_by_usage_tier( $tier ) {
		if ( $tier === null ) {
			return array();
		}

		$product = Wpcom_Products::get_product( static::get_wpcom_product_slug() );

		if ( empty( $product ) ) {
			return array();
		}

		$tier_plans_enabled = self::are_tier_plans_enabled();

		/*
		 * when tiers are enabled and the price tier list is empty,
		 * we may need to renew the cache for the product data so
		 * we get the new price tier list.
		 *
		 * if the list is still empty after the fresh data, we will
		 * default to empty pricing (by returning an empty array).
		 */
		if ( empty( $product->price_tier_list ) && $tier_plans_enabled ) {
			$product = Wpcom_Products::get_product( static::get_wpcom_product_slug(), true );
		}

		// get the base pricing for the unlimited plan, for compatibility
		$base_pricing = Wpcom_Products::get_product_pricing( static::get_wpcom_product_slug() );

		$price_tier_list = $product->price_tier_list;
		$yearly_prices   = array();

		foreach ( $price_tier_list as $price_tier ) {
			if ( isset( $price_tier->maximum_units ) && isset( $price_tier->maximum_price ) ) {
					// The prices are in cents
					$yearly_prices[ $price_tier->maximum_units ] = $price_tier->maximum_price / 100;
			}
		}

		// add the base pricing to the list
		$prices = array( 1 => $base_pricing );

		foreach ( $yearly_prices as $units => $price ) {
			$prices[ $units ] = array_merge(
				$base_pricing,
				array(
					'full_price'            => $price,
					'discount_price'        => $price,
					'is_introductory_offer' => false,
					'introductory_offer'    => null,
				)
			);
		}

		return isset( $prices[ $tier ] ) ? $prices[ $tier ] : array();
	}

	/**
	 * Get the product pricing details
	 *
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui() {
		// no tiers
		if ( ! self::are_tier_plans_enabled() ) {
			return array_merge(
				array(
					'available'          => true,
					'wpcom_product_slug' => static::get_wpcom_product_slug(),
				),
				// hardcoding 1 as next tier if tiers are not enabled
				self::get_pricing_for_ui_by_usage_tier( 1 )
			);
		}

		$next_tier              = self::get_next_usage_tier();
		$current_tier           = self::get_current_usage_tier();
		$current_call_to_action = $current_tier === 0
			? __( 'Continue for free', 'jetpack-my-jetpack' )
			: __( 'I\'m fine with my plan, thanks', 'jetpack-my-jetpack' );
		$next_call_to_action    = $next_tier === null
			? __( 'Contact Us', 'jetpack-my-jetpack' )
			: __( 'Upgrade', 'jetpack-my-jetpack' );

		return array(
			'tiers' => array(
				self::CURRENT_TIER_SLUG  => array_merge(
					self::get_pricing_for_ui_by_usage_tier( $current_tier ),
					array(
						'available'      => true,
						'is_free'        => true,
						'call_to_action' => $current_call_to_action,
					)
				),
				self::UPGRADED_TIER_SLUG => array_merge(
					self::get_pricing_for_ui_by_usage_tier( $next_tier ),
					array(
						'wpcom_product_slug' => static::get_wpcom_product_slug(),
						'quantity'           => $next_tier,
						'call_to_action'     => $next_call_to_action,
					)
				),
			),
		);
	}

	/**
	 * Get the WPCOM product slug used to make the purchase
	 *
	 * @return string
	 */
	public static function get_wpcom_product_slug() {
		return 'jetpack_ai_yearly';
	}

	/**
	 * Get the WPCOM monthly product slug used to make the purchase
	 *
	 * @return string
	 */
	public static function get_wpcom_monthly_product_slug() {
		return 'jetpack_ai_monthly';
	}

	/**
	 * Get the WPCOM bi-yearly product slug used to make the purchase
	 *
	 * @return string
	 */
	public static function get_wpcom_bi_yearly_product_slug() {
		return 'jetpack_ai_bi_yearly';
	}

	/**
	 * Get the product-slugs of the paid plans for this product.
	 * (Do not include bundle plans, unless it's a bundle plan itself).
	 *
	 * @return array
	 */
	public static function get_paid_plan_product_slugs() {
		return array(
			'jetpack_ai_yearly',
			'jetpack_ai_monthly',
			'jetpack_ai_bi_yearly',
		);
	}

	/**
	 * Checks whether the product can be upgraded to a different product.
	 *
	 * @return boolean
	 */
	public static function is_upgradable() {
		$has_ai_feature     = static::does_site_have_feature( 'ai-assistant' );
		$tier_plans_enabled = self::are_tier_plans_enabled();
		$current_tier       = self::get_current_usage_tier();

		if ( $has_ai_feature && ! $tier_plans_enabled && $current_tier >= 1 ) {
			return false;
		}

		$next_tier = self::get_next_usage_tier();

		// The check below is debatable, not having the feature should not flag as not upgradable.
		// If user is free (tier = 0), not unlimited (tier = 1) and has a next tier, then it's upgradable.
		if ( $current_tier !== null && $current_tier !== 1 && $next_tier ) {
			return true;
		}

		// Mark as not upgradable if user is on unlimited tier or does not have any plan.
		if ( ! $has_ai_feature || null === $current_tier || 1 === $current_tier ) {
			return false;
		}

		return true;
	}

	/**
	 * Get the URL the user is taken after purchasing the product through the checkout
	 *
	 * @return ?string
	 */
	public static function get_post_checkout_url() {
		return self::get_manage_url();
	}

	/**
	 * Get the URL the user is taken after activating the product through the checkout
	 *
	 * @return ?string
	 */
	public static function get_post_activation_url() {
		return self::get_manage_url();
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return admin_url( 'admin.php?page=my-jetpack#/jetpack-ai' );
	}

	/**
	 * Checks whether the plugin is installed
	 *
	 * @return boolean
	 */
	public static function is_plugin_installed() {
		return self::is_jetpack_plugin_installed();
	}

	/**
	 * Checks whether the plugin is active
	 *
	 * @return boolean
	 */
	public static function is_plugin_active() {
		return (bool) static::is_jetpack_plugin_active();
	}

	/**
	 * Get data about the AI Assistant feature
	 *
	 * @return array
	 */
	public static function get_ai_assistant_feature() {
		// Bail early if the plugin is not active.
		if ( ! self::is_jetpack_plugin_installed() ) {
			return array();
		}

		// Check if the global constant is defined.
		if ( ! defined( 'JETPACK__PLUGIN_DIR' ) ) {
			return array();
		}

		// Bail early if the site is not connected.
		if ( ! self::is_site_connected() ) {
			return array();
		}

		// Check if class exists. If not, try to require it once.
		if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
			$class_file_path = JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';

			// Check whether the file exists
			if ( ! file_exists( $class_file_path ) ) {
				return array();
			}

			require_once $class_file_path;
		}

		return \Jetpack_AI_Helper::get_ai_assistance_feature();
	}

	/**
	 * Get the AI Assistant tiered plans status
	 *
	 * @return boolean
	 */
	public static function are_tier_plans_enabled() {
		$info = self::get_ai_assistant_feature();
		if ( is_wp_error( $info ) ) {
			// this is another faulty default value, we'll assume disabled while
			// production is enabled
			return false;
		}

		if ( ! empty( $info ) && isset( $info['tier-plans-enabled'] ) ) {
			return boolval( $info['tier-plans-enabled'] );
		}
		return false;
	}

	/**
	 * Checks whether the site is connected to WordPress.com.
	 *
	 * @return boolean
	 */
	private static function is_site_connected() {
		return ( new Connection_Manager() )->is_connected();
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * NOTE: this method is the only thing that resembles an initialization for the product.
	 *
	 * @return void
	 */
	public static function extend_plugin_action_links() {
		add_action( 'myjetpack_enqueue_scripts', array( static::class, 'admin_enqueue_scripts' ) );
		add_filter( 'default_content', array( static::class, 'add_ai_block' ), 10, 2 );
	}

	/**
	 * Enqueue the AI Assistant script
	 *
	 * The script is just a global variable used for the nonce, needed for the create post link.
	 *
	 * @return void
	 */
	public static function admin_enqueue_scripts() {
		wp_register_script(
			'my_jetpack_ai_app',
			false,
			array(),
			Initializer::PACKAGE_VERSION,
			array( 'in_footer' => true )
		);
		wp_localize_script(
			'my_jetpack_ai_app',
			'jetpackAi',
			array(
				'nonce' => wp_create_nonce( 'ai-assistant-content-nonce' ),
			)
		);
		wp_enqueue_script( 'my_jetpack_ai_app' );
	}

	/**
	 * Add AI block to the post content
	 *
	 * Used only from the link on the product page, the filter will insert an AI Assistant block in the post content.
	 *
	 * @param string  $content The post content.
	 * @param WP_Post $post The post object.
	 * @return string
	 */
	public static function add_ai_block( $content, $post ) {
		if ( isset( $_GET['use_ai_block'] ) && isset( $_GET['_wpnonce'] )
			&& wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'ai-assistant-content-nonce' )
			&& ! empty( $post )
			&& ! is_wp_error( $post )
			&& current_user_can( 'edit_post', $post->ID )
			&& '' === $content
		) {
			return '<!-- wp:jetpack/ai-assistant /-->';
		}
		return $content;
	}
}
