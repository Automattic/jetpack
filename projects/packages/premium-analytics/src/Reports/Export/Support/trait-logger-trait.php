<?php
/**
 * Shared logger accessor for CSV report export classes.
 *
 * @package automattic/jetpack-premium-analytics
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Logger_Interface;

defined( 'ABSPATH' ) || exit;

/**
 * Trait Logger_Trait
 *
 * @since $$next-version$$
 */
trait Logger_Trait {

	/**
	 * Logger instance.
	 *
	 * @var Logger_Interface|null
	 */
	private $logger = null;

	/**
	 * Set the logger object.
	 *
	 * @param Logger_Interface $logger The logger object.
	 *
	 * @return void
	 */
	public function set_logger( Logger_Interface $logger ): void {
		$this->logger = $logger;
	}

	/**
	 * Get the logger object.
	 *
	 * @return Logger_Interface|null
	 */
	public function get_logger(): ?Logger_Interface {
		return $this->logger;
	}
}
