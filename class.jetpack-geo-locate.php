<?php

class Jetpack_Geo_Locate {
	private static $instance;

	static public function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Geo_Locate;
		}

		return self::$instance;
	}

	/**
	 * This is mostly just used for testing purposes.
	 */
	static public function resetInstance() {
		self::$instance = null;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'wordpress_init' ) );
	}

	public function wordpress_init() {
		add_post_type_support( 'post', 'geo-location' );
		add_post_type_support( 'page', 'geo-location' );

		register_meta(
			'post',
			'geo_public',
			array(
				'sanitize_callback' => array( $this, 'sanitize_public' ),
				'type'              => 'string',
				'single'            => true,
			)
		);

		register_meta(
			'post',
			'geo_latitude',
			array(
				'sanitize_callback' => array( $this, 'sanitize_coordinate' ),
				'type'              => 'float',
				'single'            => true,
			)
		);

		register_meta(
			'post',
			'geo_longitude',
			array(
				'sanitize_callback' => array( $this, 'sanitize_coordinate' ),
				'type'              => 'float',
				'single'            => true,
			)
		);

		register_meta(
			'post',
			'geo_address',
			array(
				'sanitize_callback' => 'sanitize_text_field',
				'type'              => 'string',
				'single'            => true
			)
		);
	}

	public function sanitize_public( $public ) {
		return absint( $public ) ? 1 : 0;
	}

	public function sanitize_coordinate( $coordinate ) {
		if ( ! $coordinate ) {
			return null;
		}

		return round( (float) $coordinate, 7 );
	}

	/**
	 * This method always returns an array with the following structure:
	 *
	 * array(is_public => bool, latitude => float, longitude => float, label => string, is_populated => bool)
	 *
	 * So, regardless of whether your post actually has values in postmeta for the geo-location fields,
	 * you can be sure that you can reference those array keys in calling code without having to juggle
	 * isset(), array_key_exists(), etc.
	 *
	 * Mocking this method during testing can also be useful for testing output and logic in various
	 * hook functions.
	 *
	 * @param integer $post_id
	 *
	 * @return array A predictably structured array representing the meta values for the supplied post ID.
	 */
	public function get_meta_values( $post_id ) {
		$meta_values = array(
			'is_public'    => (bool) $this->sanitize_public( $this->get_meta_value( $post_id, 'public' ) ),
			'latitude'     => $this->sanitize_coordinate( $this->get_meta_value( $post_id, 'latitude' ) ),
			'longitude'    => $this->sanitize_coordinate( $this->get_meta_value( $post_id, 'longitude' ) ),
			'label'        => $this->get_meta_value( $post_id, 'address' ),
			'is_populated' => false
		);

		if ( $meta_values['latitude'] && $meta_values['longitude'] && $meta_values['label']) {
			$meta_values['is_populated'] = true;
		}

		return $meta_values;
	}

	/**
	 * This function wraps get_post_meta() to enable us to keep the "geo_" prefix isolated to a single
	 * location in the code and to assist in mocking during testing.
	 *
	 * @param integer $post_id
	 * @param string $meta_field_name
	 *
	 * @return mixed
	 */
	public function get_meta_value( $post_id, $meta_field_name ) {
		return get_post_meta( $post_id, 'geo_' . $meta_field_name, true );
	}
}

Jetpack_Geo_Locate::init();
