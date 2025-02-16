<?php
/**
 * Class used to manage settings related to Account Protection.
 *
 * @package automattic/jetpack-account-protection
 */

namespace Automattic\Jetpack\Account_Protection;

/**
 * Account Protection Settings
 */
class Settings {
	/**
	 * Account Protection instance.
	 *
	 * @var Account_Protection
	 */
	private $account_protection;

	/**
	 * Constructor for dependency injection.
	 *
	 * @param Account_Protection|null $account_protection Account protection dependency.
	 */
	public function __construct( Account_Protection $account_protection = null ) {
		$this->account_protection = $account_protection ?? new Account_Protection();
	}

	/**
	 * Get account protection settings.
	 *
	 * @return array
	 */
	public function get() {
		$settings = array(
			'isEnabled'   => $this->account_protection->is_enabled(),
			'isSupported' => $this->account_protection->is_supported_environment(),
		);

		return $settings;
	}
}
