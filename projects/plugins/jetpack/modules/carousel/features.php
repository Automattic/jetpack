<?php
/**
 * Feature Catalog registration for the "Carousel" module.
 *
 * Discovered and loaded by the Feature Catalog loader via the per-module features.php convention.
 *
 * @package automattic/jetpack
 */

use function Automattic\Jetpack\Features\register_feature;

register_feature(
	'carousel',
	array(
		'title'           => __( 'Carousel', 'jetpack' ),
		'description'     => __( 'Turn your image galleries into immersive, full‑screen slideshows.', 'jetpack' ),
		'category'        => 'appearance',
		'connection'      => 'none',
		'module'          => 'carousel',
		'available_since' => array( 'jetpack' => '1.5' ),
		'docs'            => array( 'jetpack' => 'https://jetpack.com/redirect/?source=jetpack-support-carousel' ),
	)
);
