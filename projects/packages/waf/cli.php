<?php
/**
 * Registers the CLI functionality.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

if ( defined( 'WP_CLI' ) && \WP_CLI ) {
	// @phan-suppress-next-line PhanUndeclaredFunctionInCallable -- https://github.com/phan/phan/issues/4763
	\WP_CLI::add_command( 'jetpack-waf', CLI::class );
}
