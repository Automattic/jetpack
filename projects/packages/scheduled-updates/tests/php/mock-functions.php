<?php
/**
 * Mock functions for testing
 *
 * @package automattic/scheduled-updates
 */

namespace Automattic\Jetpack;

/**
 * Mock realpath in the current namespace
 *
 * If $GLOBALS['mock_realpath'][ $path ] is set, it will be used as the return value.
 * Otherwise, it falls back to the native realpath function.
 *
 * @param string $path The path to resolve.
 * @return string|false The resolved path or false on failure.
 */
function realpath( $path ) {
	if ( isset( $GLOBALS['mock_realpath'][ $path ] ) ) {
		return $GLOBALS['mock_realpath'][ $path ];
	}
	return \realpath( $path );
}
