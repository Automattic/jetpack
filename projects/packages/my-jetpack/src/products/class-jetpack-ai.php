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
		if ( ! apply_filters( 'my_jetpack_use_new_ai_page', false ) ) {
			return array();
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
		if ( ! apply_filters( 'my_jetpack_use_new_ai_page', false ) ) {
			return array();
		}
		$current_tier        = self::get_current_usage_tier();
		$current_description = $current_tier === 0
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
			return null;
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
		if ( ! self::is_site_connected() ) {
			return 100;
		}

		$info = self::get_ai_assistant_feature();

		// Bail early if it's not possible to fetch the feature data.
		if ( is_wp_error( $info ) ) {
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
		return __( 'The most powerful AI tool for WordPress', 'jetpack-my-jetpack' );
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
		$features = array(
			1 => array(
				__( 'Artificial intelligence chatbot', 'jetpack-my-jetpack' ),
				__( 'Generate text, tables, lists, and forms', 'jetpack-my-jetpack' ),
				__( 'Refine the tone and content to your liking', 'jetpack-my-jetpack' ),
				__( 'Get feedback about your post', 'jetpack-my-jetpack' ),
				__( 'Seamless WordPress editor integration', 'jetpack-my-jetpack' ),
			),
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

		return isset( $features[ $tier ] ) ? $features[ $tier ] : $tiered_features;
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
	 * @param int $tier The usage tier.
	 * @return array Pricing details
	 */
	public static function get_pricing_for_ui_by_usage_tier( $tier ) {
		$product = Wpcom_Products::get_product( static::get_wpcom_product_slug() );

		if ( empty( $product ) ) {
			return array();
		}

		// get info about the feature.
		$info = self::get_ai_assistant_feature();

		// flag to indicate if the tiers are enabled, case the info is available.
		$tier_plans_enabled = ( ! is_wp_error( $info ) && isset( $info['tier-plans-enabled'] ) ) ? boolval( $info['tier-plans-enabled'] ) : false;

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
		$next_tier = self::get_next_usage_tier();

		if ( ! apply_filters( 'my_jetpack_use_new_ai_page', false ) ) {
			return array_merge(
				array(
					'available'          => true,
					'wpcom_product_slug' => static::get_wpcom_product_slug(),
				),
				self::get_pricing_for_ui_by_usage_tier( $next_tier )
			);
		}

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
	 * Checks whether the current plan (or purchases) of the site already supports the product
	 *
	 * @return boolean
	 */
	public static function has_required_plan() {
		return static::does_site_have_feature( 'ai-assistant' );
	}

	/**
	 * Checks whether the product can be upgraded to a different product.
	 *
	 * @return boolean
	 */
	public static function is_upgradable() {
		$has_required_plan = self::has_required_plan();
		$current_tier      = self::get_current_usage_tier();

		// Mark as not upgradable if user is on unlimited tier or does not have any plan.
		if ( ! $has_required_plan || null === $current_tier || 1 === $current_tier ) {
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
		return '/wp-admin/admin.php?page=my-jetpack#/jetpack-ai';
	}

	/**
	 * Get the URL where the user manages the product
	 *
	 * @return ?string
	 */
	public static function get_manage_url() {
		return '/wp-admin/admin.php?page=my-jetpack#/add-jetpack-ai';
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
		add_action( 'admin_enqueue_scripts', array( static::class, 'admin_enqueue_scripts' ) );
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
			&& current_user_can( 'edit_post', $post->ID )
			&& '' === $content
		) {
			return '<!-- wp:jetpack/ai-assistant /-->';
		}
		return $content;
	}
}
