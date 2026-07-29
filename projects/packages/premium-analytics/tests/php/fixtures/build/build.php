<?php
/**
 * Test fixture: stand-in for the generated wp-build entry point.
 *
 * Records that it was loaded so tests can assert whether Analytics::init()
 * reached the build on a given request type. The real build/ is gitignored and
 * CI runs no build step, so without this there is nothing to observe.
 *
 * @package automattic/jetpack-premium-analytics
 */

$GLOBALS['jpa_test_build_loaded'] = true;
