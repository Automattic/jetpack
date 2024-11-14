<?php
/**
 * Settings class.
 *
 * Flagged to be removed after deprecation.
 *
 * @deprecated 0.38.3
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Social_Image_Generator;

use Automattic\Jetpack\Publicize\Jetpack_Social_Settings\Settings as Jetpack_Social_Settings;

/**
 * This class is used to get and update SIG-specific global settings.
 */
class Settings {
	/**
	 * Name of the database option.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_social_image_generator_settings';

	/**
	 * Array with SIG's settings.
	 *
	 * @var array $settings
	 */
	public $settings;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->settings = $this->get_settings();
	}

	/**
	 * Get all current SIG settings.
	 *
	 * @return array
	 */
	private function get_settings() {
		$new_settings = ( new Jetpack_Social_Settings() )->get_settings();

		return array(
			'enabled'  => $new_settings['socialImageGeneratorSettings']['enabled'],
			'defaults' => array(
				'template' => $new_settings['socialImageGeneratorSettings']['template'],
			),
		);
	}

	/**
	 * Check if SIG is available.
	 *
	 * @return bool True if SIG is available, false otherwise.
	 */
	public function is_available() {
		return ( new Jetpack_Social_Settings() )->is_sig_available();
	}

	/**
	 * Check if SIG is enabled.
	 *
	 * @return bool True if SIG is enabled, false otherwise.
	 */
	public function is_enabled() {
		$new_settings = ( new Jetpack_Social_Settings() )->get_settings();

		return $new_settings['socialImageGeneratorSettings']['enabled'];
	}

	/**
	 * Get an array of all current defaults.
	 *
	 * @return array
	 */
	public function get_defaults() {
		if ( isset( $this->settings['defaults'] ) ) {
			return $this->settings['defaults'];
		}

		return array(
			'template' => Templates::DEFAULT_TEMPLATE,
		);
	}

	/**
	 * Get the current default template.
	 *
	 * @return string
	 */
	public function get_default_template() {
		$defaults = $this->get_defaults();

		return isset( $defaults['template'] ) ? $defaults['template'] : Templates::DEFAULT_TEMPLATE;
	}
}
