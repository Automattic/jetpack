<?php
/**
 * Block Editor class for Premium Blocks.
 * Sets blocks as premium depending on the site site plan and site type.
 *
 * @package Automattic\Jetpack\Extensions
 */

namespace Automattic\Jetpack\Extensions;

/**
 * Class Premium_Blocks.
 *
 * @package Automattic\Jetpack\Extensions
 */
class Premium_Blocks {

	/**
	 * List of premium blocks.
	 *
	 * @var array
	 */
	public $extensions = array();

	/**
	 * Singleton.
	 */
	public static function get_instance() {
		static $instance = false;

		if ( ! $instance ) {
			$instance = new self();
		}

		return $instance;
	}

	/**
	 * Premium_Blocks constructor.
	 */
	private function __construct() {
		// Check if it's a Simple site. Bail if not.
		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			return;
		}

		// Check if the class exists. Bail if not.
		if ( ! class_exists( 'Store_Product_List' ) ) {
			require WP_CONTENT_DIR . '/admin-plugins/wpcom-billing/store-product-list.php';
		}

		// Check if the method exists in the class. Bail if not.
		if ( ! method_exists( 'Store_Product_List', 'get_paid_blocks_list') ) {
			return;
		}

		// Check if the are defined paid blocks
		$this->extensions = \Store_Product_List::get_paid_blocks_list();
		if ( empty( $this->extensions ) ) {
			return;
		}

		// Populate the block-editor extensions available through Jetpack.
		add_filter(
			'jetpack_set_available_extensions',
			function ( $extensions ) {
				return array_merge( $extensions, $this->extensions );
			}
		);

		// Set extensions availability depending on the plan site type and plan of the site.
		add_action( 'jetpack_register_gutenberg_extensions', array( $this, 'set_block_availability' ) );
	}

	/**
	 * Set the Jetpack Gutenberg extension availability.
	 * It will check if the extension/block will require an upgrade
	 * in order to make it completely available for the site.
	 */
	public function set_block_availability() {
		foreach ( $this->extensions as $extension ) {
			\Jetpack_Gutenberg::set_availability_for_plan( $extension );
		}
	}
}
