<?php
/**
 * Contract for CSV report export classes that register hooks/routes.
 *
 * @package automattic/jetpack-premium-analytics
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

defined( 'ABSPATH' ) || exit;

/**
 * Interface RegistrableInterface
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */
interface RegistrableInterface {

	/**
	 * Register the hooks.
	 *
	 * @return void
	 */
	public function register(): void;
}
