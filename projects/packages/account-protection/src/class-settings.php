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
	 * @param ?Account_Protection|null $account_protection Account protection dependency.
	 */
	public function __construct( ?Account_Protection $account_protection = null ) {
		$this->account_protection = $account_protection ?? new Account_Protection();
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
			'config'                       => $this->get_config(),
		);

		return $settings;
	}

	/**
	 * Get account protection config.
	 *
	 * @return array
	 */
	public function get_config() {
		$supports_auto_activation = $this->account_protection->environment_supports_auto_activation();

		return array(
			Config::PASSWORD_DETECTION_ENABLED_OPTION_NAME => (bool) get_option( Config::PASSWORD_DETECTION_ENABLED_OPTION_NAME, $supports_auto_activation ),
			Config::STRONG_PASSWORDS_ENABLED_OPTION_NAME   => (bool) get_option( Config::STRONG_PASSWORDS_ENABLED_OPTION_NAME, $supports_auto_activation ),
		);
	}
}
