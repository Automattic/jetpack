<?php
/**
 * Scheduled Updates Admin.
 *
 * @package automattic/scheduled-updates
 */

namespace Automattic\Jetpack;

/**
 * Class Scheduled_Updates_Admin.
 *
 * Contains all the wp-admin-related functionality for scheduled updates.
 */
class Scheduled_Updates_Admin {

	/**
	 * Add context for scheduled updates in the Plugins list table.
	 *
	 * @param array $plugins An array of plugins.
	 * @return array
	 */
	public static function add_scheduled_updates_context( $plugins ) {
		if ( ! function_exists( 'wp_get_scheduled_events' ) ) {
			require_once __DIR__ . '/pluggable.php';
		}

		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );

		if ( ! empty( $events ) ) {
			if ( ! empty( $_REQUEST['plugin_status'] ) && 'scheduled-updates' === $_REQUEST['plugin_status'] ) { // phpcs:ignore WordPress.Security.NonceVerification
				$GLOBALS['status'] = 'scheduled-updates'; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			}

			/*
			 * Get the unique list of plugins that are part of scheduled updates.
			 *
			 * Example:
			 *  $scheduled = array(
			 *      'rest-api-console/rest-api-console.php'     => 0,
			 *      'wordpress-importer/wordpress-importer.php' => 1,
			 *      'wp-last-login/wp-last-login.php'           => 2,
			 *  );
			 */
			$scheduled = array_flip(
				array_unique(
					array_merge(
						...array_values(
							wp_list_pluck( $events, 'args' )
						)
					)
				)
			);

			// Removing from the auto-update-disabled list since they are scheduled.
			$plugins['auto-update-disabled'] = array_diff_key( (array) $plugins['auto-update-disabled'], $scheduled );
			$plugins['scheduled-updates']    = array_intersect_key( (array) $plugins['all'], $scheduled );
		}

		return $plugins;
	}

	/**
	 * Add a view for scheduled updates in the Plugins list table.
	 *
	 * @param array $views An array of available views.
	 * @return array
	 */
	public static function add_scheduled_updates_view( $views ) {
		global $totals;

		if ( ! empty( $totals['scheduled-updates'] ) ) {
			$views['scheduled-updates'] = sprintf(
				'<a href="%1$s" class="%2$s">%3$s <span class="count">(%4$s)</span></a>',
				esc_url( add_query_arg( array( 'plugin_status' => 'scheduled-updates' ), 'plugins.php' ) ),
				isset( $_REQUEST['plugin_status'] ) && 'scheduled-updates' === $_REQUEST['plugin_status'] ? 'current' : '', // phpcs:ignore WordPress.Security.NonceVerification
				__( 'Scheduled Updates', 'jetpack-scheduled-updates' ),
				number_format_i18n( $totals['scheduled-updates'] )
			);
		}

		return $views;
	}

	/**
	 * Filters the HTML of the auto-updates setting for each plugin in the Plugins list table.
	 *
	 * @param string $html        The HTML of the plugin's auto-update column content,
	 *                            including toggle auto-update action links and
	 *                            time to next update.
	 * @param string $plugin_file Path to the plugin file relative to the plugin directory.
	 */
	public static function show_scheduled_updates( $html, $plugin_file ) {
		if ( ! function_exists( 'wp_get_scheduled_events' ) ) {
			require_once __DIR__ . '/pluggable.php';
		}

		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );

		$schedules = array();
		foreach ( $events as $event ) {
			if ( in_array( $plugin_file, $event->args, true ) ) {
				$schedules[] = $event;
			}
		}

		// Plugin is not part of an update schedule.
		if ( empty( $schedules ) ) {
			return $html;
		}

		$text = array_map( array( __CLASS__, 'get_scheduled_update_text' ), $schedules );

		$html  = '<p style="margin: 0 0 8px">' . implode( '<br>', $text ) . '</p>';
		$html .= sprintf(
			'<a href="%1$s">%2$s</a>',
			esc_url( 'https://wordpress.com/plugins/scheduled-updates/' . ( new Status() )->get_site_suffix() ),
			esc_html__( 'Edit', 'jetpack-scheduled-updates' )
		);

		return $html;
	}

	/**
	 * Get the text for a scheduled update.
	 *
	 * @param object $schedule The scheduled update.
	 * @return string
	 */
	public static function get_scheduled_update_text( $schedule ) {
		if ( DAY_IN_SECONDS === $schedule->interval ) {
			$html = sprintf(
			/* translators: %s is the time of day. Daily at 10 am. */
				esc_html__( 'Daily at %s.', 'jetpack-scheduled-updates' ),
				wp_date( get_option( 'time_format' ), $schedule->timestamp )
			);
		} else {
			// Not getting smart about passing in weekdays makes it easier to translate.
			$weekdays = array(
				/* translators: %s is the time of day. Mondays at 10 am. */
				1 => __( 'Mondays at %s.', 'jetpack-scheduled-updates' ),
				/* translators: %s is the time of day. Tuesdays at 10 am. */
				2 => __( 'Tuesdays at %s.', 'jetpack-scheduled-updates' ),
				/* translators: %s is the time of day. Wednesdays at 10 am. */
				3 => __( 'Wednesdays at %s.', 'jetpack-scheduled-updates' ),
				/* translators: %s is the time of day. Thursdays at 10 am. */
				4 => __( 'Thursdays at %s.', 'jetpack-scheduled-updates' ),
				/* translators: %s is the time of day. Fridays at 10 am. */
				5 => __( 'Fridays at %s.', 'jetpack-scheduled-updates' ),
				/* translators: %s is the time of day. Saturdays at 10 am. */
				6 => __( 'Saturdays at %s.', 'jetpack-scheduled-updates' ),
				/* translators: %s is the time of day. Sundays at 10 am. */
				7 => __( 'Sundays at %s.', 'jetpack-scheduled-updates' ),
			);

			$html = sprintf(
				$weekdays[ (int) wp_date( 'N', $schedule->timestamp ) ],
				wp_date( get_option( 'time_format' ), $schedule->timestamp )
			);
		}

		return $html;
	}
}
