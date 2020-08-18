<?php
/**
 * Blocks_Availability.
 * Marks a block's availability as needing
 * to be checked against the current plan.
 *
 * @package Automattic\Jetpack\Extended_Blocks
 */

namespace Automattic\Jetpack\Extended_Blocks;

/**
 * Class Blocks_Availability.
 *
 * @package Automattic\Jetpack\Extended_Blocks
 */
class Blocks_Availability {
	/**
	 * Blocks that require a plan check
	 * to determinate their availability
	 * according to the current site plan.
	 *
	 * @var array
	 */
	public $blocks_list = array(
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
	 * Blocks_Availability constructor.
	 */
	private function __construct() {
		// Populate the available extensions list.
		add_filter(
			'jetpack_set_available_extensions',
			function ( $extensions ) {
				return array_merge( $extensions, $this->blocks_list );
			}
		);

		// Set the block availability depending on the site plan.
		add_action( 'jetpack_register_gutenberg_extensions', array( $this, 'set_block_availability' ) );
	}

	/**
	 * Set the Jetpack Gutenberg extension availability.
	 * It will check if the extension/block will require a site upgrade
	 * to make it available.
	 */
	public function set_block_availability() {
		foreach ( $this->blocks_list as $block_slug ) {
			\Jetpack_Gutenberg::set_availability_for_plan( $block_slug );
		}
	}
}
