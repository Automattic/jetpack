<?php
/**
 * Registry of the single-report pages registered with the dashboard.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/dashboard-grammar.php';

/**
 * Holds the single-report pages per dashboard, hydrated once after `init`.
 *
 * @since $$next-version$$
 */
final class Single_Report_Page_Registry {

	/**
	 * Action fired once, with the registry, when it hydrates on its first read after `init`.
	 */
	const REGISTER_ACTION = 'jetpack_premium_analytics_register_single_report_pages';

	/**
	 * Registered pages, keyed by dashboard name then page id.
	 *
	 * @var array<string, array<string, Single_Report_Page>>
	 */
	private $registered_pages = array();

	/**
	 * Whether the registration action has fired.
	 *
	 * @var bool
	 */
	private $hydrated = false;

	/**
	 * Main instance.
	 *
	 * @var self|null
	 */
	private static $instance = null;

	/**
	 * Registers a page.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $id             Page identifier, namespaced.
	 * @param array  $args           Page arguments.
	 * @return Single_Report_Page|false The page on success, false on failure.
	 */
	public function register( $dashboard_name, $id, $args = array() ) {
		if ( ! is_string( $dashboard_name ) || 1 !== preg_match( '/^' . get_dashboard_name_pattern() . '$/', $dashboard_name ) ) {
			_doing_it_wrong( __METHOD__, esc_html__( 'Dashboard names must be lowercase strings of letters, numbers, and hyphens, optionally separated by underscores.', 'jetpack-premium-analytics-pkg' ), 'jetpack-premium-analytics-$$next-version$$' );
			return false;
		}

		if ( ! is_string( $id ) || 1 !== preg_match( '/^' . get_dashboard_section_id_pattern() . '$/', $id ) ) {
			_doing_it_wrong( __METHOD__, esc_html__( 'Single-report page IDs must contain a namespace prefix. Example: my-plugin/my-entity', 'jetpack-premium-analytics-pkg' ), 'jetpack-premium-analytics-$$next-version$$' );
			return false;
		}

		if ( $this->is_registered( $dashboard_name, $id ) ) {
			/* translators: 1: Dashboard name. 2: Page ID. */
			$message = sprintf( __( 'Single-report page "%2$s" is already registered for dashboard "%1$s".', 'jetpack-premium-analytics-pkg' ), $dashboard_name, $id );
			_doing_it_wrong( __METHOD__, esc_html( $message ), 'jetpack-premium-analytics-$$next-version$$' );
			return false;
		}

		$page = new Single_Report_Page( $dashboard_name, $id, $args );

		// The client routes by path, so two ids may not share one.
		$holder = $this->find_registered_by_path( $dashboard_name, $page->path );
		if ( $holder ) {
			/* translators: 1: Dashboard name. 2: Page path. 3: ID of the page already using the path. */
			$message = sprintf( __( 'Single-report page path "%2$s" is already used on dashboard "%1$s" by "%3$s".', 'jetpack-premium-analytics-pkg' ), $dashboard_name, $page->path, $holder->id );
			_doing_it_wrong( __METHOD__, esc_html( $message ), 'jetpack-premium-analytics-$$next-version$$' );
			return false;
		}

		if ( ! isset( $this->registered_pages[ $dashboard_name ] ) ) {
			$this->registered_pages[ $dashboard_name ] = array();
		}

		$this->registered_pages[ $dashboard_name ][ $id ] = $page;

		return $page;
	}

	/**
	 * A registered page, or null.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $id             Page identifier.
	 * @return Single_Report_Page|null
	 */
	public function get_registered( $dashboard_name, $id ) {
		$this->ensure_hydrated();

		return $this->registered_pages[ $dashboard_name ][ $id ] ?? null;
	}

	/**
	 * The registered page using a path, or null.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $path           Page path.
	 * @return Single_Report_Page|null
	 */
	public function get_registered_by_path( $dashboard_name, $path ) {
		$this->ensure_hydrated();

		return $this->find_registered_by_path( $dashboard_name, $path );
	}

	/**
	 * Looks a path up without hydrating.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $path           Page path.
	 * @return Single_Report_Page|null
	 */
	private function find_registered_by_path( $dashboard_name, $path ) {
		foreach ( $this->registered_pages[ $dashboard_name ] ?? array() as $page ) {
			if ( $page->path === $path ) {
				return $page;
			}
		}

		return null;
	}

	/**
	 * Every registered page of a dashboard, keyed by id.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @return array<string, Single_Report_Page>
	 */
	public function get_all_registered( $dashboard_name ) {
		$this->ensure_hydrated();

		return $this->registered_pages[ $dashboard_name ] ?? array();
	}

	/**
	 * The pages available to the current reader, as a list.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @return Single_Report_Page[]
	 */
	public function get_available_pages( $dashboard_name ) {
		$pages = array_filter(
			$this->get_all_registered( $dashboard_name ),
			static function ( Single_Report_Page $page ) {
				return $page->is_available();
			}
		);

		return array_values( $pages );
	}

	/**
	 * Whether a page id is registered. Does not hydrate: `register()` relies on it.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $id             Page identifier.
	 * @return bool
	 */
	public function is_registered( $dashboard_name, $id ) {
		return isset( $this->registered_pages[ $dashboard_name ][ $id ] );
	}

	/**
	 * Fires the registration action once, after `init`.
	 */
	private function ensure_hydrated() {
		if ( $this->hydrated ) {
			return;
		}

		// Latching this early would drop every registrant hooked later, so the read skips the action.
		if ( ! did_action( 'init' ) ) {
			_doing_it_wrong( __METHOD__, esc_html__( 'Single-report pages are read after init. A read before it does not hydrate the registry and answers only what was registered directly.', 'jetpack-premium-analytics-pkg' ), 'jetpack-premium-analytics-$$next-version$$' );
			return;
		}

		// Latched before the action so a registrant that reads the registry cannot re-enter.
		$this->hydrated = true;

		/**
		 * Fires once when the single-report page registry hydrates.
		 *
		 * @since $$next-version$$
		 *
		 * @param Single_Report_Page_Registry $registry The registry being hydrated.
		 */
		do_action( self::REGISTER_ACTION, $this );
	}

	/**
	 * The main instance.
	 *
	 * @return self
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}
}
