<?php
/**
 * Dashboard Sections API: Dashboard_Section class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Represents a dashboard section.
 *
 * A dashboard section is the server-owned model behind a top-level dashboard
 * tab. It carries display metadata plus availability and default-layout
 * callbacks that can be extended by consumers.
 */
final class Dashboard_Section {

	/**
	 * Dashboard identifier.
	 *
	 * @var string
	 */
	public $dashboard_name;

	/**
	 * Section identifier.
	 *
	 * @var string
	 */
	public $id;

	/**
	 * Display label.
	 *
	 * @var string
	 */
	public $label;

	/**
	 * Sort order.
	 *
	 * @var int
	 */
	public $order = 10;

	/**
	 * Availability flag or callback.
	 *
	 * @var bool|callable
	 */
	private $is_available = true;

	/**
	 * Default layout array or callback.
	 *
	 * @var array|callable
	 */
	private $default_layout = array();

	/**
	 * Constructor.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $id             Section identifier.
	 * @param array  $args           Optional. Section arguments.
	 */
	public function __construct( $dashboard_name, $id, $args = array() ) {
		$this->dashboard_name = $dashboard_name;
		$this->id             = $id;
		$this->label          = $id;

		$this->set_props( $args );
	}

	/**
	 * Returns whether this section should be exposed.
	 *
	 * @return bool
	 */
	public function is_available() {
		if ( is_callable( $this->is_available ) ) {
			return (bool) call_user_func( $this->is_available, $this );
		}

		return (bool) $this->is_available;
	}

	/**
	 * Returns the section's default widget layout.
	 *
	 * @return array Array of widget instances.
	 */
	public function get_default_layout() {
		$layout = is_callable( $this->default_layout )
			? call_user_func( $this->default_layout, $this )
			: $this->default_layout;

		return is_array( $layout ) ? array_values( $layout ) : array();
	}

	/**
	 * Returns the public REST representation.
	 *
	 * @return array
	 */
	public function to_array() {
		return array(
			'id'    => $this->id,
			'label' => $this->label,
			'order' => (int) $this->order,
		);
	}

	/**
	 * Hydrates section properties from the args array.
	 *
	 * @param array $args Section arguments.
	 * @return void
	 */
	private function set_props( $args ) {
		if ( ! is_array( $args ) ) {
			return;
		}

		if ( isset( $args['label'] ) ) {
			$this->label = (string) $args['label'];
		}

		if ( isset( $args['order'] ) ) {
			$this->order = (int) $args['order'];
		}

		if ( array_key_exists( 'is_available', $args ) ) {
			$this->is_available = $args['is_available'];
		}

		if ( array_key_exists( 'default_layout', $args ) ) {
			$this->default_layout = $args['default_layout'];
		}
	}
}
