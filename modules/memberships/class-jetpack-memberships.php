<?php
/**
 * WARNING: This file is distributed verbatim in Jetpack.
 * There should be nothing WordPress.com specific in this file.
 *
 * @package memberships
 * @hide-in-jetpack
 */

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
	static private $css_classname_prefix = 'jetpack-memberships';
	/**
	 * Increase this number each time there's a change in CSS or JS to bust cache.
	 *
	 * @var string
	 */
	static private $version = '0.03';
	/**
	 * Our CPT type for the product (plan).
	 *
	 * @var string
	 */
	static public $post_type_plan = 'jp_mem_plan';
	/**
	 * Button block type to use.
	 *
	 * @var string
	 */
	static private $button_block_name = 'membership-button';
	/**
	 * Classic singleton pattern
	 *
	 * @var Jetpack_Memberships
	 */
	private static $instance;

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
		$meta_prefix = 'mem_';
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
	 * Transform WP CPT post into array representing a memberships product.
	 *
	 * @param WP_Post $product_post - CPT representing the product.
	 * @return array
	 */
	public static function product_post_to_array( $product_post ) {
		$data    = array();
		$mapping = self::get_plan_property_mapping();
		foreach ( $mapping as $key => $map ) {
			$data[ $key ] = get_post_meta( $product_post->ID, $map['meta'], true );
		}
		$data['title']       = $product_post->post_title;
		$data['description'] = $product_post->post_content;
		$data['id']          = $product_post->ID;
		return $data;
	}

	/**
	 * Inits further hooks on init hook.
	 */
	private function register_init_hook() {
		add_action( 'init', array( $this, 'init_hook_action' ) );
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
			'description'         => esc_html__( 'Memberships plans', 'jetpack' ),
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
			function( $map ) {
				return $map['meta'];
			}, $this->get_plan_property_mapping()
		);
		return array_merge( $post_meta, array_values( $meta_keys ) );
	}

	/**
	 * Callback that parses the membership purchase shortcode.
	 *
	 * @param array       $attrs - attributes in the shortcode. `id` here is the CPT id of the plan.
	 * @param string|bool $content - needed for the callback.
	 *
	 * @return string|void
	 */
	public function render_button( $attrs ) {
		Jetpack_Gutenberg::load_assets_as_required( self::$button_block_name);

		if ( empty( $attrs['id'] ) ) {
			return;
		}
		$product = get_post( $attrs['id'] );
		if ( ! $product || is_wp_error( $product ) ) {
			return;
		}
		if ( $product->post_type !== self::$post_type_plan || 'trash' === $product->post_status ) {
			return;
		}
		$plan = self::product_post_to_array( $product );
		$data = array(
			'blog_id' => $this->get_blog_id(),
			'id'	  => $attrs['id'],
			'button_label' => sprintf( __sprintf( '$s Contribution' ),$this->format_price( $plan ) ),
			'powered_text' => sprintf( __( 'Powered by <a href="%s" target="_blank">WordPress.com</a>' ), 'https://wordpress.com' ),
		);

		$classes = array(
			'components-button',
			'is-primary',
			'is-button',
			'wp-block-jetpack-' . self::$button_block_name,
			self::$css_classname_prefix . '-' . $data['id'],
		);
		if ( isset( $attrs['className'] ) ) {
			array_push( $classes, $attrs['className'] );
		}
		if ( isset( $attrs['submitButtonText'] ) ) {
			$data['button_label'] = $attrs['submitButtonText'];
		}

		return sprintf(
			'<button data-blog-id="%i" data-powered-text="%s" data-plan-id="%i" class="%s">%s</button>',
			$data['blog_id'],
			$data['powered_text'],
			$data['id'],
			implode( $classes, ' ' ),
			$data['button_label']
		);
		return "<a class='{$data['class']}' style='{$data['style']}' id='{$data['dom_id']}'>{$data['content']}</a>";
	}

	private function get_blog_id() {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return get_current_blog_id();
		}

		return Jetpack_Options::get_option( 'id' );
	}


	/**
	 * Formats the price.
	 *
	 * @param array $plan - array representing the plan.
	 *
	 * @return string
	 */
	private function format_price( $plan ) {
		if ( $plan['formatted_price'] ) {
			return $plan['formatted_price'];
		}
		return "{$plan['price']} {$plan['currency']}";
	}
}
