<?php
/**
 * Mock functions for testing
 *
 * @package automattic/jetpack-test-environment
 */

namespace Automattic\Jetpack;

/**
 * Mock file_exists in the current namespace
 */
function file_exists( $filename ) {
	if ( isset( $GLOBALS['mock_files'] ) ) {
		return isset( $GLOBALS['mock_files'][ $filename ] );
	}
	return \file_exists( $filename );
}
