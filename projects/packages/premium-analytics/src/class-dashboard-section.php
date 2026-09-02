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
 * The server-owned model behind a top-level dashboard tab.
 */
final class Dashboard_Section {

	/**
	 * Date-filter surface offering the rolling date-range picker (today, last 7
	 * days, a custom range, …) plus the comparison control. The default.
	 *
	 * @since 0.2.0
	 * @var string
	 */
	const DATE_FILTER_RANGE = 'range';

	/**
	 * Date-filter surface offering all time plus one entry per calendar year,
	 * for sections whose data is read as whole history rather than as a
	 * rolling window.
	 *
	 * @since 0.2.0
	 * @var string
	 */
	const DATE_FILTER_YEAR = 'year';

	/**
	 * Date-filter surfaces a section may declare.
	 *
	 * @since 0.2.0
	 * @var string[]
	 */
	const DATE_FILTERS = array( self::DATE_FILTER_RANGE, self::DATE_FILTER_YEAR );

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
	 * URL-facing section slug, derived from the identifier.
	 *
	 * @var string
	 */
	public $slug;

	/**
	 * Display label, naming the section's tab.
	 *
	 * @var string
	 */
	public $label;

	/**
	 * Section heading, deliberately distinct from the tab label: the tab reads
	 * `Traffic` where the heading reads `Site traffic`. Null falls back to the label.
	 *
	 * @since 0.3.0
	 * @var string|null
	 */
	public $title = null;

	/**
	 * Sort order.
	 *
	 * @var int
	 */
	public $order = 10;

	/**
	 * Which shape the section's date filter takes, as one of self::DATE_FILTERS.
	 *
	 * Shape only. Where it renders and what it supports are
	 * self::$date_filter_options.
	 *
	 * @since 0.2.0
	 * @var string
	 */
	public $date_filter = self::DATE_FILTER_RANGE;

	/**
	 * What the section's date filter supports, and where it renders.
	 *
	 * - `with_date_comparison`: false drops the comparison param from every widget fetch in the
	 *   section, not just the chrome.
	 * - `with_header_date_control`: false hands the control to the section's widgets, which may
	 *   save the range onto the widget instance rather than the URL.
	 *
	 * @since 0.3.0
	 * @since 0.5.0 Added `with_header_date_control`.
	 * @var array
	 */
	public $date_filter_options = array(
		'with_date_comparison'     => true,
		'with_header_date_control' => true,
	);

	/**
	 * Whether the section's data only reaches WordPress.com through the analytics
	 * full sync, so its numbers are incomplete until that sync has finished once.
	 *
	 * @since 0.4.0
	 * @var bool
	 */
	public $requires_sync = false;

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
		$this->slug           = self::derive_slug( $id );
		$this->label          = $id;

		$this->set_props( $args );
	}

	/**
	 * Derives the URL-facing slug from a namespaced section identifier.
	 *
	 * @param string $id Section identifier, e.g. `analytics/traffic`.
	 * @return string The segment after the namespace, e.g. `traffic`.
	 */
	private static function derive_slug( $id ) {
		$separator = strpos( (string) $id, '/' );

		return false === $separator ? (string) $id : substr( $id, $separator + 1 );
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
			'id'                  => $this->id,
			'slug'                => $this->slug,
			'label'               => $this->label,
			'title'               => $this->title,
			'order'               => (int) $this->order,
			'date_filter'         => $this->date_filter,
			'date_filter_options' => $this->date_filter_options,
			'requires_sync'       => $this->requires_sync,
			'default_layout'      => $this->get_default_layout(),
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

		// An empty string is a registrant saying "none", not a heading: kept as-is it
		// would defeat the label fallback and render an `<h2>` with no accessible name.
		if ( isset( $args['title'] ) ) {
			$title       = (string) $args['title'];
			$this->title = '' === $title ? null : $title;
		}

		if ( isset( $args['order'] ) ) {
			$this->order = (int) $args['order'];
		}

		// An unrecognized surface keeps the default rather than reaching the
		// dashboard, where the frontend has no filter to render for it.
		if ( isset( $args['date_filter'] ) && in_array( $args['date_filter'], self::DATE_FILTERS, true ) ) {
			$this->date_filter = (string) $args['date_filter'];
		}

		// Merged over the defaults so a partial array keeps the rest, and narrowed
		// to the known options, which is all the dashboard renders.
		if ( isset( $args['date_filter_options'] ) && is_array( $args['date_filter_options'] ) ) {
			$options = array_merge( $this->date_filter_options, $args['date_filter_options'] );

			$this->date_filter_options = array(
				'with_date_comparison'     => (bool) $options['with_date_comparison'],
				'with_header_date_control' => (bool) $options['with_header_date_control'],
			);
		}

		if ( isset( $args['requires_sync'] ) ) {
			$this->requires_sync = (bool) $args['requires_sync'];
		}

		if ( array_key_exists( 'is_available', $args ) ) {
			$this->is_available = $args['is_available'];
		}

		if ( array_key_exists( 'default_layout', $args ) ) {
			$this->default_layout = $args['default_layout'];
		}
	}
}
