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
	 * Account protection instance.
	 *
	 * @var Account_Protection
	 */
	private $account_protection;

	/**
	 * Constructor for dependency injection.
	 *
	 * @param ?Account_Protection|null $account_protection Account protection dependency.
	 */
	public function __construct( ?Account_Protection $account_protection = null ) {
		$this->account_protection = $account_protection ?? Account_Protection::instance();
	}

	/**
	 * Get account protection settings.
	 *
	 * @return array
	 */
	public function get() {
		$settings = array(
			'isEnabled'                    => $this->account_protection->is_enabled(),
			'isSupported'                  => $this->account_protection->is_supported_environment(),
			'hasUnsupportedJetpackVersion' => $this->account_protection->has_unsupported_jetpack_version(),
		);

		return $settings;
	}
}
