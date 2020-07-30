<?php
/**
 * Block Editor functionality for Premium Blocks.
 *
 * @package Jetpack
 */

class Premium_Blocks {

	public static $premium_blocks_list = array(
		'core/video',
		'core/cover',
		'core/audio',
		'premium-content/container',
	);
	
	static $required_plan;

	static $is_simple_site;
	
	/**
	 * Singleton
	 */
	public static function init() {
		static $instance = false;
		
		if ( ! $instance ) {
			$instance = new Premium_Blocks();
		}
		
		return $instance;
	}

	private function __construct() {
		// Set if current site is Simple.
		self::$is_simple_site = ( defined( 'IS_WPCOM' ) && IS_WPCOM );
		
		// Set plan depending on site type.
		self::$required_plan = self::$is_simple_site ? 'value_bundle' : 'jetpack_premium';

		// Add extensions.
		add_filter( 'jetpack_set_available_blocks', function ( $extensions ) {
			return array_merge( $extensions, self::$premium_blocks_list );
		} );

		// Set extensions availability.
		add_action( 'jetpack_register_gutenberg_extensions', array( $this, 'set_extension_availability' ) );
	}

	public function check_extension_availability( $extension_name ) {
		if ( ! self::$is_simple_site ) {
			return array( 'available' => true );
		}

		$features = Store_Product_List::get_site_specific_features_data();
		if ( in_array( $extension_name, $features['active'], true ) ) {
			return array( 'available' => true );
		} else {
			return array(
				'available'          => false,
				'unavailable_reason' => 'missing_plan',
			);
		}
	}
	
	/**
	 * Set the Jetpack Gutenberg extension availability.
	 */
	public function set_extension_availability( ) {
		foreach ( self::$premium_blocks_list as $extension ) {
			$availability = $this->check_extension_availability( $extension );

			if ( $availability[ 'available' ] ) {
				Jetpack_Gutenberg::set_extension_available( $extension );
			} else {
				Jetpack_Gutenberg::set_extension_unavailable(
					$extension,
					$availability['unavailable_reason'],
					array(
						'required_feature' => $extension,
						'required_plan'    => self::$required_plan,
					)
				);
			}
		}
	}
}

Premium_Blocks::init();
