<?php
/**
 * Module Name: Monetize Checkout
 * Module Description: Creates and manages the monetize checkout page for membership subscriptions.
 * Sort Order: 23
 * First Introduced: 14.0
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Monetization
 * Additional Search Queries: checkout, monetize, membership, payment
 * Requires Dependencies: subscriptions
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Monetize_Checkout class
 * Manages the monetize checkout page creation and maintenance.
 */
class Jetpack_Monetize_Checkout {

	/**
	 * Page meta key identifier
	 */
	const META_KEY = 'jp_mem_checkout';

	/**
	 * Base slug for the checkout page
	 */
	const BASE_SLUG = 'monetize-checkout';

	/**
	 * Singleton instance
	 *
	 * @var Jetpack_Monetize_Checkout
	 */
	private static $instance = null;

	/**
	 * Get singleton instance
	 *
	 * @return Jetpack_Monetize_Checkout
	 */
	public static function init() {

		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor
	 */
	private function __construct() {
		// Only activate if subscriptions module is active
		if ( ! $this->is_subscriptions_active() ) {
			return;
		}

		// Check and create page on init
		add_action( 'init', array( $this, 'ensure_checkout_page_exists' ) );
		add_action( 'init', array( $this, 'maybe_set_checkout_content' ) );
	}

	public function maybe_set_checkout_content() {
		$checkout_page = $this->find_checkout_page();
		if ( is_page( $checkout_page->ID ) ) {
			// Disable search engines from indexing the checkout page
			add_filter( 'wp_head', array( $this, 'empty_content' ), 1, PHP_INT_MAX );
			add_filter( 'wp_footer', array( $this, 'empty_content' ), 1, PHP_INT_MAX );
			add_filter( 'the_content', array( $this, 'return_checkout_content' ), 1, PHP_INT_MAX );
		}
	}

	/**
	 * Returns empty content for header/footer
	 */
	public function empty_content( $content ) {
		return '';
	}

	/**
	 * Returns custom content for the checkout page
	 */
	public function return_checkout_content( $content ) {
		// This is where we should retrieve the data from subscribe.wordpress.com
		return 'Some content from subscribe.wordpress.com';
	}

	/**
	 * Get the URL of the monetize checkout page
	 *
	 * @return string
	 */
	public function get_page_monetize_checkout_link() {
		$this->ensure_checkout_page_exists();

		$page = $this->find_checkout_page();

		return get_page_link( $page );
	}

	/**
	 * Check if subscriptions module is active
	 *
	 * @return bool
	 */
	private function is_subscriptions_active() {
		if ( ! class_exists( 'Jetpack' ) ) {
			return false;
		}
		return Jetpack::is_module_active( 'subscriptions' );
	}
	/**
	 * Find existing checkout page by meta key
	 *
	 * @return WP_Post|null
	 */
	private function find_checkout_page() {
		$pages = get_posts(
			array(
				'post_type'      => 'page',
				'post_status'    => array( 'publish', 'draft', 'pending', 'private' ),
				'posts_per_page' => 1,
				'meta_key'       => self::META_KEY,
				'meta_value'     => '1',
			)
		);

		return ! empty( $pages ) ? $pages[0] : null;
	}

	/**
	 * Generate a unique slug for the checkout page
	 *
	 * @return string
	 */
	private function generate_unique_slug() {
		$slug    = self::BASE_SLUG;
		$counter = 0;

		// Check if base slug is available
		if ( ! $this->slug_exists( $slug ) ) {
			return $slug;
		}

		// Try numbered variants
		do {
			++$counter;
			$slug = self::BASE_SLUG . '-' . $counter;
		} while ( $this->slug_exists( $slug ) );

		return $slug;
	}

	/**
	 * Check if a slug exists in the database
	 *
	 * @param string $slug The slug to check.
	 * @return bool
	 */
	private function slug_exists( $slug ) {
		global $wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$count = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM $wpdb->posts WHERE post_name = %s AND post_status != 'trash'",
				$slug
			)
		);
		return $count > 0;
	}

	/**
	 * Create the checkout page
	 *
	 * @return int|WP_Error Post ID on success, WP_Error on failure
	 */
	private function create_checkout_page() {
		$slug = $this->generate_unique_slug();

		$page_data = array(
			'post_title'   => __( 'Monetize Checkout', 'jetpack' ),
			'post_content' => '',
			'post_status'  => 'publish',
			'post_type'    => 'page',
			'post_name'    => $slug,
		);

		$page_id = wp_insert_post( $page_data );

		if ( is_wp_error( $page_id ) ) {
			return $page_id;
		}

		// Add the meta key to identify this page
		update_post_meta( $page_id, self::META_KEY, '1' );

		return $page_id;
	}

	/**
	 * Ensure the checkout page exists, create if necessary
	 */
	public function ensure_checkout_page_exists() {
		$existing_page = $this->find_checkout_page();

		if ( null === $existing_page ) {
			$this->create_checkout_page();
		}
	}
}

// Initialize the module
Jetpack_Monetize_Checkout::init();
