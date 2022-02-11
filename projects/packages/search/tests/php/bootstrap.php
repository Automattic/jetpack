<?php
/**
 * Initialize the testing environment.
 *
 * @package automattic/jetpack-search
 */

/**
 * Load the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/class-test-case.php';

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Search\Helper;
use Automattic\Jetpack\Search\Options;

define( 'WP_DEBUG', true );

// The constant is needed by `jetpack-connection`.
Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = 'https://public-api.wordpress.com';

Constants::$set_constants['JETPACK__API_BASE'] = 'https://jetpack.wordpress.com/jetpack';

/**
 * Default options
 */
function dbless_default_options() {
	return array(
		'sidebars_widgets'                       => null,
		Helper::get_widget_option_name()         => null,
		Options::OPTION_PREFIX . 'result_format' => null,
	);
}

\WorDBless\Load::load();
