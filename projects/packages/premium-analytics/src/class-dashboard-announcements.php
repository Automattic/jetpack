<?php
/**
 * The announcements the dashboard publishes on the What's new surface it hosts.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use function Automattic\Jetpack\Announcements\register_announcement;

/**
 * Registers the dashboard's announcements with the Jetpack Announcements package.
 */
class Dashboard_Announcements {

	/**
	 * Context of the dashboard: the label its announcements carry and its surface asks for.
	 */
	const CONTEXT = 'premium-analytics';

	/**
	 * Hook the registrant on the action the announcement registry fires as it hydrates.
	 *
	 * @return void
	 */
	public static function configure() {
		add_action( 'jetpack_register_announcements', array( __CLASS__, 'register' ) );
	}

	/**
	 * Register the dashboard's announcements.
	 *
	 * @return void
	 */
	public static function register() {
		// Another plugin may load an older copy of the package first.
		if ( ! function_exists( 'Automattic\\Jetpack\\Announcements\\register_announcement' ) ) {
			return;
		}

		register_announcement(
			'premium-analytics/arrange-tabs',
			array(
				'date'     => '2026-11-12',
				'title'    => __( 'Arrange your tabs', 'jetpack-premium-analytics-pkg' ),
				'excerpt'  => __( 'Reorder the dashboard tabs and choose the one that opens first.', 'jetpack-premium-analytics-pkg' ),
				'content'  => '<p>' . esc_html__( 'Open the page options menu and choose Arrange tabs to reorder the tabs and to choose the one that opens first.', 'jetpack-premium-analytics-pkg' ) . '</p>',
				'contexts' => array( self::CONTEXT ),
			)
		);
	}
}
