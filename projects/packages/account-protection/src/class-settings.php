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
	 * Get account protection settings.
	 *
	 * @return array
	 */
	public function get() {
		$settings = array(
			'isEnabled'   => ( new Account_Protection() )->is_enabled(),
			'isSupported' => ( new Account_Protection() )->is_supported_environment(),
		);

		return $settings;
	}
}
