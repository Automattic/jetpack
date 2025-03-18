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
	 * Main instance.
	 *
	 * @var Main
	 */
	private $main;

	/**
	 * Constructor for dependency injection.
	 *
	 * @param ?Main|null $main Account protection dependency.
	 */
	public function __construct( ?Main $main = null ) {
		$this->main = $main ?? new Main();
	}

	/**
	 * Get account protection settings.
	 *
	 * @return array
	 */
	public function get() {
		$settings = array(
			'isEnabled'                    => $this->main->is_enabled(),
			'isSupported'                  => $this->main->is_supported_environment(),
			'hasUnsupportedJetpackVersion' => $this->main->has_unsupported_jetpack_version(),
		);

		return $settings;
	}
}
