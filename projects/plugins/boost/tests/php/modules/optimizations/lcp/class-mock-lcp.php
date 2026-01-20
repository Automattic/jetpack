<?php
/**
 * Mock LCP class for unit tests.
 *
 * This mock provides the LCP type constants without loading the full LCP class
 * and its dependencies. Uses class_alias() to make it available under the
 * production namespace.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Lcp;

/**
 * Mock LCP class providing type constants.
 */
class Mock_LCP {
	/**
	 * LCP type constant for standard img elements.
	 */
	const TYPE_IMAGE = 'img';

	/**
	 * LCP type constant for background images.
	 */
	const TYPE_BACKGROUND_IMAGE = 'background-image';
}

// Only alias if the production class doesn't already exist
if ( ! class_exists( 'Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP' ) ) {
	class_alias(
		'Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Lcp\Mock_LCP',
		'Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP'
	);
}
