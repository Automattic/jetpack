<?php
/**
 * Promo Slot API: Promo_Registry class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Stores Promo instances keyed by slug.
 *
 * Hydrates on its first read: the registration action fires once, and every registrant registers
 * its promos from there.
 *
 * @since $$next-version$$
 */
final class Promo_Registry {

	/**
	 * Action through which promos are registered, fired once on the first read.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	const REGISTER_ACTION = 'jetpack_premium_analytics_register_promos';

	/**
	 * Placements a promo may render in.
	 *
	 * @since $$next-version$$
	 * @var string[]
	 */
	const PLACEMENTS = array( 'options-menu', 'settings' );

	/**
	 * Registered promos, as `$slug => $promo` pairs.
	 *
	 * @var array<string, Promo>
	 */
	private $registered_promos = array();

	/**
	 * Whether the registration action has fired.
	 *
	 * @var bool
	 */
	private $hydrated = false;

	/**
	 * The gated promos for this request, or null before anything has asked for them.
	 *
	 * @var Promo[]|null
	 */
	private $available_promos = null;

	/**
	 * Container for the main instance of the class.
	 *
	 * @var Promo_Registry|null
	 */
	private static $instance = null;

	/**
	 * Registers a promo.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $slug Promo identifier, namespaced like `acme/offer`.
	 * @param array  $args Optional. Promo arguments.
	 * @return Promo|false The registered promo on success, or false on failure.
	 */
	public function register( $slug, $args = array() ) {
		if ( ! is_string( $slug ) || 1 !== preg_match( '/^[a-z][a-z0-9-]*\/[a-z][a-z0-9-]*$/', $slug ) ) {
			return $this->refuse( __( 'Promo slugs must be lowercase and contain a namespace prefix. Example: my-plugin/my-offer', 'jetpack-premium-analytics-pkg' ) );
		}

		if ( $this->is_registered( $slug ) ) {
			/* translators: %s: Promo slug. */
			return $this->refuse( sprintf( __( 'Promo "%s" is already registered.', 'jetpack-premium-analytics-pkg' ), $slug ) );
		}

		$args = is_array( $args ) ? $args : array();

		// Checked on the raw value: Promo casts it to a string, which would let any scalar through.
		if ( isset( $args['render_module'] ) && ( ! is_string( $args['render_module'] ) || '' === $args['render_module'] ) ) {
			return $this->refuse( __( 'A promo render module must be a non-empty string.', 'jetpack-premium-analytics-pkg' ) );
		}

		// A misspelled function name is truthy, and the promo would show to everyone.
		if ( isset( $args['is_available'] ) && ! is_bool( $args['is_available'] ) && ! is_callable( $args['is_available'] ) ) {
			return $this->refuse( __( 'A promo is_available must be a callable or a boolean.', 'jetpack-premium-analytics-pkg' ) );
		}

		$promo = new Promo( $slug, $args );

		if ( ! in_array( $promo->placement, self::PLACEMENTS, true ) ) {
			/* translators: %s: Comma-separated list of placements. */
			return $this->refuse( sprintf( __( 'A promo placement must be one of: %s.', 'jetpack-premium-analytics-pkg' ), implode( ', ', self::PLACEMENTS ) ) );
		}

		// A card is labelled by its title; a menu item is labelled by its cta_label below.
		if ( 'options-menu' !== $promo->placement && '' === $promo->title ) {
			return $this->refuse( __( 'A promo card needs a title. The card is labelled by it.', 'jetpack-premium-analytics-pkg' ) );
		}

		if ( 'options-menu' === $promo->placement && '' === $promo->cta_label ) {
			return $this->refuse( __( 'An options-menu promo needs a cta_label. The label is the menu item.', 'jetpack-premium-analytics-pkg' ) );
		}

		if ( 'options-menu' === $promo->placement && $promo->dismissible ) {
			return $this->refuse( __( 'An options-menu promo cannot be dismissible. Pass dismissible as false.', 'jetpack-premium-analytics-pkg' ) );
		}

		if ( 'options-menu' === $promo->placement && null !== $promo->render_module ) {
			return $this->refuse( __( 'An options-menu promo is a menu item and cannot have a render module.', 'jetpack-premium-analytics-pkg' ) );
		}

		if ( $promo->snooze_days < 0 ) {
			return $this->refuse( __( 'A promo snooze_days cannot be negative.', 'jetpack-premium-analytics-pkg' ) );
		}

		if ( ! $promo->dismissible && isset( $args['snooze_days'] ) ) {
			return $this->refuse( __( 'A promo that is not dismissible cannot have snooze_days.', 'jetpack-premium-analytics-pkg' ) );
		}

		$this->registered_promos[ $slug ] = $promo;

		return $promo;
	}

	/**
	 * Retrieves a registered promo.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $slug Promo identifier.
	 * @return Promo|null The registered promo, or null when absent.
	 */
	public function get_registered( $slug ) {
		$this->ensure_hydrated();

		return $this->registered_promos[ $slug ] ?? null;
	}

	/**
	 * Runs the gates once and answers from that result for the rest of the request. A registrant's
	 * `is_available` rule may be expensive, and both the script data and the import map ask.
	 *
	 * @since $$next-version$$
	 *
	 * @param callable $compute Applies the gates to the registered promos.
	 * @return Promo[] The gated promos.
	 */
	public function remember_available( callable $compute ) {
		if ( null === $this->available_promos ) {
			$this->available_promos = $compute();
		}

		return $this->available_promos;
	}

	/**
	 * Retrieves all registered promos.
	 *
	 * @since $$next-version$$
	 *
	 * @return Promo[] Map of `$slug => $promo` pairs.
	 */
	public function get_all_registered() {
		$this->ensure_hydrated();

		return $this->registered_promos;
	}

	/**
	 * Checks if a promo is registered. Does not hydrate: register() relies on it, and a
	 * registrant may run before the action fires.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $slug Promo identifier.
	 * @return bool True if registered.
	 */
	public function is_registered( $slug ) {
		return isset( $this->registered_promos[ $slug ] );
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
			$message = __( 'Promos are read after init. A read before it does not hydrate the registry and answers only what was registered directly.', 'jetpack-premium-analytics-pkg' );
			_doing_it_wrong( __METHOD__, esc_html( $message ), 'jetpack-premium-analytics-$$next-version$$' );
			return;
		}

		// Latched before the action so a registrant that reads the registry cannot re-enter.
		$this->hydrated = true;

		/**
		 * Fires when the promo registry hydrates, on its first read after `init`.
		 *
		 * Register promos here rather than on `init`. A registrant that may run twice guards
		 * with `is_registered()`.
		 *
		 * @since $$next-version$$
		 *
		 * @param Promo_Registry $registry The registry being hydrated.
		 */
		do_action( self::REGISTER_ACTION, $this );
	}

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * @since $$next-version$$
	 *
	 * @return Promo_Registry The main instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Reports a refused registration.
	 *
	 * @param string $message Reason, unescaped.
	 * @return false
	 */
	private function refuse( $message ) {
		// One line: tools/replace-next-version-tag.sh only rewrites the token in a single-line call.
		_doing_it_wrong( __CLASS__ . '::register', esc_html( $message ), 'jetpack-premium-analytics-$$next-version$$' );
		return false;
	}
}
