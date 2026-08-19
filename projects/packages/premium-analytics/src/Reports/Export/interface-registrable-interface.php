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
 * Interface Registrable_Interface.
 *
 * @since 0.1.0
 */
interface Registrable_Interface {

	/**
	 * Register the hooks.
	 *
	 * @return void
	 */
	public function register(): void;
}
