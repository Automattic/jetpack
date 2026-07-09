<?php
/**
 * Feature Catalog registration for the "Forms" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'contact-form',
	array(
		'title'           => __( 'Forms', 'jetpack' ),
		'description'     => __( 'Add contact, registration, and feedback forms directly from the block editor.', 'jetpack' ),
		'category'        => 'writing',
		'connection'      => 'none',
		'module'          => 'contact-form',
		'available_since' => array( 'jetpack' => '1.3' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-contact-form' ),
	)
);

register_feature(
	'forms-multistep',
	array(
		'title'           => __( 'Multi-step forms', 'jetpack' ),
		'description'     => __( 'Break long forms into multiple steps for a better completion rate.', 'jetpack' ),
		'category'        => 'writing',
		'connection'      => 'none',
		'module'          => 'contact-form',
		'available_since' => array( 'jetpack' => '14.2' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-contact-form' ),
		'recommend'       => array( 'high_content_volume' ),
	)
);

register_feature(
	'forms-file-uploads',
	array(
		'title'       => __( 'File upload field', 'jetpack' ),
		'description' => __( 'Let visitors attach files to their form submissions.', 'jetpack' ),
		'category'    => 'writing',
		'connection'  => 'user',
		'entitlement' => 'field-file',
		'module'      => 'contact-form',
		'docs'        => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-contact-form-export' ),
	)
);
