<?php
/**
 * A single-report page: the dashboard page about one entity, a post, an author, a video.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Describes one single-report page registered with the dashboard.
 *
 * The record is declarative: the client renders the page from it. The only code a
 * page brings is its header, a registered widget type without a render module whose
 * widget module exports `useHeader()` and whose attributes are the header's controls.
 *
 * @since $$next-version$$
 */
class Single_Report_Page {

	/**
	 * Dashboard the page belongs to.
	 *
	 * @var string
	 */
	public $dashboard_name;

	/**
	 * Namespaced identifier, e.g. `videopress/video`.
	 *
	 * @var string
	 */
	public $id;

	/**
	 * URL segment, the public identity of the page: `/report/{path}/{id}`.
	 *
	 * @var string
	 */
	public $path;

	/**
	 * The entity kind, used as the breadcrumb and as the title fallback.
	 *
	 * @var string
	 */
	public $label;

	/**
	 * Slug of the dashboard section the page belongs to.
	 *
	 * @var string|null
	 */
	public $dashboard_section = null;

	/**
	 * Stats feature key a plan may lock; a locked feature sends the reader to the locked reports page.
	 *
	 * @var string|null
	 */
	public $feature = null;

	/**
	 * Report param that carries the entity id to the widgets.
	 *
	 * @var string
	 */
	public $scope_param = 'post_id';

	/**
	 * Regex the entity id must match, without delimiters.
	 *
	 * @var string
	 */
	public $id_pattern = '^\d+$';

	/**
	 * Widget type whose widget module exports `useHeader()`.
	 *
	 * @var string|null
	 */
	public $header_widget_type = null;

	/**
	 * Reports page of the same entities, for the "Back to …" link of the not-found notice.
	 *
	 * @var string|null
	 */
	public $reports_page = null;

	/**
	 * Preferences scope the client persists the arrangement under.
	 *
	 * @var string
	 */
	public $preferences_scope;

	/**
	 * Availability rule: a callable, a bool, or null for the default.
	 *
	 * @var callable|bool|null
	 */
	private $is_available = null;

	/**
	 * Default layout of a page with one section: widget instances, or a callable returning them.
	 *
	 * @var array|callable
	 */
	private $default_layout = array();

	/**
	 * Inner sections of a page with inner navigation: `slug`, `label` and `default_layout` each.
	 *
	 * @var array[]
	 */
	private $sections = array();

	/**
	 * Constructor.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $id             Page identifier.
	 * @param array  $args           Page arguments.
	 */
	public function __construct( $dashboard_name, $id, $args = array() ) {
		$this->dashboard_name = $dashboard_name;
		$this->id             = $id;
		$this->path           = self::derive_path( $id );
		$this->label          = $id;
		$this->set_props( $args );

		if ( empty( $this->preferences_scope ) ) {
			$this->preferences_scope = 'jetpack-premium-analytics/' . $this->path . '-detail';
		}
	}

	/**
	 * Default path: the name part of the id.
	 *
	 * @param string $id Page identifier.
	 * @return string
	 */
	private static function derive_path( $id ) {
		$separator = strpos( (string) $id, '/' );

		return false === $separator ? (string) $id : substr( $id, $separator + 1 );
	}

	/**
	 * Whether the page is available to the current reader.
	 *
	 * @return bool
	 */
	public function is_available() {
		if ( null === $this->is_available ) {
			return Capabilities::current_user_can_view_stats();
		}

		if ( is_callable( $this->is_available ) ) {
			return (bool) call_user_func( $this->is_available, $this );
		}

		return (bool) $this->is_available;
	}

	/**
	 * The page's default layout, or one inner section's, run through the default-layout filter.
	 *
	 * @param string|null $section_slug Inner section, or null for a page with one section.
	 * @return array
	 */
	public function get_default_layout( $section_slug = null ) {
		$layout = $this->default_layout;

		if ( null !== $section_slug ) {
			$layout = array();
			foreach ( $this->sections as $section ) {
				if ( $section['slug'] === $section_slug ) {
					$layout = $section['default_layout'];
					break;
				}
			}
		}

		$layout = is_callable( $layout ) ? call_user_func( $layout, $this, $section_slug ) : $layout;
		$layout = is_array( $layout ) ? array_values( $layout ) : array();

		/**
		 * Filters the default layout of a single-report page, or of one of its inner sections.
		 *
		 * @since $$next-version$$
		 *
		 * @param array              $layout       Widget instances.
		 * @param string             $page_id      Page identifier.
		 * @param string|null        $section_slug Inner section, or null for a page with one section.
		 * @param Single_Report_Page $page         The page.
		 */
		$layout = apply_filters( SINGLE_REPORT_PAGE_DEFAULT_LAYOUT_FILTER, $layout, $this->id, $section_slug, $this );

		return is_array( $layout ) ? array_values( $layout ) : array();
	}

	/**
	 * The inner sections with their filtered layouts, empty for a page with one section.
	 *
	 * @return array[]
	 */
	public function get_sections() {
		$sections = array();

		foreach ( $this->sections as $section ) {
			$sections[] = array(
				'slug'           => $section['slug'],
				'label'          => $section['label'],
				'default_layout' => $this->get_default_layout( $section['slug'] ),
			);
		}

		return $sections;
	}

	/**
	 * The record the client reads.
	 *
	 * @return array
	 */
	public function to_array() {
		return array(
			'id'                 => $this->id,
			'path'               => $this->path,
			'label'              => $this->label,
			'dashboard_section'  => $this->dashboard_section,
			'feature'            => $this->feature,
			'scope_param'        => $this->scope_param,
			'id_pattern'         => $this->id_pattern,
			'header_widget_type' => $this->header_widget_type,
			'reports_page'       => $this->reports_page,
			'preferences_scope'  => $this->preferences_scope,
			'default_layout'     => empty( $this->sections ) ? $this->get_default_layout() : array(),
			'sections'           => $this->get_sections(),
		);
	}

	/**
	 * Copies the recognized arguments onto the record.
	 *
	 * @param array $args Page arguments.
	 */
	private function set_props( $args ) {
		if ( ! is_array( $args ) ) {
			return;
		}

		if ( isset( $args['path'] ) && self::is_valid_slug( $args['path'] ) ) {
			$this->path = $args['path'];
		}

		foreach ( array( 'label', 'dashboard_section', 'feature', 'scope_param', 'id_pattern', 'header_widget_type', 'reports_page', 'preferences_scope' ) as $key ) {
			if ( isset( $args[ $key ] ) && is_string( $args[ $key ] ) && '' !== $args[ $key ] ) {
				$this->$key = $args[ $key ];
			}
		}

		if ( array_key_exists( 'is_available', $args ) ) {
			$this->is_available = $args['is_available'];
		}

		if ( array_key_exists( 'default_layout', $args ) ) {
			$this->default_layout = $args['default_layout'];
		}

		if ( isset( $args['sections'] ) && is_array( $args['sections'] ) ) {
			$this->sections = self::normalize_sections( $args['sections'] );
		}
	}

	/**
	 * Keeps the inner sections that carry a valid slug, deduplicated by slug.
	 *
	 * @param array $sections Section declarations.
	 * @return array[]
	 */
	private static function normalize_sections( $sections ) {
		$normalized = array();

		foreach ( $sections as $section ) {
			if ( ! is_array( $section ) || ! isset( $section['slug'] ) || ! self::is_valid_slug( $section['slug'] ) || isset( $normalized[ $section['slug'] ] ) ) {
				continue;
			}

			$normalized[ $section['slug'] ] = array(
				'slug'           => $section['slug'],
				'label'          => isset( $section['label'] ) && is_string( $section['label'] ) && '' !== $section['label'] ? $section['label'] : $section['slug'],
				'default_layout' => $section['default_layout'] ?? array(),
			);
		}

		return array_values( $normalized );
	}

	/**
	 * Whether a value is a lowercase slug of letters, numbers and hyphens.
	 *
	 * @param mixed $value Candidate.
	 * @return bool
	 */
	private static function is_valid_slug( $value ) {
		return is_string( $value ) && 1 === preg_match( '/^[a-z0-9-]+$/', $value );
	}
}
