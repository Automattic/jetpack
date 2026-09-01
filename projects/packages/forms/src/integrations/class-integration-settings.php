<?php
/**
 * Resolves a form's per-integration settings out of its block attributes.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Integrations;

/**
 * Reads the settings one integration stores on one form.
 *
 * Per-form settings live in the shared `integrations` block attribute, keyed by integration
 * slug. Integrations that predate that container declare a `settings_attribute` naming the
 * top-level block attribute they already use, and keep reading and writing it, so forms saved
 * before the shared container existed keep working untouched.
 *
 * Callers go through this class rather than reaching into either location, so which storage an
 * integration uses stays an implementation detail of its registration.
 */
class Integration_Settings {

	/**
	 * Name of the block attribute holding settings for every integration that does not
	 * declare a legacy attribute of its own.
	 */
	public const CONTAINER_ATTRIBUTE = 'integrations';

	/**
	 * Get one integration's settings for a form.
	 *
	 * @param string $slug             Integration slug.
	 * @param array  $form_attributes  The contact form block's attributes.
	 * @return array The stored settings, or an empty array when the form has none.
	 */
	public static function get( $slug, $form_attributes ) {
		if ( ! is_array( $form_attributes ) ) {
			return array();
		}

		$legacy_attribute = Integration_Registry::get_settings_attribute( $slug );

		if ( null !== $legacy_attribute ) {
			$name  = $legacy_attribute['name'];
			$value = isset( $form_attributes[ $name ] ) ? $form_attributes[ $name ] : null;

			// A legacy attribute holding a single scalar stands for one named setting, so
			// callers still receive a settings array rather than a bare value.
			if ( null !== $legacy_attribute['maps_to'] ) {
				return null === $value
					? array()
					: array( $legacy_attribute['maps_to'] => $value );
			}

			$settings = null === $value ? array() : $value;
		} else {
			$container = isset( $form_attributes[ self::CONTAINER_ATTRIBUTE ] ) ? $form_attributes[ self::CONTAINER_ATTRIBUTE ] : array();
			$settings  = ( is_array( $container ) && isset( $container[ $slug ] ) ) ? $container[ $slug ] : array();
		}

		// Block attributes arrive as objects when they round-trip through JSON.
		if ( is_object( $settings ) ) {
			$settings = (array) $settings;
		}

		return is_array( $settings ) ? $settings : array();
	}
}
