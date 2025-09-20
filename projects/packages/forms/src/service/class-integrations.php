<?php
/**
 * Integrations for Jetpack Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

/**
 * Registry for managing form integrations.
 *
 * Provides a centralized way to register and manage integrations
 * that will appear in the forms integrations endpoint.
 */
class Integrations {

	/**
	 * Registered integrations.
	 *
	 * @var array
	 */
	private static $integrations = array();

	/**
	 * Whether the registry has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the registry and register the filter.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}

		add_filter( 'jetpack_forms_supported_integrations', array( __CLASS__, 'add_registered_integrations' ) );
		self::$initialized = true;
	}

	/**
	 * Register a new integration.
	 *
	 * @param string $slug The integration slug.
	 * @param array  $config The integration configuration.
	 */
	public static function register( $slug, $config ) {
		self::$integrations[ $slug ] = $config;
	}

	/**
	 * Get all registered integrations.
	 *
	 * @return array
	 */
	public static function get_registered_integrations() {
		return self::$integrations;
	}

	/**
	 * Add registered integrations to the supported integrations list.
	 *
	 * @param array $integrations Existing integrations.
	 * @return array Modified integrations array.
	 */
	public static function add_registered_integrations( $integrations ) {
		return array_merge( $integrations, self::$integrations );
	}
}
