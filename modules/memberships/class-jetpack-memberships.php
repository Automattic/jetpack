<?php
/**
 * Jetpack_Memberships: wrapper for memberships functions.
 *
 * @package    Jetpack
 * @since      7.3.0
 */

use Automattic\Jetpack\Blocks;

/**
 * Class Jetpack_Memberships
 * This class represents the Memberships functionality.
 */
class Jetpack_Memberships {
	/**
	 * CSS class prefix to use in the styling.
	 *
	 * @var string
	 */
	public static $css_classname_prefix = 'jetpack-memberships';
	/**
	 * Our CPT type for the product (plan).
	 *
	 * @var string
	 */
	public static $post_type_plan = 'jp_mem_plan';
	/**
	 * Option that will store currently set up account (Stripe etc) id for memberships.
	 *
	 * @var string
	 */
	public static $connected_account_id_option_name = 'jetpack-memberships-connected-account-id';
	/**
	 * Button block type to use.
	 *
	 * @var string
	 */
	private static $button_block_name = 'recurring-payments';

	/**
	 * These are defaults for wp_kses ran on the membership button.
	 *
	 * @var array
	 */
	private static $tags_allowed_in_the_button = array( 'br' => array() );

	/**
	 * The minimum required plan for this Gutenberg block.
	 *
	 * @var string Plan slug
	 */
	private static $required_plan;

	/**
	 * Track recurring payments block registration.
	 *
	 * @var boolean True if block registration has been executed.
	 */
	private static $has_registered_block = false;

	/**
	 * Classic singleton pattern
	 *
	 * @var Jetpack_Memberships
	 */
	private static $instance;

	/**
	 * Currencies we support and Stripe's minimum amount for a transaction in that currency.
	 *
	 * @link https://stripe.com/docs/currencies#minimum-and-maximum-charge-amounts
	 *
	 * List has to be in with `SUPPORTED_CURRENCIES` in extensions/shared/currencies.js and
	 * `Memberships_Product::SUPPORTED_CURRENCIES` in the WP.com memberships library.
	 */
	const SUPPORTED_CURRENCIES = array(
		'USD' => 0.5,
		'AUD' => 0.5,
		'BRL' => 0.5,
		'CAD' => 0.5,
		'CHF' => 0.5,
		'DKK' => 2.5,
		'EUR' => 0.5,
		'GBP' => 0.3,
		'HKD' => 4.0,
		'INR' => 0.5,
		'JPY' => 50,
		'MXN' => 10,
		'NOK' => 3.0,
		'NZD' => 0.5,
		'PLN' => 2.0,
		'SEK' => 3.0,
		'SGD' => 0.5,
	);

	/**
	 * Jetpack_Memberships constructor.
	 */
	private function __construct() {}

	/**
	 * The actual constructor initializing the object.
	 *
	 * @return Jetpack_Memberships
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
			self::$instance->register_init_hook();
			// Yes, `personal-bundle` with a dash, `jetpack_personal` with an underscore. Check the v1.5 endpoint to verify.
			self::$required_plan = ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ? 'personal-bundle' : 'jetpack_personal';
		}

		return self::$instance;
	}
	/**
	 * Get the map that defines the shape of CPT post. keys are names of fields and
	 * 'meta' is the name of actual WP post meta field that corresponds.
	 *
	 * @return array
	 */
	private static function get_plan_property_mapping() {
		$meta_prefix = 'jetpack_memberships_';
		$properties  = array(
			'price'    => array(
				'meta' => $meta_prefix . 'price',
			),
			'currency' => array(
				'meta' => $meta_prefix . 'currency',
			),
		);
		return $properties;
	}

	/**
	 * Inits further hooks on init hook.
	 */
	private function register_init_hook() {
		add_action( 'init', array( $this, 'init_hook_action' ) );
		add_action( 'jetpack_register_gutenberg_extensions', array( $this, 'register_gutenberg_block' ) );
	}

	/**
	 * Actual hooks initializing on init.
	 */
	public function init_hook_action() {
		add_filter( 'rest_api_allowed_post_types', array( $this, 'allow_rest_api_types' ) );
		add_filter( 'jetpack_sync_post_meta_whitelist', array( $this, 'allow_sync_post_meta' ) );
		$this->setup_cpts();
	}

	/**
	 * Sets up the custom post types for the module.
	 */
	private function setup_cpts() {
		/*
		 * PLAN data structure.
		 */
		$capabilities = array(
			'edit_post'          => 'edit_posts',
			'read_post'          => 'read_private_posts',
			'delete_post'        => 'delete_posts',
			'edit_posts'         => 'edit_posts',
			'edit_others_posts'  => 'edit_others_posts',
			'publish_posts'      => 'publish_posts',
			'read_private_posts' => 'read_private_posts',
		);
		$order_args   = array(
			'label'               => esc_html__( 'Plan', 'jetpack' ),
			'description'         => esc_html__( 'Recurring Payments plans', 'jetpack' ),
			'supports'            => array( 'title', 'custom-fields', 'content' ),
			'hierarchical'        => false,
			'public'              => false,
			'show_ui'             => false,
			'show_in_menu'        => false,
			'show_in_admin_bar'   => false,
			'show_in_nav_menus'   => false,
			'can_export'          => true,
			'has_archive'         => false,
			'exclude_from_search' => true,
			'publicly_queryable'  => false,
			'rewrite'             => false,
			'capabilities'        => $capabilities,
			'show_in_rest'        => false,
		);
		register_post_type( self::$post_type_plan, $order_args );
	}

	/**
	 * Allows custom post types to be used by REST API.
	 *
	 * @param array $post_types - other post types.
	 *
	 * @see hook 'rest_api_allowed_post_types'
	 * @return array
	 */
	public function allow_rest_api_types( $post_types ) {
		$post_types[] = self::$post_type_plan;

		return $post_types;
	}

	/**
	 * Allows custom meta fields to sync.
	 *
	 * @param array $post_meta - previously changet post meta.
	 *
	 * @return array
	 */
	public function allow_sync_post_meta( $post_meta ) {
		$meta_keys = array_map(
			array( $this, 'return_meta' ),
			$this->get_plan_property_mapping()
		);
		return array_merge( $post_meta, array_values( $meta_keys ) );
	}

	/**
	 * This returns meta attribute of passet array.
	 * Used for array functions.
	 *
	 * @param array $map - stuff.
	 *
	 * @return mixed
	 */
	public function return_meta( $map ) {
		return $map['meta'];
	}

	/**
	 * Renders a preview of the Recurring Payment button, which is not hooked
	 * up to the subscription url. Used to preview the block on the frontend
	 * for site editors when Stripe has not been connected.
	 *
	 * @param array  $attrs - attributes in the shortcode.
	 * @param string $content - Recurring Payment block content.
	 *
	 * @return string|void
	 */
	public function render_button_preview( $attrs, $content = null ) {
		if ( ! empty( $content ) ) {
			$block_id = esc_attr( wp_unique_id( 'recurring-payments-block-' ) );
			$content  = str_replace( 'recurring-payments-id', $block_id, $content );
			return $content;
		}
		return $this->deprecated_render_button_v1( $attrs, null );
	}

	/**
	 * Determines whether the button preview should be rendered. Returns true
	 * if the user has editing permissions, the button is not configured correctly
	 * (because it requires a plan upgrade or Stripe connection), and the
	 * button is a child of a Premium Content block.
	 *
	 * @param WP_Block $block Recurring Payments block instance.
	 *
	 * @return boolean
	 */
	public function should_render_button_preview( $block ) {
		$user_can_edit              = $this->user_can_edit();
		$requires_stripe_connection = ! $this->get_connected_account_id();

		$requires_upgrade = ! self::is_supported_jetpack_recurring_payments();

		$is_premium_content_child = false;
		if ( isset( $block ) && isset( $block->context['isPremiumContentChild'] ) ) {
			$is_premium_content_child = (int) $block->context['isPremiumContentChild'];
		}

		return (
			$is_premium_content_child &&
			$user_can_edit &&
			( $requires_upgrade || $requires_stripe_connection )
		);
	}

	/**
	 * Callback that parses the membership purchase shortcode.
	 *
	 * @param array    $attributes - attributes in the shortcode. `id` here is the CPT id of the plan.
	 * @param string   $content - Recurring Payment block content.
	 * @param WP_Block $block - Recurring Payment block instance.
	 *
	 * @return string|void
	 */
	public function render_button( $attributes, $content, $block ) {
		Jetpack_Gutenberg::load_assets_as_required( self::$button_block_name, array( 'thickbox', 'wp-polyfill' ) );

		if ( $this->should_render_button_preview( $block ) ) {
			return $this->render_button_preview( $attributes, $content );
		}

		if ( empty( $attributes['planId'] ) ) {
			return;
		}

		$plan_id = (int) $attributes['planId'];
		$product = get_post( $plan_id );
		if ( ! $product || is_wp_error( $product ) ) {
			return;
		}
		if ( $product->post_type !== self::$post_type_plan || 'publish' !== $product->post_status ) {
			return;
		}

		add_thickbox();

		if ( ! empty( $content ) ) {
			$block_id      = esc_attr( wp_unique_id( 'recurring-payments-block-' ) );
			$content       = str_replace( 'recurring-payments-id', $block_id, $content );
			$subscribe_url = $this->get_subscription_url( $plan_id );
			return str_replace( 'href="#"', 'href="' . $subscribe_url . '"', $content );
		}

		return $this->deprecated_render_button_v1( $attributes, $plan_id );
	}

	/**
	 * Builds subscription URL for this membership using the current blog and
	 * supplied plan IDs.
	 *
	 * @param integer $plan_id - Unique ID for the plan being subscribed to.
	 * @return string
	 */
	public function get_subscription_url( $plan_id ) {
		global $wp;

		return add_query_arg(
			array(
				'blog'     => esc_attr( self::get_blog_id() ),
				'plan'     => esc_attr( $plan_id ),
				'lang'     => esc_attr( get_locale() ),
				'pid'      => esc_attr( get_the_ID() ), // Needed for analytics purposes.
				'redirect' => esc_attr( rawurlencode( home_url( $wp->request ) ) ), // Needed for redirect back in case of redirect-based flow.
			),
			'https://subscribe.wordpress.com/memberships/'
		);
	}

	/**
	 * Renders a deprecated legacy version of the button HTML.
	 *
	 * @param array   $attrs - Array containing the Recurring Payment block attributes.
	 * @param integer $plan_id - Unique plan ID the membership is for.
	 *
	 * @return string
	 */
	public function deprecated_render_button_v1( $attrs, $plan_id ) {
		$button_label = isset( $attrs['submitButtonText'] )
			? $attrs['submitButtonText']
			: __( 'Your contribution', 'jetpack' );

		$button_styles = array();
		if ( ! empty( $attrs['customBackgroundButtonColor'] ) ) {
			array_push(
				$button_styles,
				sprintf(
					'background-color: %s',
					sanitize_hex_color( $attrs['customBackgroundButtonColor'] )
				)
			);
		}
		if ( ! empty( $attrs['customTextButtonColor'] ) ) {
			array_push(
				$button_styles,
				sprintf(
					'color: %s',
					sanitize_hex_color( $attrs['customTextButtonColor'] )
				)
			);
		}
		$button_styles = implode( ';', $button_styles );

		return sprintf(
			'<div class="%1$s"><a role="button" %6$s href="%2$s" class="%3$s" style="%4$s">%5$s</a></div>',
			esc_attr(
				Jetpack_Gutenberg::block_classes(
					self::$button_block_name,
					$attrs,
					array( 'wp-block-button' )
				)
			),
			esc_url( $this->get_subscription_url( $plan_id ) ),
			isset( $attrs['submitButtonClasses'] ) ? esc_attr( $attrs['submitButtonClasses'] ) : 'wp-block-button__link',
			esc_attr( $button_styles ),
			wp_kses( $button_label, self::$tags_allowed_in_the_button ),
			isset( $attrs['submitButtonAttributes'] ) ? sanitize_text_field( $attrs['submitButtonAttributes'] ) : '' // Needed for arbitrary target=_blank on WPCOM VIP.
		);
	}

	/**
	 * Get current blog id.
	 *
	 * @return int
	 */
	public static function get_blog_id() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return get_current_blog_id();
		}

		return Jetpack_Options::get_option( 'id' );
	}

	/**
	 * Get the id of the connected payment acount (Stripe etc).
	 *
	 * @return int|void
	 */
	public static function get_connected_account_id() {
		return get_option( self::$connected_account_id_option_name );
	}

	/**
	 * Determines whether the current user can edit.
	 *
	 * @return bool Whether the user can edit.
	 */
	public static function user_can_edit() {
		$user = wp_get_current_user();
		// phpcs:ignore ImportDetection.Imports.RequireImports.Symbol
		return 0 !== $user->ID && current_user_can( 'edit_post', get_the_ID() );
	}

	/**
	 * Whether Recurring Payments are enabled. True if the block
	 * is supported by the site's plan, or if it is a Jetpack site
	 * and the feature to enable upgrade nudges is active.
	 *
	 * @return bool
	 */
	public static function is_enabled_jetpack_recurring_payments() {
		return (
			self::is_supported_jetpack_recurring_payments() ||
			(
				Jetpack::is_active() &&
				/** This filter is documented in class.jetpack-gutenberg.php */
				! apply_filters( 'jetpack_block_editor_enable_upgrade_nudge', false )
			)
		);
	}

	/**
	 * Whether the site's plan supports the Recurring Payments block.
	 */
	public static function is_supported_jetpack_recurring_payments() {
		// For WPCOM sites.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM && function_exists( 'has_any_blog_stickers' ) ) {
			$site_id = get_current_blog_id();
			return has_any_blog_stickers( array( 'personal-plan', 'premium-plan', 'business-plan', 'ecommerce-plan' ), $site_id );
		}
		// For Jetpack sites.
		return (
			Jetpack::is_active() &&
			Jetpack_Plan::supports( 'recurring-payments' )
		);
	}

	/**
	 * Register the Recurring Payments Gutenberg block
	 */
	public function register_gutenberg_block() {
		// This gate was introduced to prevent duplicate registration. A race condition exists where
		// the registration that happens via extensions/blocks/recurring-payments/recurring-payments.php
		// was adding the registration action after the action had been run in some contexts.
		if ( self::$has_registered_block ) {
			return;
		}

		if ( self::is_enabled_jetpack_recurring_payments() ) {
			$deprecated = function_exists( 'gutenberg_get_post_from_context' );
			$uses       = $deprecated ? 'context' : 'uses_context';
			Blocks::jetpack_register_block(
				'jetpack/recurring-payments',
				array(
					'render_callback' => array( $this, 'render_button' ),
					$uses             => array( 'isPremiumContentChild' ),
				)
			);
		} else {
			Jetpack_Gutenberg::set_extension_unavailable(
				'jetpack/recurring-payments',
				'missing_plan',
				array(
					'required_feature' => 'memberships',
					'required_plan'    => self::$required_plan,
				)
			);
		}

		self::$has_registered_block = true;
	}
}
Jetpack_Memberships::get_instance();
