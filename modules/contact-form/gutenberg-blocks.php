<?php

add_action( 'init', array( 'Grunion_Contact_Form_Gutenblocks', 'register_block_types' ) );
add_action( 'enqueue_block_editor_assets', array( 'Grunion_Contact_Form_Gutenblocks', 'enqueue_block_editor_assets' ) );

class Grunion_Contact_Form_Gutenblocks {

	public static function register_block_types() {
		register_block_type( 'jetpack/contact-form', array(
			'render_callback' => array( __CLASS__, 'render_contact_form' ),
		) );

		// Stubbed out for now until nested blocks are in.
		register_block_type( 'jetpack/contact-field', array(
			'render_callback' => array( __CLASS__, 'render_contact_field' ),
		) );
	}

	public static function render_contact_form( $args ) {
		// return Grunion_Contact_Form::parse( $args );
		return '<pre>' . print_r( $args, true ) . '</pre>';
	}

	// Stubbed out for now until nested blocks are in.
	public static function render_contact_field( $args ) {}

	public static function enqueue_block_editor_assets() {
		wp_register_script(
			'jetpack-contact-form-gutenblocks',
			plugins_url( 'js/gutenblocks.js', __FILE__ ),
			array( 'wp-blocks', 'wp-element' )
		);
		wp_enqueue_script( 'jetpack-contact-form-gutenblocks' );
		wp_localize_script( 'jetpack-contact-form-gutenblocks', 'grunionGutenblocks', array(
			'strings' => array(
				'Contact Form' => __( 'Contact Form', 'jetpack' ),
				'What would you like the subject of the email to be?' =>
						__( 'What would you like the subject of the email to be?', 'jetpack' ),
				'Which email address should we send the submissions to?' =>
						__( 'Which email address should we send the submissions to?', 'jetpack' ),
			),
		) );
	}
}