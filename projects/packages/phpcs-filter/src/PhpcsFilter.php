<?php
/**
 * Deprecated.
 *
 * @deprecated Since $$next-version$$. Use PHP_CodeSniffer\Filters\Automattic\JetpackPhpcsFilter instead.
 * @package automattic/jetpack-phpcs-filter
 */

namespace Automattic\Jetpack;

use PHP_CodeSniffer\Config;
use PHP_CodeSniffer\Exceptions\DeepExitException;
use PHP_CodeSniffer\Filters\Automattic\JetpackPhpcsFilter;
use PHP_CodeSniffer\Ruleset;

/**
 * Deprecated.
 *
 * @deprecated Since $$next-version$$. Use PHP_CodeSniffer\Filters\Automattic\JetpackPhpcsFilter instead.
 */
class PhpcsFilter extends JetpackPhpcsFilter {

	/**
	 * Constructs a filter.
	 *
	 * @param \RecursiveIterator       $iterator The iterator we are using to get file paths.
	 * @param string                   $basedir The top-level path we are filtering.
	 * @param \PHP_CodeSniffer\Config  $config The config data for the run.
	 * @param \PHP_CodeSniffer\Ruleset $ruleset The ruleset used for the run.
	 * @param JetpackPhpcsFilter|null  $copyFrom Used from getChildren().
	 * @throws DeepExitException On error.
	 */
	public function __construct( $iterator, $basedir, Config $config, Ruleset $ruleset, ?JetpackPhpcsFilter $copyFrom = null ) {
		static $logged = false;
		if ( ! $logged ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_trigger_error
			trigger_error( sprintf( '%s is deprecated. Use %s instead.', __CLASS__, JetpackPhpcsFilter::class ), E_USER_DEPRECATED );
			$logged = true;
		}
		parent::__construct( $iterator, $basedir, $config, $ruleset, $copyFrom );
	}
}
