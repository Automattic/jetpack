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
 * Hydrates on its first read: the registration action fires once, and every registrant, the
 * manifest hydration in widget-types.php included, registers its widget types from there. Reads
 * happen after `init`, while the page boot dependencies are built and from REST, so hooking the
 * action is the one moment that covers both paths.
 */
#[\AllowDynamicProperties]
final class Widget_Type_Registry {

	/**
	 * Action through which widget types are registered, fired once on the first read.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	const REGISTER_ACTION = 'jetpack_premium_analytics_register_widget_types';

	/**
	 * Registered widget types, as `$name => $instance` pairs.
	 *
	 * @var Widget_Type[]
	 */
	private $registered_widget_types = array();

	/**
	 * Whether the registration action has fired.
	 *
	 * @var bool
	 */
	private $hydrated = false;

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
				esc_html__( 'Widget type names must be strings.', 'jetpack-premium-analytics-pkg' ),
				'0.1.0'
			);
			return false;
		}

		if ( preg_match( '/[A-Z]+/', $name ) ) {
			_doing_it_wrong(
				__METHOD__,
				esc_html__( 'Widget type names must not contain uppercase characters.', 'jetpack-premium-analytics-pkg' ),
				'0.1.0'
			);
			return false;
		}

		$name_matcher = '/^[a-z0-9-]+\/[a-z0-9-]+$/';
		if ( ! preg_match( $name_matcher, $name ) ) {
			_doing_it_wrong(
				__METHOD__,
				esc_html__( 'Widget type names must contain a namespace prefix. Example: my-plugin/my-custom-widget-type', 'jetpack-premium-analytics-pkg' ),
				'0.1.0'
			);
			return false;
		}

		if ( $this->is_registered( $name ) ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: Widget type name. */
					esc_html__( 'Widget type "%s" is already registered.', 'jetpack-premium-analytics-pkg' ),
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
					esc_html__( 'Widget type "%s" is not registered.', 'jetpack-premium-analytics-pkg' ),
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
		$this->ensure_hydrated();

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
		$this->ensure_hydrated();

		return $this->registered_widget_types;
	}

	/**
	 * Checks if a widget type is registered. Does not hydrate: register() relies on it, and a
	 * registrant may run before the action fires.
	 *
	 * @param string $name Widget type name including namespace.
	 * @return bool True if the widget type is registered, false otherwise.
	 */
	public function is_registered( $name ) {
		return isset( $this->registered_widget_types[ $name ] );
	}

	/**
	 * Fires the registration action once, on the first read after `init`.
	 *
	 * @return void
	 */
	private function ensure_hydrated() {
		if ( $this->hydrated ) {
			return;
		}

		// Latching this early would drop every registrant hooked later, so the read skips the action.
		if ( ! did_action( 'init' ) ) {
			$message = __( 'Widget types are read after init. A read before it does not hydrate the registry and answers only what was registered directly.', 'jetpack-premium-analytics-pkg' );
			// One line: tools/replace-next-version-tag.sh only rewrites the token in a single-line call.
			_doing_it_wrong( __METHOD__, esc_html( $message ), 'jetpack-premium-analytics-$$next-version$$' );
			return;
		}

		// Latched before the action so a registrant that reads the registry cannot re-enter.
		$this->hydrated = true;

		/**
		 * Fires when the widget type registry hydrates, on its first read after `init`.
		 *
		 * Register widget types here rather than on `init`: the registry is read while the page
		 * boot dependencies are built and from REST, and each path loads it at a different
		 * moment. A registrant that may run twice guards with `is_registered()`.
		 *
		 * @since $$next-version$$
		 *
		 * @param Widget_Type_Registry $registry The registry being hydrated.
		 */
		do_action( self::REGISTER_ACTION, $this );
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
