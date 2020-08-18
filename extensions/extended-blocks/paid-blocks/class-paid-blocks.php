<?php
/**
 * Paid_Blocks.
 * Marks a block's availability as needing
 * to be checked against the current plan.
 *
 * @package Automattic\Jetpack\Extended_Blocks
 */

namespace Automattic\Jetpack\Extended_Blocks;

/**
 * Class Paid_Blocks.
 *
 * @package Automattic\Jetpack\Extended_Blocks
 */
class Paid_Blocks {
	/**
	 * List of paid blocks.
	 *
	 * @var array
	 */
	public $paid_blocks = array(
		'core/cover',
		'core/video',
		'core/audio',
		'premium-content/container',
	);

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
	 * Paid_Blocks constructor.
	 */
	private function __construct() {
		// Populate the block-editor extensions/blocks available through Jetpack when running on Dotcom
		add_filter(
			'jetpack_set_available_extensions',
			function ( $extensions ) {
				return array_merge( $extensions, $this->paid_blocks );
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
		foreach ( $this->paid_blocks as $paid_block ) {
			\Jetpack_Gutenberg::set_availability_for_plan( $paid_block );
		}
	}
}
