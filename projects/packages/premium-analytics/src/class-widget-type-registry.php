<?php
/**
 * Widget Types API: Widget_Type_Registry class.
 *
 * PA-namespaced copy of the dashboard widget-type registry (the core/Gutenberg
 * version is gated behind an experimental flag). Stays fully isolated from any
 * core registry so the two never share state.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Stores Widget_Type instances keyed by their namespaced name.
 *
 * Singleton hydrated once per request from the build manifest at `init` (see
 * widget-types.php); consumers query the registry instead of re-parsing the
 * manifest.
 */
#[\AllowDynamicProperties]
final class Widget_Type_Registry {

	/**
	 * Registered widget types, as `$name => $instance` pairs.
	 *
	 * @var Widget_Type[]
	 */
	private $registered_widget_types = array();

	/**
	 * Container for the main instance of the class.
	 *
	 * @var Widget_Type_Registry|null
	 */
	private static $instance = null;

	/**
	 * Registers a widget type.
	 *
	 * @param string|Widget_Type $name Widget type name including namespace, or
	 *                                 a complete Widget_Type instance. When an
	 *                                 instance is provided the `$args` parameter
	 *                                 is ignored.
	 * @param array              $args Optional. Array of widget type arguments.
	 *                                 Accepts any public property of
	 *                                 Widget_Type. Default empty array.
	 * @return Widget_Type|false The registered widget type on success, or false
	 *                           on failure.
	 */
	public function register( $name, $args = array() ) {
		$widget_type = null;
		if ( $name instanceof Widget_Type ) {
			$widget_type = $name;
			$name        = $widget_type->name;
		}

		if ( ! is_string( $name ) ) {
			_doing_it_wrong(
				__METHOD__,
				esc_html__( 'Widget type names must be strings.', 'jetpack-premium-analytics' ),
				'0.1.0'
			);
			return false;
		}

		if ( preg_match( '/[A-Z]+/', $name ) ) {
			_doing_it_wrong(
				__METHOD__,
				esc_html__( 'Widget type names must not contain uppercase characters.', 'jetpack-premium-analytics' ),
				'0.1.0'
			);
			return false;
		}

		$name_matcher = '/^[a-z0-9-]+\/[a-z0-9-]+$/';
		if ( ! preg_match( $name_matcher, $name ) ) {
			_doing_it_wrong(
				__METHOD__,
				esc_html__( 'Widget type names must contain a namespace prefix. Example: my-plugin/my-custom-widget-type', 'jetpack-premium-analytics' ),
				'0.1.0'
			);
			return false;
		}

		if ( $this->is_registered( $name ) ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: Widget type name. */
					esc_html__( 'Widget type "%s" is already registered.', 'jetpack-premium-analytics' ),
					esc_html( $name )
				),
				'0.1.0'
			);
			return false;
		}

		if ( ! $widget_type ) {
			$widget_type = new Widget_Type( $name, $args );
		}

		$this->registered_widget_types[ $name ] = $widget_type;

		return $widget_type;
	}

	/**
	 * Unregisters a widget type.
	 *
	 * @param string|Widget_Type $name Widget type name including namespace, or
	 *                                 a complete Widget_Type instance.
	 * @return Widget_Type|false The unregistered widget type on success, or
	 *                           false on failure.
	 */
	public function unregister( $name ) {
		if ( $name instanceof Widget_Type ) {
			$name = $name->name;
		}

		if ( ! $this->is_registered( $name ) ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: Widget type name. */
					esc_html__( 'Widget type "%s" is not registered.', 'jetpack-premium-analytics' ),
					esc_html( $name )
				),
				'0.1.0'
			);
			return false;
		}

		$unregistered_widget_type = $this->registered_widget_types[ $name ];
		unset( $this->registered_widget_types[ $name ] );

		return $unregistered_widget_type;
	}

	/**
	 * Retrieves a registered widget type.
	 *
	 * @param string $name Widget type name including namespace.
	 * @return Widget_Type|null The registered widget type, or null if it is not
	 *                          registered.
	 */
	public function get_registered( $name ) {
		if ( ! $this->is_registered( $name ) ) {
			return null;
		}

		return $this->registered_widget_types[ $name ];
	}

	/**
	 * Retrieves all registered widget types.
	 *
	 * @return Widget_Type[] Associative array of `$name => $widget_type` pairs.
	 */
	public function get_all_registered() {
		return $this->registered_widget_types;
	}

	/**
	 * Checks if a widget type is registered.
	 *
	 * @param string $name Widget type name including namespace.
	 * @return bool True if the widget type is registered, false otherwise.
	 */
	public function is_registered( $name ) {
		return isset( $this->registered_widget_types[ $name ] );
	}

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * The instance will be created if it does not exist yet.
	 *
	 * @return Widget_Type_Registry The main instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}
}
