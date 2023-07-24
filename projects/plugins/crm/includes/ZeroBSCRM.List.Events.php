<?php /* !
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

function zeroBSCRM_render_eventscalendar_page(){

    global $zbs;

    $option = 'per_page';
    $args   = array(
        'label'   => __('Tasks',"zero-bs-crm"),
        'default' => 10,
        'option'  => 'events_per_page'
    );

    add_screen_option( $option, $args );
                  
    $normalLoad = true;

    $fullCalendarView = 'month';

    $currentEventUserID = false; if (isset($_GET['zbsowner']) && !empty($_GET['zbsowner'])) $currentEventUserID = (int)sanitize_text_field($_GET['zbsowner']);
    $zbsEventsUsers = zeroBS_getPossibleCustomerOwners();
    $showEventsUsers = false;

    if (count($zbsEventsUsers) > 0 && zeroBSCRM_isZBSAdminOrAdmin()) {
        $showEventsUsers = true;
    } else {
        $taskOwnershipOn = zeroBSCRM_getSetting('taskownership');
        if ($taskOwnershipOn == "1") {
            $currentEventUserID = get_current_user_id();
        }
    }

    if(isset($_GET['zbs_crm_team'])){
        $currentEventUserID = get_current_user_id();
        $fullCalendarView = 'listMonth';
    }
    
    if ($normalLoad){ ?>

<div>

    <div class="ui segment main-task-view">

            <?php if ($showEventsUsers){ ?><div style="clear:both;height: 0px;"></div><?php } ?>

		<?php

                    // retrieve via DAL, just getting them ALL (pretty gross, but for now, at least more performant.)
                    $args = array(

                        'sortByField'   => 'ID',
                        'sortOrder'     => 'DESC',
                        'page'          => 0,
                        'perPage'       => 50000,
                        
                    );

                    // belonging to specific user
                    if (!empty($currentEventUserID) && $currentEventUserID > 0) {
                        $args['ownedBy'] = $currentEventUserID;
                        //$args['ignoreowner'] = false;
                    }
                        
                    $events = $zbs->DAL->events->getEvents($args);

                    // for now we cycle through and form into same object as MS wrote this for,
                    // v3.0 + to rewrite display engine to use proper DAL objs on fly. 
                    if (is_array($events) && count($events) > 0){

                        $avatar_args = array(
                            'size' => 24
                        );

                        $endEvents = array();
                        foreach ($events as $event){

                            if (isset($event['start']) && $event['start'] > 0 
                                && 
                                isset($event['end']) && $event['end'] > 0){

								$newEvent = array( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
									'title'     => zeroBSCRM_textExpose( $event['title'] ),
									'start'     => jpcrm_uts_to_datetime_str( $event['start'], 'Y-m-d H:i:s' ),
									'end'       => jpcrm_uts_to_datetime_str( $event['end'], 'Y-m-d H:i:s' ),
									'url'       => jpcrm_esc_link( 'edit', $event['id'], ZBS_TYPE_EVENT ),
									'owner'     => $event['owner'],
									'avatar'    => '', // default
									'showonCal' => 'hide', // default
									'complete'  => '-1',
								);

                                // avatar?
                                if (isset($event['owner']) && $event['owner'] > 0) $newEvent['avatar'] = get_avatar_url($event['owner'], $avatar_args);

                                // show on cal
                                if (isset($event['show_on_cal']) && $event['show_on_cal'] == 1) $newEvent['showonCal'] = 'show';

                                // complete?
                                if (isset($event['complete']) && $event['complete'] == 1) $newEvent['complete'] = 1;

                                // add it
                                $endEvents[] = $newEvent;

                            }

                        }

                        // pass it on and clean up
                        $events = $endEvents; unset($endEvents,$newEvent);

                    } else $events = array();

                    // build json
                    $event_json = json_encode($events);

                ?>


                <script>
                <?php /* debug
                var eventDebug = <?php echo $event_json; ?>;
                console.log('events:',eventDebug); */ ?>

                    jQuery(function() {
                        
                        jQuery('#calendar').fullCalendar({
                            header: {
                                left: 'prev,next today',
                                center: 'title',
                                right: 'year, month,agendaWeek, agendaDay,listMonth'
                            },
                            defaultDate: '<?php echo esc_html( date('Y-m-d') ); ?>',
                            defaultView: '<?php echo esc_html( $fullCalendarView ); ?>',
                            navLinks: true, // can click day/week names to navigate views
                       //     editable: true,
                            eventLimit: true, // allow "more" link when too many events
                            weekends: true,
                            disableDragging: true,
                            events: <?php echo $event_json; ?>,
                            firstDay: <?php echo (int)get_option('start_of_week',0) ?>
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
