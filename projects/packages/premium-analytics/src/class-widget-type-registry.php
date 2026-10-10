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
	 * @since 0.9.0
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
	 * Former names of the registered widget types, as `$former_name => $current_name` pairs.
	 *
	 * @var string[]
	 */
	private $former_names = array();

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

		if ( isset( $this->former_names[ $name ] ) ) {
			// One line: tools/replace-next-version-tag.sh only rewrites the token in a single-line call.
			_doing_it_wrong( __METHOD__, esc_html( sprintf( /* translators: 1: Widget type name. 2: Widget type name. */ __( 'Widget type "%1$s" is a former name of "%2$s".', 'jetpack-premium-analytics-pkg' ), $name, $this->former_names[ $name ] ) ), 'jetpack-premium-analytics-0.11.0' );
			return false;
		}

		$former_names = self::normalize_former_names( $widget_type ? $widget_type->former_names : ( $args['former_names'] ?? null ) );
		if ( null !== $former_names && ! $this->former_names_are_free( $name, $former_names ) ) {
			return false;
		}
		// The type keeps the normalized list: it is what the REST record publishes.
		if ( $widget_type ) {
			$widget_type->former_names = $former_names;
		} else {
			$args['former_names'] = $former_names;
		}

		if ( ! $widget_type ) {
			$widget_type = new Widget_Type( $name, $args );
		}

		$this->registered_widget_types[ $name ] = $widget_type;
		foreach ( (array) $widget_type->former_names as $former_name ) {
			$this->former_names[ $former_name ] = $name;
		}

		return $widget_type;
	}

	/**
	 * Normalizes declared former names to a list of distinct values, or null when there are none.
	 *
	 * A keyed array, say what `array_unique()` leaves behind, would reach the client as an object
	 * instead of a list. Anything but an array passes through for `former_names_are_free()` to refuse.
	 *
	 * @param mixed $former_names The declared former names.
	 * @return mixed
	 */
	private static function normalize_former_names( $former_names ) {
		if ( ! is_array( $former_names ) ) {
			return $former_names;
		}

		$former_names = array_values( array_unique( $former_names, SORT_REGULAR ) );

		return $former_names ? $former_names : null;
	}

	/**
	 * Whether a widget type may claim the given former names.
	 *
	 * Each one must be a namespaced lowercase name that no registered type or other former name
	 * holds; a failure is a `_doing_it_wrong()`.
	 *
	 * @param string $name         The widget type claiming the names.
	 * @param mixed  $former_names The claimed former names.
	 * @return bool
	 */
	private function former_names_are_free( $name, $former_names ) {
		$taken = null;
		if ( is_array( $former_names ) ) {
			foreach ( $former_names as $former_name ) {
				if ( ! is_string( $former_name ) || ! preg_match( '/^[a-z0-9-]+\/[a-z0-9-]+$/', $former_name ) || $former_name === $name ) {
					$taken = is_string( $former_name ) ? $former_name : gettype( $former_name );
					break;
				}
				$owner = $this->former_names[ $former_name ] ?? null;
				if ( $this->is_registered( $former_name ) || ( null !== $owner && $owner !== $name ) ) {
					$taken = $former_name;
					break;
				}
			}
		} else {
			$taken = is_scalar( $former_names ) ? (string) $former_names : gettype( $former_names );
		}

		if ( null === $taken ) {
			return true;
		}

		// One line: tools/replace-next-version-tag.sh only rewrites the token in a single-line call.
		_doing_it_wrong( __METHOD__, esc_html( sprintf( /* translators: 1: Widget type name. 2: Former name. */ __( 'Widget type "%1$s" cannot claim "%2$s" as a former name: it must be a namespaced lowercase name that no registered widget type holds.', 'jetpack-premium-analytics-pkg' ), $name, $taken ) ), 'jetpack-premium-analytics-0.11.0' );
		return false;
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
		$this->former_names = array_filter(
			$this->former_names,
			static function ( $current_name ) use ( $name ) {
				return $current_name !== $name;
			}
		);

		return $unregistered_widget_type;
	}

	/**
	 * Resolves a possibly former name to the current widget type name.
	 *
	 * Does not hydrate: call it after a read, since former names arrive with their types'
	 * registration. An unknown name comes back unchanged.
	 *
	 * @since 0.11.0
	 *
	 * @param string $name Widget type name, current or former.
	 * @return string The current name.
	 */
	public function resolve_name( $name ) {
		return $this->former_names[ $name ] ?? $name;
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

		$name = $this->resolve_name( $name );
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
			_doing_it_wrong( __METHOD__, esc_html( $message ), 'jetpack-premium-analytics-0.9.0' );
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
		 * @since 0.9.0
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
