<?php
/**
 * A reports page: the dashboard page that lists the records of one report, at `/reports/{path}`.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/class-single-report-page.php';

/**
 * Describes one reports page registered with the dashboard.
 *
 * The record of a single-report page without the entity scope: sections, each with its
 * controls and a layout of widgets.
 *
 * @since $$next-version$$
 */
class Reports_Page extends Single_Report_Page {

	/**
	 * Record keys that scope a single-report page to one entity.
	 *
	 * @var string[]
	 */
	const ENTITY_SCOPE_KEYS = array( 'scope_param', 'id_pattern', 'reports_page' );

	/**
	 * Constructor.
	 *
	 * @param string $dashboard_name Dashboard identifier.
	 * @param string $id             Page identifier.
	 * @param array  $args           Page arguments.
	 */
	public function __construct( $dashboard_name, $id, $args = array() ) {
		parent::__construct( $dashboard_name, $id, $args );

		if ( ! is_array( $args ) || empty( $args['preferences_scope'] ) ) {
			$this->preferences_scope = 'jetpack-premium-analytics/' . $this->path . '-report';
		}
	}

	/**
	 * The record the client reads.
	 *
	 * @return array
	 */
	public function to_array() {
		return array_diff_key( parent::to_array(), array_flip( self::ENTITY_SCOPE_KEYS ) );
	}
}
