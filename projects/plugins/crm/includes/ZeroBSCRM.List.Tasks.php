<?php /*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.1.19
 *
 * Copyright 2020 Automattic
 *
 * Date: 18/10/16
 */

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

function zeroBSCRM_render_tasks_calendar_page() {

	global $zbs;

	$option = 'per_page';
	$args   = array(
		'label'   => __( 'Tasks', 'zero-bs-crm' ),
		'default' => 10,
		'option'  => 'events_per_page',
	);

	add_screen_option( $option, $args );

	$normalLoad = true;

	$fullCalendarView = 'month';

	$current_task_user_id = false;
	if ( isset( $_GET['zbsowner'] ) && ! empty( $_GET['zbsowner'] ) ) {
		$current_task_user_id = (int) sanitize_text_field( $_GET['zbsowner'] );
	}
	$jpcrm_tasks_users = zeroBS_getPossibleCustomerOwners();
	$show_tasks_users  = false;

	if ( count( $jpcrm_tasks_users ) > 0 && zeroBSCRM_isZBSAdminOrAdmin() ) {
		$show_tasks_users = true;
	} else {
		$taskOwnershipOn = zeroBSCRM_getSetting( 'taskownership' );
		if ( $taskOwnershipOn == '1' ) {
			$current_task_user_id = get_current_user_id();
		}
	}

	if ( isset( $_GET['zbs_crm_team'] ) ) {
		$current_task_user_id = get_current_user_id();
		$fullCalendarView     = 'listMonth';
	}

	if ( $normalLoad ) { ?>

<div>

	<div class="ui segment main-task-view">

			<?php
			if ( $show_tasks_users ) {
				?>
				<div style="clear:both;height: 0px;"></div><?php } ?>

		<?php

					// retrieve via DAL, just getting them ALL (pretty gross, but for now, at least more performant.)
					$args = array(

						'sortByField' => 'ID',
						'sortOrder'   => 'DESC',
						'page'        => 0,
						'perPage'     => 50000,

					);

					// belonging to specific user
					if ( ! empty( $current_task_user_id ) && $current_task_user_id > 0 ) {
						$args['ownedBy'] = $current_task_user_id;
						//$args['ignoreowner'] = false;
					}

					$tasks = $zbs->DAL->events->getEvents( $args );

					// for now we cycle through and form into same object as MS wrote this for,
					// v3.0 + to rewrite display engine to use proper DAL objs on fly.
					if ( is_array( $tasks ) && count( $tasks ) > 0 ) {

						$avatar_args = array(
							'size' => 24,
						);

						$end_tasks = array();
						foreach ( $tasks as $task ) {

							if ( isset( $task['start'] ) && $task['start'] > 0
								&&
								isset( $task['end'] ) && $task['end'] > 0 ) {

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
								if ( isset( $task['show_on_cal'] ) && $task['show_on_cal'] == 1 ) {
									$new_task['showonCal'] = 'show';
								}

								// complete?
								if ( isset( $task['complete'] ) && $task['complete'] == 1 ) {
									$new_task['complete'] = 1;
								}

								// add it
								$end_tasks[] = $new_task;

							}
						}

						// pass it on and clean up
						$tasks = $end_tasks;
												unset( $end_tasks, $new_task );

					} else {
						$tasks = array();
					}

					// build json
					$task_json = json_encode( $tasks );

					?>


				<script>
				<?php
				/*
				debug
				var task_debug = <?php echo $task_json; ?>;
				console.log('tasks:',task_debug); */
				?>

					jQuery(function() {
						
						jQuery('#calendar').fullCalendar({
							header: {
								left: 'prev,next today',
								center: 'title',
								right: 'year, month,agendaWeek, agendaDay,listMonth'
							},
							defaultDate: '<?php echo esc_html( date( 'Y-m-d' ) ); ?>',
							defaultView: '<?php echo esc_html( $fullCalendarView ); ?>',
							navLinks: true, // can click day/week names to navigate views
						//     editable: true,
							eventLimit: true, // allow "more" link when too many tasks
							weekends: true,
							disableDragging: true,
							events: <?php echo $task_json; ?>,
							firstDay: <?php echo (int) get_option( 'start_of_week', 0 ); ?>
						});
						
					});

				</script>



				<div id='calendar'></div>
				<br class="clear">
				</div>
				</div>


				<script type="text/javascript">
					jQuery(function(){

						jQuery('#clearSearch').on( 'click', function(){

							jQuery('#customersearch-search-input').val('');
							jQuery('#search-submit').trigger( 'click' );

						});

					});
				</script>
				
			<?php

	}
}
