<?php
/**
 * Quick switcher tracking file.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\Dashboard_Switcher_Tracking instead.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\Dashboard_Switcher_Tracking as Masterbar_Dashboard_Switcher_Tracking;
use Automattic\Jetpack\Tracking;

/**
 * Class Dashboard_Switcher_Tracking
 */
class Dashboard_Switcher_Tracking {

	/**
	 * Jetpack Tracking library will prefix the event name with "jetpack_*" automatically.
	 */
	const JETPACK_EVENT_NAME = 'dashboard_quick_switch_link_clicked';

	const WPCOM_EVENT_NAME = 'wpcom_dashboard_quick_switch_link_clicked';

	/**
	 * Instance of \Automattic\Jetpack\Masterbar\Dashboard_Switcher_Tracking
	 * Used for deprecation purposes.
	 *
	 * @var \Automattic\Jetpack\Masterbar\Dashboard_Switcher_Tracking
	 */
	private $dashboard_switcher_wrapper;

	/**
	 * Dashboard_Switcher_Tracking constructor.
	 *
	 * @deprecated 13.7
	 *
	 * @param Tracking $tracking       Jetpack tracking object.
	 * @param callable $wpcom_tracking A wrapper over wpcom event record.
	 * @param string   $plan           The current site plan.
	 */
	public function __construct( Tracking $tracking, callable $wpcom_tracking, $plan ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Dashboard_Switcher_Tracking::__construct' );
		$this->dashboard_switcher_wrapper = new Masterbar_Dashboard_Switcher_Tracking( $tracking, $wpcom_tracking, $plan );
	}

	/**
	 * Create an event for the Quick switcher when the user changes it's preferred view.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $screen The screen page.
	 * @param string $view   The new preferred view.
	 */
	public function record_switch_event( $screen, $view ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Dashboard_Switcher_Tracking::record_switch_event' );
		$this->dashboard_switcher_wrapper->record_switch_event( $screen, $view );
	}

	/**
	 * Get the current site plan or 'N/A' when we cannot determine site's plan.
	 *
	 * @deprecated 13.7
	 *
	 * @todo: This method can be reused as a wrapper over WPCOM and Atomic as way to get site's current plan (display name).
	 *
	 * @return string
	 */
	public static function get_plan() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Dashboard_Switcher_Tracking::get_plan' );
		return Masterbar_Dashboard_Switcher_Tracking::get_plan();
	}

	/**
	 * Trigger the WPCOM tracks_record_event.
	 *
	 * @deprecated 13.7
	 *
	 * @param array $event_props Event props.
	 */
	public static function wpcom_tracks_record_event( $event_props ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Dashboard_Switcher_Tracking::wpcom_tracks_record_event' );
		return Masterbar_Dashboard_Switcher_Tracking::wpcom_tracks_record_event( $event_props );
	}

	/**
	 * Get the tracking product name for the Tracking library.
	 *
	 * The tracking product name is used by the Tracking as a prefix for the event name.
	 *
	 * @deprecated 13.7
	 *
	 * @return string
	 */
	public static function get_jetpack_tracking_product() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Dashboard_Switcher_Tracking::get_jetpack_tracking_product' );
		return Masterbar_Dashboard_Switcher_Tracking::get_jetpack_tracking_product();
	}

	/**
	 * Mark the Jetpack ToS as read for Atomic Sites.
	 *
	 * @deprecated 13.7
	 *
	 * @param mixed  $option_value The value of the Jetpack option.
	 * @param string $option_name The name of the Jetpack option.
	 *
	 * @return bool
	 */
	public static function mark_jetpack_tos_as_read( $option_value, $option_name ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Dashboard_Switcher_Tracking::mark_jetpack_tos_as_read' );
		return Masterbar_Dashboard_Switcher_Tracking::mark_jetpack_tos_as_read( $option_value, $option_name );
	}
}
