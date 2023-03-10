<?php
/**
 * Compatibility stub for Symfony 6 changes.
 *
 * Symfony 6 (for PHP 8.0+) added return type hints to its interface. But we still support PHP 5.6, which doesn't recognize that syntax.
 * Since specifying a return type when the interface doesn't is ok, use the version that always does that for PHP 7+ instead of figuring
 * out how to check the actual symfony version.
 *
 * @package automattic/jetpack-changelogger
 */

namespace Automattic\Jetpack\Changelogger;

if ( PHP_VERSION_ID >= 70000 ) {
	class_alias( php7\CommandLoader::class, CommandLoader::class );
} else {
	class_alias( php5\CommandLoader::class, CommandLoader::class );
}
