<?php
/**
 * Class used to manage settings related to Account Protection.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

use Automattic\Jetpack\Modules;

/**
 * Account Protection Settings
 */
class Settings {
	/**
	 * Modules instance.
	 *
	 * @var Modules|null
	 */
	private $modules;

	/**
	 * Constructor.
	 *
	 * @param Modules|null $modules Modules instance.
	 */
	public function __construct( ?Modules $modules = null ) {
		$this->modules = $modules ?? new Modules();
	}

	/**
	 * Get account protection settings.
	 *
	 * @return array
	 */
	public function get() {
		$account_protection = new Account_Protection( $this->modules );

		return array(
			'isEnabled'   => $account_protection->is_enabled(),
			'isSupported' => $account_protection->is_supported_environment(),
		);
	}
}
