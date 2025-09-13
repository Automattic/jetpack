<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * @package automattic/jetpack-crm
 */

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit( 0 );
}

/**
 * Render Tasks calendar page.
 */
function zeroBSCRM_render_tasks_calendar_page() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

	global $zbs;

	$current_task_user_id = false;
	if ( ! empty( $_GET['zbsowner'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$current_task_user_id = (int) $_GET['zbsowner']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	} elseif ( zeroBSCRM_getSetting( 'taskownership' ) === 1 ) {
		$current_task_user_id = get_current_user_id();
	}
	?>

	<div>
		<div class="ui segment main-task-view">
			<?php
			// retrieve via DAL, just getting them ALL (pretty gross, but for now, at least more performant.)
			$args = array(
				'sortByField' => 'ID',
				'sortOrder'   => 'DESC',
				'page'        => 0,
				'perPage'     => 50000,
			);

			// belonging to specific user
			if ( $current_task_user_id ) {
				$args['ownedBy'] = $current_task_user_id;
			}

			$calendar_events = array();

			$tasks = $zbs->DAL->events->getEvents( $args ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

			// for now we cycle through and form into same object as MS wrote this for,
			// v3.0 + to rewrite display engine to use proper DAL objs on fly.
			if ( is_array( $tasks ) && count( $tasks ) > 0 ) {

				$avatar_args = array(
					'size' => 24,
				);
				foreach ( $tasks as $task ) {

					if (
						isset( $task['start'] ) && $task['start'] > 0
						&& isset( $task['end'] ) && $task['end'] > 0
					) {

						$new_task = array( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							'title'     => zeroBSCRM_textExpose( $task['title'] ),
							'start'     => jpcrm_uts_to_datetime_str( $task['start'], 'Y-m-d H:i:s' ),
							'end'       => jpcrm_uts_to_datetime_str( $task['end'], 'Y-m-d H:i:s' ),
							'url'       => jpcrm_esc_link( 'edit', $task['id'], ZBS_TYPE_TASK ),
							'owner'     => $task['owner'],
							'avatar'    => '', // default
							'showonCal' => 'hide', // default
							'complete'  => '-1',
						);

						// avatar?
						if ( isset( $task['owner'] ) && $task['owner'] > 0 ) {
							$new_task['avatar'] = get_avatar_url( $task['owner'], $avatar_args );
						}

						// show on cal
						if ( isset( $task['show_on_cal'] ) && $task['show_on_cal'] === 1 ) {
							$new_task['showonCal'] = 'show';
						}

						// complete?
						if ( isset( $task['complete'] ) && $task['complete'] === 1 ) {
							$new_task['complete'] = 1;
						}

						// add it
						$calendar_events[] = $new_task;
					}
				}
			}

			$potential_locales = array(
				strtolower( zeroBSCRM_getLocale() ), // e.g. en-gb
				zeroBSCRM_getLocale( false ), // e.g. en
			);

			$fullcalendar_locale = false;
			foreach ( $potential_locales as $locale ) {
				$potential_file = 'build/lib/fullcalendar/locales/' . $locale . '.global.min.js';
				if ( file_exists( ZEROBSCRM_PATH . $potential_file ) ) {
					$fullcalendar_locale = $locale;
					wp_enqueue_script( 'jpcrm-fullcalendar-locale', ZEROBSCRM_URL . $potential_file, array( 'jpcrm-fullcalendar' ), $zbs::VERSION, true );
					break;
				}
			}

			$jpcrm_fullcalendar_data = 'jpcrm_fullcalendar_data = ' . wp_json_encode(
				array(
					'locale'   => $fullcalendar_locale,
					'events'   => $calendar_events,
					'firstDay' => (int) get_option( 'start_of_week', 0 ),
				)
			);
			?>

			<div id='calendar'></div>
			<br class="clear">
		</div>
	</div>
	<?php
	wp_add_inline_script( 'jpcrm-tasks', $jpcrm_fullcalendar_data, 'before' );
}
