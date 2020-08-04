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
	 * Plan level required to access premium blocks.
	 *
	 * @var string
	 */
	public $required_plan = 'jetpack_premium';

	/**
	 * Whether the current site is on WP.com.
	 *
	 * @var bool
	 */
	public $is_simple_site = false;

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
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->is_simple_site = true;
			$this->required_plan  = 'value_bundle';
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
	 * Returns the availability status for an extension,
	 * depending on the site type, plan of the site,
	 * and the requirements of the feature/block.
	 *
	 * @param string $extension_name Extension name.
	 * @return array
	 */
	public function check_extension_availability( $extension_name ) {
		if ( $this->is_simple_site && class_exists( 'Store_Product_List' ) ) {
			$features = \Store_Product_List::get_site_specific_features_data();

			if ( ! in_array( $extension_name, $features['active'], true ) ) {
				return array(
					'available'          => false,
					'unavailable_reason' => 'missing_plan',
				);
			}
		}

		return array( 'available' => true );
	}

	/**
	 * Set the Jetpack Gutenberg extension availability.
	 * It will check if the extension/block will require an upgrade
	 * in order to make it available for the site.
	 */
	public function set_extension_availability() {
		foreach ( $this->extensions as $extension ) {
			$availability = $this->check_extension_availability( $extension );

			if ( $availability['available'] ) {
				\Jetpack_Gutenberg::set_extension_available( $extension );
			} else {
				\Jetpack_Gutenberg::set_extension_unavailable(
					$extension,
					$availability['unavailable_reason'],
					array(
						'required_feature' => $extension,
						'required_plan'    => $this->required_plan,
					)
				);
			}
		}
	}
}
