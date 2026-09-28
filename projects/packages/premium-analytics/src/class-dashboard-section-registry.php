<?php
/**
 * Dashboard Sections API: Dashboard_Section_Registry class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/dashboard-grammar.php';

/**
 * Stores Dashboard_Section instances keyed by dashboard and section ID.
 *
 * Hydrates on its first read: the registration action fires once, and every registrant, this
 * package included, registers its sections from there. Reads happen after `init`, from wp-admin
 * and from REST, so hooking the action is the one moment that covers both paths.
 */
final class Dashboard_Section_Registry {

	/**
	 * Action through which sections are registered, fired once on the first read.
	 *
	 * @since $$next-version$$
	 * @var string
	 */
	const REGISTER_ACTION = 'jetpack_premium_analytics_register_dashboard_sections';

	/**
	 * Registered sections, as `$dashboard_name => $id => $section` pairs.
	 *
	 * @var array<string, Dashboard_Section[]>
	 */
	private $registered_sections = array();

	/**
	 * Whether the registration action has fired.
	 *
	 * @var bool
	 */
	private $hydrated = false;

	/**
	 * Container for the main instance of the class.
	 *
	 * @var Dashboard_Section_Registry|null
	 */
	private static $instance = null;

	/**
	 * Registers a dashboard section.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $id             Section identifier.
	 * @param array  $args           Optional. Section arguments.
	 * @return Dashboard_Section|false The registered section on success, or false on failure.
	 */
	public function register( $dashboard_name, $id, $args = array() ) {
		if ( ! $this->is_valid_dashboard_name( $dashboard_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				esc_html__( 'Dashboard names must be lowercase strings of letters, numbers, and hyphens, optionally separated by underscores.', 'jetpack-premium-analytics-pkg' ),
				'0.1.0'
			);
			return false;
		}

		if ( ! $this->is_valid_section_id( $id ) ) {
			_doing_it_wrong(
				__METHOD__,
				esc_html__( 'Dashboard section IDs must contain a namespace prefix. Example: my-plugin/my-custom-section', 'jetpack-premium-analytics-pkg' ),
				'0.1.0'
			);
			return false;
		}

		if ( $this->is_registered( $dashboard_name, $id ) ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: 1: Dashboard name. 2: Dashboard section ID. */
					esc_html__( 'Dashboard section "%2$s" is already registered for dashboard "%1$s".', 'jetpack-premium-analytics-pkg' ),
					esc_html( $dashboard_name ),
					esc_html( $id )
				),
				'0.1.0'
			);
			return false;
		}

		$section = new Dashboard_Section( $dashboard_name, $id, $args );

		// The client keys tabs, URLs and stored layouts by slug, so two ids may not share one.
		$holder = $this->find_registered_by_slug( $dashboard_name, $section->slug );
		if ( $holder ) {
			$message = sprintf(
				/* translators: 1: Dashboard name. 2: Section slug. 3: ID of the section already using the slug. */
				__( 'Dashboard section slug "%2$s" is already used on dashboard "%1$s" by "%3$s".', 'jetpack-premium-analytics-pkg' ),
				$dashboard_name,
				$section->slug,
				$holder->id
			);
			// One line: tools/replace-next-version-tag.sh only rewrites the token in a single-line call.
			_doing_it_wrong( __METHOD__, esc_html( $message ), 'jetpack-premium-analytics-$$next-version$$' );
			return false;
		}

		if ( ! isset( $this->registered_sections[ $dashboard_name ] ) ) {
			$this->registered_sections[ $dashboard_name ] = array();
		}

		$this->registered_sections[ $dashboard_name ][ $id ] = $section;

		return $section;
	}

	/**
	 * Retrieves a registered section.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $id             Section identifier.
	 * @return Dashboard_Section|null The registered section, or null when absent.
	 */
	public function get_registered( $dashboard_name, $id ) {
		$this->ensure_hydrated();

		if ( ! $this->is_registered( $dashboard_name, $id ) ) {
			return null;
		}

		return $this->registered_sections[ $dashboard_name ][ $id ];
	}

	/**
	 * Retrieves a registered section by its URL-facing slug.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $slug           Section slug, e.g. `ads`.
	 * @return Dashboard_Section|null The registered section, or null when no section uses the slug.
	 */
	public function get_registered_by_slug( $dashboard_name, $slug ) {
		$this->ensure_hydrated();

		return $this->find_registered_by_slug( $dashboard_name, $slug );
	}

	/**
	 * Finds a registered section by slug without hydrating: register() relies on it.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $slug           Section slug.
	 * @return Dashboard_Section|null
	 */
	private function find_registered_by_slug( $dashboard_name, $slug ) {
		foreach ( $this->registered_sections[ $dashboard_name ] ?? array() as $section ) {
			if ( $section->slug === $slug ) {
				return $section;
			}
		}

		return null;
	}

	/**
	 * Retrieves all registered sections for a dashboard.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @return Dashboard_Section[] Map of `$id => $section` pairs.
	 */
	public function get_all_registered( $dashboard_name ) {
		$this->ensure_hydrated();

		if ( ! isset( $this->registered_sections[ $dashboard_name ] ) ) {
			// Unknown dashboards may be valid REST targets but have no sections registered.
			return array();
		}

		return $this->registered_sections[ $dashboard_name ];
	}

	/**
	 * Retrieves available sections sorted by order.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @return Dashboard_Section[] Ordered list of available sections.
	 */
	public function get_available_sections( $dashboard_name ) {
		$sections = array_filter(
			$this->get_all_registered( $dashboard_name ),
			static function ( Dashboard_Section $section ) {
				return $section->is_available();
			}
		);

		uasort(
			$sections,
			static function ( Dashboard_Section $a, Dashboard_Section $b ) {
				if ( $a->order === $b->order ) {
					return strcmp( $a->id, $b->id );
				}

				return $a->order <=> $b->order;
			}
		);

		return array_values( $sections );
	}

	/**
	 * Checks if a section is registered. Does not hydrate: register() relies on it, and a
	 * registrant may run before the action fires.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $id             Section identifier.
	 * @return bool True if registered.
	 */
	public function is_registered( $dashboard_name, $id ) {
		return isset( $this->registered_sections[ $dashboard_name ][ $id ] );
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
			$message = __( 'Dashboard sections are read after init. A read before it does not hydrate the registry and answers only what was registered directly.', 'jetpack-premium-analytics-pkg' );
			// One line: tools/replace-next-version-tag.sh only rewrites the token in a single-line call.
			_doing_it_wrong( __METHOD__, esc_html( $message ), 'jetpack-premium-analytics-$$next-version$$' );
			return;
		}

		// Latched before the action so a registrant that reads the registry cannot re-enter.
		$this->hydrated = true;

		/**
		 * Fires when the dashboard section registry hydrates, on its first read after `init`.
		 *
		 * Register sections here rather than on `init`: the registry is read from wp-admin and
		 * from REST, and each path loads it at a different moment. A registrant that may run
		 * twice guards with `is_registered()`.
		 *
		 * @since $$next-version$$
		 *
		 * @param Dashboard_Section_Registry $registry The registry being hydrated.
		 */
		do_action( self::REGISTER_ACTION, $this );
	}

	/**
	 * Utility method to retrieve the main instance of the class.
	 *
	 * @return Dashboard_Section_Registry The main instance.
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Checks whether a dashboard name can be registered.
	 *
	 * @param mixed $dashboard_name Candidate dashboard name.
	 * @return bool
	 */
	private function is_valid_dashboard_name( $dashboard_name ) {
		return is_string( $dashboard_name ) && 1 === preg_match( '/^' . get_dashboard_name_pattern() . '$/', $dashboard_name );
	}

	/**
	 * Checks whether a section ID can be registered.
	 *
	 * @param mixed $id Candidate section ID.
	 * @return bool
	 */
	private function is_valid_section_id( $id ) {
		return is_string( $id ) && 1 === preg_match( '/^' . get_dashboard_section_id_pattern() . '$/', $id );
	}
}
