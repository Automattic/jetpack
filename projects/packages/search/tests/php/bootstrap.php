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
require_once __DIR__ . '/class-testcase.php';
require_once __DIR__ . '/trait-toggles-ai-master.php';

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
		'sidebars_widgets'                       => array(),
		Helper::get_widget_option_name()         => array(),
		Options::OPTION_PREFIX . 'result_format' => false,
		'widget_block'                           => array(),
	);
}

// The plugin defines this; the package cannot. Stub it so tests can drive both
// branches of the internal-environment guard in AI_Answers::is_master_enabled().
// Defaults to true so the master-gate tests exercise the gate.
if ( ! function_exists( 'jetpack_is_internal_testing_environment' ) ) {
	function jetpack_is_internal_testing_environment() {
		return (bool) ( $GLOBALS['jetpack_search_test_internal_env'] ?? true );
	}
}

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();
