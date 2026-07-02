<?php
/**
 * Dashboard Sections API: Dashboard_Section_Registry class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Stores Dashboard_Section instances keyed by dashboard and section ID.
 */
final class Dashboard_Section_Registry {

	/**
	 * Registered sections, as `$dashboard_name => $id => $section` pairs.
	 *
	 * @var array<string, Dashboard_Section[]>
	 */
	private $registered_sections = array();

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
				esc_html__( 'Dashboard names must be lowercase strings containing only letters, numbers, hyphens, and underscores.', 'jetpack-premium-analytics' ),
				'0.1.0'
			);
			return false;
		}

		if ( ! $this->is_valid_section_id( $id ) ) {
			_doing_it_wrong(
				__METHOD__,
				esc_html__( 'Dashboard section IDs must be lowercase strings containing only letters, numbers, and hyphens.', 'jetpack-premium-analytics' ),
				'0.1.0'
			);
			return false;
		}

		if ( $this->is_registered( $dashboard_name, $id ) ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: 1: Dashboard name. 2: Dashboard section ID. */
					esc_html__( 'Dashboard section "%2$s" is already registered for dashboard "%1$s".', 'jetpack-premium-analytics' ),
					esc_html( $dashboard_name ),
					esc_html( $id )
				),
				'0.1.0'
			);
			return false;
		}

		$section = new Dashboard_Section( $dashboard_name, $id, $args );

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
		if ( ! $this->is_registered( $dashboard_name, $id ) ) {
			return null;
		}

		return $this->registered_sections[ $dashboard_name ][ $id ];
	}

	/**
	 * Retrieves all registered sections for a dashboard.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @return Dashboard_Section[] Map of `$id => $section` pairs.
	 */
	public function get_all_registered( $dashboard_name ) {
		return $this->registered_sections[ $dashboard_name ] ?? array();
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
				if ( (int) $a->order === (int) $b->order ) {
					return strcmp( $a->id, $b->id );
				}

				return (int) $a->order < (int) $b->order ? -1 : 1;
			}
		);

		return array_values( $sections );
	}

	/**
	 * Checks if a section is registered.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $id             Section identifier.
	 * @return bool True if registered.
	 */
	public function is_registered( $dashboard_name, $id ) {
		return isset( $this->registered_sections[ $dashboard_name ][ $id ] );
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
		return is_string( $dashboard_name ) && 1 === preg_match( '/^[a-z][a-z0-9-_]*$/', $dashboard_name );
	}

	/**
	 * Checks whether a section ID can be registered.
	 *
	 * @param mixed $id Candidate section ID.
	 * @return bool
	 */
	private function is_valid_section_id( $id ) {
		return is_string( $id ) && 1 === preg_match( '/^[a-z][a-z0-9-]*$/', $id );
	}
}
