<?php
/**
 * Contact Info block and its child blocks.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/contact-info',
	array(
		'render_callback' => array( 'Jetpack_Contact_Info_Block', 'render' ),
	)
);

jetpack_register_block(
	'jetpack/address',
	array(
		'parent'          => array( 'jetpack/contact-info' ),
		'render_callback' => array( 'Jetpack_Contact_Info_Block', 'render_address' ),
	)
);

jetpack_register_block(
	'jetpack/email',
	array(
		'parent'          => array( 'jetpack/contact-info' ),
		'render_callback' => array( 'Jetpack_Contact_Info_Block', 'render_email' ),
	)
);

jetpack_register_block(
	'jetpack/phone',
	array(
		'parent'          => array( 'jetpack/contact-info' ),
		'render_callback' => array( 'Jetpack_Contact_Info_Block', 'render_phone' ),
	)
);
require_once dirname( __FILE__ ) . '/class-jetpack-contact-info-block.php';
