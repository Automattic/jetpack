<?php
/**
 * Class to handle the Check in the Site Health admin page
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

/**
 * Site_Health.
 *
 * Displays threats in WordPress site health page.
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
		$checks['direct']['jetpack_protect_checks'] = array(
			'label' => __( 'Jetpack Protect checks', 'jetpack-protect' ),
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
		$total_threats = Status::get_total_threats();
		$threats       = Status::get_all_threats();
		$threats       = array_map(
			function ( $v ) {
				return $v->title;
			},
			$threats
		);

		/**
		 * Default, no threats found
		 */
		$result = array(
			'label'       => __( 'No known threats found', 'jetpack-protect' ),
			'status'      => 'good',
			'badge'       => array(
				'label' => __( 'Security', 'jetpack-protect' ),
				'color' => 'gray',
			),
			'description' => sprintf(
				'<p>%s</p>',
				__( 'Jetpack Protect did not find any known threats in your site. Threats can be exploited by hackers and cause harm to your website.', 'jetpack-protect' )
			),
			'actions'     => '',
			'test'        => 'jetpack_protect_checks',
		);

		/**
		 * If threats found.
		 */
		if ( $total_threats ) {
			$result['status'] = 'critical';
			/* translators: $d is the number of threats found. */
			$result['label']       = sprintf( _n( 'Your site is affected by %d security threat', 'Your site is affected by %d security threats', $total_threats, 'jetpack-protect' ), $total_threats );
			$result['description'] = __( 'Jetpack Protect detected the following security threats in your site:', 'jetpack-protect' );

			foreach ( $threats as $threat ) {
				$result['description'] .= '<p>';
				$result['description'] .= "<span class='dashicons dashicons-warning' style='color: crimson;'></span> &nbsp";
				$result['description'] .= wp_kses( $threat, array( 'a' => array( 'href' => array() ) ) ); // Only allow a href HTML tags.
				$result['description'] .= '</p>';
			}
			$result['description'] .= '<p>';
			$result['description'] .= sprintf(
				wp_kses(
					/* translators: Link to Jetpack Protect. */
					__( 'See <a href="%s">Protect overview page</a> for more information.', 'jetpack-protect' ),
					array(
						'a' => array( 'href' => array() ),
					)
				),
				esc_url( admin_url( 'admin.php?page=jetpack-protect' ) )
			);
			$result['description'] .= '</p>';
		}

		return $result;
	}
}
