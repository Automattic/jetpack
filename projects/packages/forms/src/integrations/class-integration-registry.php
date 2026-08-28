<?php
/**
 * Registry of Jetpack Forms integrations.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Integrations;

/**
 * Holds every integration known to Jetpack Forms, whether it ships with the package or
 * comes from a third-party plugin.
 *
 * Registration is deliberately order-insensitive: `register()` only records an entry, and
 * carries no requirement about when it is called or what has loaded first. Nothing about the
 * order in which integrations arrive is meaningful — presentation order is decided by the
 * layer that displays them, not here.
 */
class Integration_Registry {

	/**
	 * Shape of a valid integration slug.
	 *
	 * Either a bare name, or a `vendor/name` pair. The namespaced form is what new
	 * integrations should use; the bare form is kept valid because the bundled integrations
	 * already publish theirs through the REST API and store them in saved block attributes,
	 * where renaming them would orphan existing settings.
	 */
	public const SLUG_PATTERN = '#^[\w-]+(?:/[\w-]+)?$#';

	/**
	 * Registered integrations, keyed by slug.
	 *
	 * @var array<string, array>
	 */
	private static $integrations = array();

	/**
	 * Default shape of a registered integration.
	 *
	 * Every key a consumer may read is present after normalization, so callers never have to
	 * guard with isset() against an integration that declared only the keys it cared about.
	 *
	 * @var array
	 */
	private const DEFAULTS = array(
		// Presentation metadata, mirrored into the REST responses.
		'type'                    => 'service',
		'file'                    => null,
		'settings_url'            => null,
		'marketing_redirect_slug' => null,
		'title'                   => '',
		'subtitle'                => '',
		'active_tooltip'          => '',
		'enabled_by_default'      => false,
		'icon_url'                => null,

		// Behavior.
		'is_available'            => null,
		'status_callback'         => null,
		'on_submission'           => null,

		// Storage. Null means per-form settings live in the shared `integrations` block
		// attribute under this integration's slug. Integrations that predate that container
		// name the top-level block attribute they already use, so their saved content keeps
		// working untouched. See self::normalize_settings_attribute() for the accepted forms.
		'settings_attribute'      => null,

		// Script handles registered with wp_register_script(), enqueued on the screens that
		// render the integrations modal.
		'editor_script'           => null,
		'dashboard_script'        => null,
	);

	/**
	 * Register an integration.
	 *
	 * Re-registering a slug replaces the previous entry, which lets a plugin override a
	 * bundled integration.
	 *
	 * @param string $slug Unique slug, used as the REST identifier and the key in the shared
	 *                     `integrations` block attribute. New integrations should namespace
	 *                     it as `vendor/name` so two plugins cannot collide on a common name.
	 *                     A bare name stays valid — the bundled integrations predate the
	 *                     convention and keep theirs.
	 * @param array  $args Integration definition. See self::DEFAULTS for supported keys.
	 * @return bool Whether the integration was registered.
	 */
	public static function register( $slug, array $args = array() ) {
		if ( ! is_string( $slug ) || ! preg_match( self::SLUG_PATTERN, $slug ) ) {
			_doing_it_wrong(
				__METHOD__,
				esc_html( 'Integration slugs must look like "name" or "vendor/name", using word characters and hyphens.' ),
				'jetpack-forms-$$next-version$$'
			);
			return false;
		}

		self::$integrations[ $slug ] = self::normalize( $args );

		return true;
	}

	/**
	 * Fill in every key a consumer may read.
	 *
	 * Also applied to integrations that arrive through the
	 * `jetpack_forms_supported_integrations` filter, which predates this registry and supplies
	 * only the presentation keys.
	 *
	 * @param array $args A partial integration definition.
	 * @return array The definition with every supported key present.
	 */
	public static function normalize( array $args ) {
		$args = array_merge( self::DEFAULTS, $args );

		$args['settings_attribute'] = self::normalize_settings_attribute( $args['settings_attribute'] );

		return $args;
	}

	/**
	 * Remove a registered integration.
	 *
	 * @param string $slug Integration slug.
	 * @return void
	 */
	public static function unregister( $slug ) {
		unset( self::$integrations[ $slug ] );
	}

	/**
	 * Get a single registered integration.
	 *
	 * @param string $slug Integration slug.
	 * @return array|null The normalized definition, or null when nothing is registered.
	 */
	public static function get( $slug ) {
		return isset( self::$integrations[ $slug ] ) ? self::$integrations[ $slug ] : null;
	}

	/**
	 * Get every registered integration, including ones that are not currently available.
	 *
	 * @return array<string, array> Definitions keyed by slug, in registration order.
	 */
	public static function all() {
		return self::$integrations;
	}

	/**
	 * Get the integrations that are currently available.
	 *
	 * An integration with no `is_available` callback is always available. This is the hook a
	 * feature flag uses, so a flagged-off integration is absent from the REST responses and
	 * the UI entirely rather than shown in a disabled state.
	 *
	 * @return array<string, array> Available definitions keyed by slug.
	 */
	public static function available() {
		return array_filter(
			self::$integrations,
			function ( $args ) {
				if ( null === $args['is_available'] ) {
					return true;
				}

				return is_callable( $args['is_available'] ) && (bool) call_user_func( $args['is_available'] );
			}
		);
	}

	/**
	 * Put a declared `settings_attribute` into a single internal shape.
	 *
	 * Two forms are accepted, because the block attributes that predate the shared container
	 * are not uniformly shaped:
	 *
	 * - `'salesforceData'` — the attribute holds the whole settings object.
	 * - `array( 'name' => 'jetpackCRM', 'maps_to' => 'enabled' )` — the attribute holds a
	 *   single scalar, which stands for one named setting. `jetpackCRM` is a bare boolean, so
	 *   without this form it could not be expressed at all.
	 *
	 * @param mixed $declared The value passed at registration.
	 * @return array|null Normalized as array{name: string, maps_to: string|null}, or null.
	 */
	private static function normalize_settings_attribute( $declared ) {
		if ( is_string( $declared ) && '' !== $declared ) {
			return array(
				'name'    => $declared,
				'maps_to' => null,
			);
		}

		if ( is_array( $declared ) && ! empty( $declared['name'] ) && is_string( $declared['name'] ) ) {
			$maps_to = isset( $declared['maps_to'] ) && is_string( $declared['maps_to'] ) && '' !== $declared['maps_to']
				? $declared['maps_to']
				: null;

			return array(
				'name'    => $declared['name'],
				'maps_to' => $maps_to,
			);
		}

		return null;
	}

	/**
	 * How a form stores settings for an integration.
	 *
	 * @param string $slug Integration slug.
	 * @return array|null array{name: string, maps_to: string|null} for an integration using a
	 *                    legacy top-level block attribute, or null when it uses the shared
	 *                    `integrations` container.
	 */
	public static function get_settings_attribute( $slug ) {
		$args = self::get( $slug );

		return $args ? $args['settings_attribute'] : null;
	}

	/**
	 * Reset the registry.
	 *
	 * Only intended for tests, which need a clean registry between cases.
	 *
	 * @return void
	 */
	public static function reset() {
		self::$integrations = array();
	}
}
