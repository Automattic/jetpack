<?php

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Site_Health.
 *
 * Displays performance issues in WordPress site health page.
 */
class Site_Health {

	/**
	 * Initialize hooks
	 *
	 * @access public
	 * @return void
	 */
	public static function init() {
		if ( ! has_filter( 'site_status_tests', array( __CLASS__, 'add_check' ) ) ) {
			add_filter( 'site_status_tests', array( __CLASS__, 'add_check' ), 99 );
		}
	}

	/**
	 * Add site-health page tests.
	 *
	 * @param array $checks Core checks.
	 *
	 * @access public
	 * @return array
	 */
	public static function add_check( $checks ) {
		$checks['direct']['jetpack_boost_checks'] = array(
			'label' => __( 'Jetpack Boost checks', 'jetpack-boost' ),
			'test'  => array( __CLASS__, 'do_checks' ),
		);

		return $checks;
	}

	/**
	 * Do site-health page checks
	 *
	 * @access public
	 * @return array
	 */
	public static function do_checks() {
		$health       = new Boost_Health();
		$total_issues = $health->get_total_issues();
		$issues       = $health->get_all_issues();

		/**
		 * Default, no issues found
		 */
		$result = array(
			'label'       => __( 'No issues found', 'jetpack-boost' ),
			'status'      => 'good',
			'badge'       => array(
				'label' => __( 'Performance', 'jetpack-boost' ),
				'color' => 'gray',
			),
			'description' => sprintf(
				'<p>%s</p>',
				__( 'Jetpack Boost did not find any known performance issues with your site.', 'jetpack-boost' )
			),
			'actions'     => '',
			'test'        => 'jetpack_boost_checks',
		);

		/**
		 * If issues found.
		 */
		if ( $total_issues ) {
			$result['status'] = 'critical';
			/* translators: $d is the number of performance issues found. */
			$result['label']       = sprintf( _n( 'Your site is affected by %d performance issue', 'Your site is affected by %d performance issues', $total_issues, 'jetpack-boost' ), $total_issues );
			$result['description'] = __( 'Jetpack Boost detected the following performance issues with your site:', 'jetpack-boost' );

			foreach ( $issues as $issue ) {
				$result['description'] .= '<p>';
				$result['description'] .= "<span class='dashicons dashicons-warning' style='color: crimson;'></span> &nbsp";
				$result['description'] .= wp_kses( $issue, array( 'a' => array( 'href' => array() ) ) ); // Only allow a href HTML tags.
				$result['description'] .= '</p>';
			}
			$result['description'] .= '<p>';
			$result['description'] .= sprintf(
				wp_kses(
					/* translators: Link to Jetpack Boost. */
					__( 'Visit <a href="%s">Boost settings page</a> for more information.', 'jetpack-boost' ),
					array(
						'a' => array( 'href' => array() ),
					)
				),
				esc_url( admin_url( 'admin.php?page=jetpack-boost' ) )
			);
			$result['description'] .= '</p>';
		}

		return $result;
	}
}
