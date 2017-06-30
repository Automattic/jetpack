<?php

class Jetpack_Simple_Payments {
	// These have to be under 20 chars because that is CPT limit.
	static $post_type_order = 'jp_pay_order';
	static $post_type_product = 'jp_pay_product';

	// Classic singleton pattern:
	private static $instance;
	private function __construct() {}
	static function getInstance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
			self::$instance->register_init_hook();
		}
		return self::$instance;
	}

	private function register_init_hook() {
		add_action( 'init', array( $this, 'init_hook_action' ) );
	}

	public function init_hook_action() {
		add_filter( 'rest_api_allowed_post_types', array( $this, 'allow_rest_api_types' ) );
		$this->setup_cpts();
	}

	/**
	 * Allows custom post types to be used by REST API.
	 * @param $post_types
	 * @see hook 'rest_api_allowed_post_types'
	 * @return array
	 */
	function allow_rest_api_types( $post_types ) {
		$post_types[] = self::$post_type_order;
		$post_types[] = self::$post_type_product;
		return $post_types;
	}

	/**
	 * Sets up the custom post types for the module.
	 */
	function setup_cpts() {

		/*
		 * ORDER data structure. holds:
		 * title = customer name
		 * metadata:
		 * spay_paypal_id
		 * spay_status
		 * ... (WIP)
		 */
		$order_capabilities = array(
			'edit_post'             => 'edit_posts',
			'read_post'             => 'read_private_posts',
			'delete_post'           => 'delete_posts',
			'edit_posts'            => 'edit_posts',
			'edit_others_posts'     => 'edit_others_posts',
			'publish_posts'         => 'publish_posts',
			'read_private_posts'    => 'read_private_posts',
		);
		$order_args = array(
			'label'                 => __( 'Order', 'jetpack' ),
			'description'           => __( 'Simple Payments orders', 'jetpack' ),
			'supports'              => array( 'custom-fields' ),
			'hierarchical'          => false,
			'public'                => false,
			'show_ui'               => false,
			'show_in_menu'          => false,
			'show_in_admin_bar'     => false,
			'show_in_nav_menus'     => false,
			'can_export'            => true,
			'has_archive'           => false,
			'exclude_from_search'   => true,
			'publicly_queryable'    => false,
			'rewrite'               => false,
			'capabilities'          => $order_capabilities,
			'show_in_rest'          => true,
		);
		register_post_type( self::$post_type_order, $order_args );

		/*
		 * PRODUCT data structure. Holds:
		 * title - title
		 * content - description
		 * thumbnail - image
		 * metadata:
		 * spay_price - price
		 * spay_currency - currency code
		 * spay_cta - text with "Buy" or other CTA
		 * spay_email - paypal email
		 * spay_multiple - allow for multiple items
		 */
		$product_capabilities = array(
			'edit_post'             => 'edit_posts',
			'read_post'             => 'read_private_posts',
			'delete_post'           => 'delete_posts',
			'edit_posts'            => 'edit_posts',
			'edit_others_posts'     => 'edit_others_posts',
			'publish_posts'         => 'publish_posts',
			'read_private_posts'    => 'read_private_posts',
		);
		$product_args = array(
			'label'                 => __( 'Product', 'jetpack' ),
			'description'           => __( 'Simple Payments products', 'jetpack' ),
			'supports'              => array( 'title', 'editor','thumbnail', 'custom-fields' ),
			'hierarchical'          => false,
			'public'                => false,
			'show_ui'               => false,
			'show_in_menu'          => false,
			'show_in_admin_bar'     => false,
			'show_in_nav_menus'     => false,
			'can_export'            => true,
			'has_archive'           => false,
			'exclude_from_search'   => true,
			'publicly_queryable'    => false,
			'rewrite'               => false,
			'capabilities'          => $product_capabilities,
			'show_in_rest'          => true,
		);
		register_post_type( self::$post_type_product, $product_args );
	}

}
Jetpack_Simple_Payments::getInstance();
