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
	 * @return array Settings.
	 */
	public function get(): array {
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
	 * @return array Config settings.
	 */
	public function get_config(): array {
		$advanced_options = $this->account_protection->environment_supports_advanced_options();

		return array(
			'supports_advanced_options'                    => $advanced_options,
			Config::PASSWORD_DETECTION_ENABLED_OPTION_NAME => (bool) get_option( Config::PASSWORD_DETECTION_ENABLED_OPTION_NAME, ! $advanced_options ),
			Config::STRONG_PASSWORDS_ENABLED_OPTION_NAME   => (bool) get_option( Config::STRONG_PASSWORDS_ENABLED_OPTION_NAME, ! $advanced_options ),
		);
	}
}
