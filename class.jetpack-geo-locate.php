<?php

class Jetpack_Geo_Locate {
	private static $instance;

	static public function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Geo_Locate;
		}

		return self::$instance;
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
		return round( (float) $coordinate, 7 );
	}
}

Jetpack_Geo_Locate::init();
