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
	public $extensions = array(
		'core/audio',
		'core/cover',
		'core/video',
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
	 * Premium_Blocks constructor.
	 */
	private function __construct() {
		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
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
		add_action( 'jetpack_register_gutenberg_extensions', array( $this, 'set_extension_availability' ) );
	}

	/**
	 * Set the Jetpack Gutenberg extension availability.
	 * It will check if the extension/block will require an upgrade
	 * in order to make it available for the site.
	 */
	public function set_extension_availability() {
		foreach ( $this->extensions as $extension ) {
			\Jetpack_Gutenberg::set_availability_for_plan( $extension );
		}
	}
}
