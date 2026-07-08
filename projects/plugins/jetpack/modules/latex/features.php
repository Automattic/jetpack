<?php
/**
 * Feature Catalog registration for the "Beautiful Math" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'latex',
	array(
		'title'           => __( 'Beautiful Math', 'jetpack' ),
		'description'     => __( 'Add beautifully formatted math equations to your posts and pages using LaTeX.', 'jetpack' ),
		'category'        => 'writing',
		'connection'      => 'none',
		'module'          => 'latex',
		'available_since' => array( 'jetpack' => '1.1' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-beautiful-math-with-latex' ),
	)
);
