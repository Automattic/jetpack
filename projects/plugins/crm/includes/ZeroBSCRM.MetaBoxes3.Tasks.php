<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 20/02/2019
 */

/*
======================================================
	Breaking Checks ( stops direct access )
	====================================================== */
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}
/*
======================================================
	/ Breaking Checks
	====================================================== */

/*
======================================================
	Init Func
	====================================================== */

function zeroBSCRM_TasksMetaboxSetup() {

	$zeroBS__Metabox_Task = new zeroBS__Metabox_Task( __FILE__ );

	// actions box
	$zeroBS__Metabox_TaskActions = new zeroBS__Metabox_TaskActions( __FILE__ );

	// tags
	$zeroBS__Metabox_TaskTags = new zeroBS__Metabox_TaskTags( __FILE__ );
}

	add_action( 'admin_init', 'zeroBSCRM_TasksMetaboxSetup' );

/*
======================================================
	/ Init Func
	====================================================== */

/*
======================================================
	Task Metabox
	====================================================== */

class zeroBS__Metabox_Task extends zeroBS__Metabox {

	// this is for catching 'new' task
	private $newRecordNeedsRedir = false;

	public function __construct( $plugin_file ) {

		// set these
		// DAL3 switched for objType $this->postType = 'zerobs_customer';
		$this->objType         = 'event';
		$this->metaboxID       = 'jpcrm-task-edit';
		$this->metaboxTitle    = __( 'Task Information', 'zero-bs-crm' );
		$this->metaboxScreen   = 'zbs-add-edit-event-edit';
		$this->metaboxArea     = 'normal';
		$this->metaboxLocation = 'high';
		$this->saveOrder       = 1;
		$this->capabilities    = array(

			'can_hide'        => false, // can be hidden
			'areas'           => array( 'normal' ), // areas can be dragged to - normal side = only areas currently
			'can_accept_tabs' => true,  // can/can't accept tabs onto it
			'can_become_tab'  => false, // can be added as tab
			'can_minimise'    => true, // can be minimised
			'can_move'        => true, // can be moved

		);

		// call this
		$this->initMetabox();
	}

	public function html( $task, $metabox ) {

			// localise ID
			$task_id = -1;
		if ( is_array( $task ) && isset( $task['id'] ) ) {
			$task_id = (int) $task['id'];
		}

			// debug echo 'task:<pre>'; print_r(array($task,$metabox)); echo '</pre>';

			// PerfTest: zeroBSCRM_performanceTest_startTimer('custmetabox-dataget');

			#} Rather than reload all the time :)
			global $zbsTaskEditing;

			// PerfTest: zeroBSCRM_performanceTest_finishTimer('custmetabox-dataget');
			// PerfTest: zeroBSCRM_performanceTest_startTimer('custmetabox-draw'); ?>

				<script type="text/javascript">var zbscrmjs_secToken = '<?php echo esc_js( wp_create_nonce( 'zbscrmjs-ajax-nonce' ) ); ?>';</script>

				<?php
				#} Pass this if it's a new customer (for internal automator) - note added this above with DEFINE for simpler.

				if ( gettype( $task ) != 'array' ) {
					echo '<input type="hidden" name="zbscrm_newevent" value="1" />';
				}

				// MS HTML out..
				// from the function lower down in this file.
				echo zeroBSCRM_task_addEdit( $task_id );

				// PerfTest: zeroBSCRM_performanceTest_finishTimer('custmetabox-draw');
	}

	public function save_data( $task_id, $task ) {

		if ( ! defined( 'ZBS_OBJ_SAVED' ) ) {

			// debug if (get_current_user_id() == 12) echo 'FIRING<br>';

			define( 'ZBS_OBJ_SAVED', 1 );

			// DAL3.0+
			global $zbs;

			// check this
			if ( empty( $task_id ) || $task_id < 1 ) {
				$task_id = -1;
			}

			// DAL3 way:
			$autoGenAutonumbers = true; // generate if not set :)
			$task               = zeroBS_buildObjArr( $_POST, array(), 'zbse_', '', false, ZBS_TYPE_TASK, $autoGenAutonumbers );

			// catch calendar and portal options (show_on_portal not needed)
			$task['show_on_cal'] = -1;
			if ( isset( $_POST['zbse_show_on_cal'] ) ) {
				$task['show_on_cal'] = 1;
			}

			// Use the tag-class function to retrieve any tags so we can add inline.
			// Save tags against objid
			$task['tags'] = zeroBSCRM_tags_retrieveFromPostBag( true, ZBS_TYPE_TASK );

			// because we deal with non-model datetime stamps here, we have to process separate to buildObjArr:

			// jpcrm_datetime_post_keys_to_uts() sanitises POST data
			$task_start = jpcrm_datetime_post_keys_to_uts( 'jpcrm_start' );
			$task_end   = jpcrm_datetime_post_keys_to_uts( 'jpcrm_end' );

			// if unable to use task start input, set to current time
			if ( ! $task_start ) {
				// start +1 hour from now
				$task_start = time() + 3600;

				// round to 15 minutes
				$task_start -= $task_start % 900;
			}

			if ( ! $task_end || $task_end < $task_start ) {
				// set to task start time + 1 hour if end is not set or is before start
				$task_end = $task_start + 3600;
			}

			$task['start'] = $task_start;
			$task['end']   = $task_end;

			// obj links:
			$task['contacts'] = array();
			if ( isset( $_POST['zbse_customer'] ) ) {
				$task['contacts'][] = (int) sanitize_text_field( $_POST['zbse_customer'] );
			}
			$task['companies'] = array();
			if ( isset( $_POST['zbse_company'] ) ) {
				$task['companies'][] = (int) sanitize_text_field( $_POST['zbse_company'] );
			}

			// completeness:
			$task['complete'] = -1;
			if ( isset( $_POST['zbs-task-complete'] ) ) {
				$task['complete'] = (int) sanitize_text_field( $_POST['zbs-task-complete'] );
			}

			$zbs->DAL->events->setEventCompleteness( $task_id, $task['complete'] );

			// ownership also passed via post here.
			$owner = -1;
			if ( isset( $_POST['zbse_owner'] ) ) {

				// this could do with some CHECK to say "can this user assign to this (potentially other) user"
				$owner = (int) sanitize_text_field( $_POST['zbse_owner'] );

			}

			// get old-style notify -> reminders
			$task_reminders    = array();
			$jpcrm_task_notify = false;
			if ( isset( $_POST['zbs_remind_task_24'] ) ) {
				$jpcrm_task_notify = (int) sanitize_text_field( $_POST['zbs_remind_task_24'] );
			}
			if ( $jpcrm_task_notify > 0 ) {

					// this was only ever 0 or 24
				if ( $jpcrm_task_notify == 24 ) {
					$task_reminders[] = array(

						'remind_at' => -86400,
						'sent'      => -1,

					);
				}
			}
			$task['reminders'] = $task_reminders;

			//  echo 'Task owned by '.$owner.':<pre>'.print_r($task,1).'</pre>'; exit();

			// add/update
			$addUpdateReturn = $zbs->DAL->events->addUpdateEvent(
				array(

					'id'            => $task_id,
					'owner'         => $owner,
					'data'          => $task,
					'limitedFields' => -1,

				)
			);

			// Note: For NEW objs, we make sure a global is set here, that other update funcs can catch
			// ... so it's essential this one runs first!
			// this is managed in the metabox Class :)
			if ( $task_id == -1 && ! empty( $addUpdateReturn ) && $addUpdateReturn != -1 ) {

				$task_id = $addUpdateReturn;
				global $zbsJustInsertedMetaboxID;
				$zbsJustInsertedMetaboxID = $task_id;

				// set this so it redirs
				$this->newRecordNeedsRedir = true;
			}

			// success?
			if ( $addUpdateReturn != -1 && $addUpdateReturn > 0 ) {

				// Update Msg
				// this adds an update message which'll go out ahead of any content
				// This adds to metabox: $this->updateMessages['update'] = zeroBSCRM_UI2_messageHTML('info olive mini zbs-not-urgent',__('Contact Updated',"zero-bs-crm"),'','address book outline','contactUpdated');
				// This adds to edit page
				$this->updateMessage();

				// catch any non-critical messages
				$nonCriticalMessages = $zbs->DAL->getErrors( ZBS_TYPE_TASK );
				if ( is_array( $nonCriticalMessages ) && count( $nonCriticalMessages ) > 0 ) {
					$this->dalNoticeMessage( $nonCriticalMessages );
				}
			} else {

				// fail somehow
				$failMessages = $zbs->DAL->getErrors( ZBS_TYPE_TASK );

				// show msg (retrieved from DAL err stack)
				if ( is_array( $failMessages ) && count( $failMessages ) > 0 ) {
					$this->dalErrorMessage( $failMessages );
				} else {
					$this->dalErrorMessage( array( __( 'Insert/Update Failed with general error', 'zero-bs-crm' ) ) );
				}

				// pass the pre-fill:
				global $zbsObjDataPrefill;
				$zbsObjDataPrefill = $task;

			}
		}

		return $task;
	}

	// This catches 'new' contacts + redirs to right url
	public function post_save_data( $objID, $obj ) {

		if ( $this->newRecordNeedsRedir ) {

			global $zbsJustInsertedMetaboxID;
			if ( ! empty( $zbsJustInsertedMetaboxID ) && $zbsJustInsertedMetaboxID > 0 ) {

				// redir
				wp_redirect( jpcrm_esc_link( 'edit', $zbsJustInsertedMetaboxID, $this->objType ) );
				exit;

			}
		}
	}

	public function updateMessage() {

		global $zbs;

		// zbs-not-urgent means it'll auto hide after 1.5s
		// genericified from DAL3.0
		$msg = zeroBSCRM_UI2_messageHTML( 'info olive mini zbs-not-urgent', $zbs->DAL->typeStr( $zbs->DAL->objTypeKey( $this->objType ) ) . ' ' . __( 'Updated', 'zero-bs-crm' ), '', 'address book outline', 'contactUpdated' );

		$zbs->pageMessages[] = $msg;
	}
}

/*
======================================================
	/ Task Metabox
	====================================================== */

/*
======================================================
	Task Actions Metabox
	====================================================== */

class zeroBS__Metabox_TaskActions extends zeroBS__Metabox {

	public function __construct( $plugin_file ) {

		// set these
		$this->objType         = 'event';
		$this->metaboxID       = 'zerobs-event-actions';
		$this->metaboxTitle    = __( 'Task Actions', 'zero-bs-crm' ); // will be headless anyhow
		$this->headless        = true;
		$this->metaboxScreen   = 'zbs-add-edit-event-edit';
		$this->metaboxArea     = 'side';
		$this->metaboxLocation = 'high';
		$this->saveOrder       = 1;
		$this->capabilities    = array(

			'can_hide'        => false, // can be hidden
			'areas'           => array( 'high' ), // areas can be dragged to - normal side = only areas currently
			'can_accept_tabs' => true,  // can/can't accept tabs onto it
			'can_become_tab'  => false, // can be added as tab
			'can_minimise'    => true, // can be minimised
			'can_move'        => true, // can be moved

		);

		// call this
		$this->initMetabox();
	}

	public function html( $task, $metabox ) {

		?>
			<div class="zbs-generic-save-wrap">

				<div class="ui medium dividing header"><i class="save icon"></i> <?php esc_html_e( 'Task Actions', 'zero-bs-crm' ); ?></div>

			<?php

			// localise ID & content
			$task_id = -1;
			if ( is_array( $task ) && isset( $task['id'] ) ) {
				$task_id = (int) $task['id'];
			}

			if ( $task_id > 0 ) {
				?>

					<div class="zbs-task-actions-bottom zbs-objedit-actions-bottom">

							<button class="ui button black" type="button" id="zbs-edit-save"><?php esc_html_e( 'Update', 'zero-bs-crm' ); ?> <?php esc_html_e( 'Task', 'zero-bs-crm' ); ?></button>

						<?php

							// delete?

						// for now just check if can modify, later better, granular perms.
						if ( zeroBSCRM_perms_tasks() ) {
							?>
						<div id="zbs-task-actions-delete" class="zbs-objedit-actions-delete">
							<a class="submitdelete deletion" href="<?php echo jpcrm_esc_link( 'delete', $task_id, 'event' ); ?>"><?php esc_html_e( 'Delete Permanently', 'zero-bs-crm' ); ?></a>
						</div>
						<?php } // can delete ?>
						
						<div class='clear'></div>

					</div>
				<?php

			} else {

					// NEW Task
				?>

						<button class="ui button black" type="button" id="zbs-edit-save"><?php esc_html_e( 'Save', 'zero-bs-crm' ); ?> <?php esc_html_e( 'Task', 'zero-bs-crm' ); ?></button>

				<?php

			}

			?>
			</div>
			<?php
			// / .zbs-generic-save-wrap
	} // html

	// saved via main metabox
}

/*
======================================================
	/ Tasks Actions Metabox
	====================================================== */

/*
======================================================
	Create Tags Box
	====================================================== */

class zeroBS__Metabox_TaskTags extends zeroBS__Metabox_Tags {

	public function __construct( $plugin_file ) {

		$this->objTypeID = ZBS_TYPE_TASK;
		// DAL3 switched for objType $this->postType = 'zerobs_customer';
		$this->objType         = 'event';
		$this->metaboxID       = 'zerobs-event-tags';
		$this->metaboxTitle    = __( 'Task Tags', 'zero-bs-crm' );
		$this->metaboxScreen   = 'zbs-add-edit-event-edit'; //'zerobs_edit_contact'; // we can use anything here as is now using our func
		$this->metaboxArea     = 'side';
		$this->metaboxLocation = 'low';
		$this->showSuggestions = true;
		$this->capabilities    = array(

			'can_hide'        => true, // can be hidden
			'areas'           => array( 'side' ), // areas can be dragged to - normal side = only areas currently
			'can_accept_tabs' => false,  // can/can't accept tabs onto it
			'can_become_tab'  => false, // can be added as tab
			'can_minimise'    => true, // can be minimised

		);

		// call this
		$this->initMetabox();
	}

	// html + save dealt with by parent class :)
}

/*
======================================================
	/ Create Tags Box
	====================================================== */

/*
======================================================
	Task UI code - outputting the HTML for the task
	====================================================== */

function zeroBSCRM_task_addEdit( $taskID = -1 ) {

	global $zbs;

	$taskObject = $zbs->DAL->events->getEvent(
		$taskID,
		array(
			'withReminders'    => true,
			'withCustomFields' => true,
			'withTags'         => false,
			'withOwner'        => false,
		)
	);

	// catch fresh/new?
	if ( ! is_array( $taskObject ) ) {
		$taskObject = array();
	}

	/*
	$uid = get_current_user_id();
	$zbsThisOwner = zeroBS_getOwner($taskID,true,'zerobs_event');
	... this'd just be $taskObject['owner'] 3.0 + :)

	if($uid != $zbsThisOwner['ID']){

		$html = "<div class='ui segment'>";
		$html .= __("You cannot edit this task. It is not your task. Ask the task owner to modify.", 'zero-bs-crm');

	}else{ */

	if ( $taskID > 0 ) {
		$html = "<div id='task-" . $taskID . "' class='jpcrm-task-editor-wrap'>";
	} else {
		$html = "<div id='task-0' class='jpcrm-task-editor-wrap'>";
	}

	$html .= zeroBSCRM_task_ui_clear();

	$title = '';
	if ( is_array( $taskObject ) && isset( $taskObject['title'] ) ) {
		$title = $taskObject['title'];
	}
	$placeholder = __( 'Task Name...', 'zero-bs-crm' );
	if ( is_array( $taskObject ) && isset( $taskObject['placeholder'] ) ) {
		$placeholder = $taskObject['placeholder'];
	}
	// WH: Not sure placeholder is really req 3.0? What was that even? (It's not a field we've added to the data model)

	$html .= "<input id='zbs-task-title' name='zbse_title' type='text' value='" . esc_attr( $title ) . "' placeholder='" . $placeholder . "' />";

	$html .= zeroBSCRM_task_ui_mark_complete( $taskObject, $taskID );

	$html .= zeroBSCRM_task_ui_clear();

	$html .= jpcrm_task_ui_daterange( $taskObject ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	$html .= zeroBSCRM_task_ui_clear();

	$html .= zeroBSCRM_task_ui_assignment( $taskObject, $taskID ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	$html .= zeroBSCRM_task_ui_clear();

	$html .= zeroBSCRM_task_ui_description( $taskObject );

	$html .= zeroBSCRM_task_ui_clear();

	$html .= zeroBSCRM_task_ui_reminders( $taskObject, $taskID );

	$html .= zeroBSCRM_task_ui_clear();

	// NOTE show_on_portal is available and could clone this v3.0+
	$html .= zeroBSCRM_task_ui_showOnCalendar( $taskObject, $taskID );

	$html .= zeroBSCRM_task_ui_clear();

	if ( class_exists( 'ZeroBSCRM_ClientPortalPro' ) ) {
		$html .= zeroBSCRM_task_ui_showOnPortal( $taskObject );
	}

	$html .= zeroBSCRM_task_ui_clear();

	$html .= zeroBSCRM_task_ui_for( $taskObject, $taskID );

	$html .= zeroBSCRM_task_ui_clear();

	$html .= zeroBSCRM_task_ui_for_co( $taskObject );

	$html .= '</div>';

	return $html;
}

function zeroBSCRM_task_ui_clear() {
	return '<div class="clear zbs-task-clear"></div>'; }

#} Assign to CRM user UI
function zeroBSCRM_task_ui_assignment( $taskObject = array(), $taskID = -1 ) {

	global $zbs;

	$current_task_user_id = -1;
	if ( array_key_exists( 'owner', $taskObject ) ) {
		$current_task_user_id = $taskObject['owner'];
	}

	$html = '';
	if ( $current_task_user_id === '' || $current_task_user_id <= 0 ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

		$html .= "<div class='no-owner'><i class='ui icon user circle zbs-unassigned'></i>";

	} else {

		$owner_info   = get_userdata( $current_task_user_id );
		$display_name = $owner_info->data->display_name;
		$ava_args     = array(
			'class' => 'rounded-circle',
		);
		$avatar       = jpcrm_get_avatar( $current_task_user_id, 30, '', $display_name, $ava_args );
		$html        .= "<div class='no-owner'>" . $avatar . "<div class='dn'></div>";

	}

	$uid        = get_current_user_id();
	$linked_cal = $zbs->DAL->meta( ZBS_TYPE_TASK, $taskID, $key = 'zbs_outlook_id', false ); // false = default here

	if ( $uid != $current_task_user_id ) {
		//then it is LOCKED and cannot be changed to another owner?
	}

	// get potential owners
	$jpcrm_tasks_users = zeroBS_getPossibleTaskOwners();

	$html .= '<div class="owner-select" style="margin-left:30px;"><select class="form-controlx" id="zerobscrm-owner" name="zbse_owner" style="width:80%">';
	$html .= '<option value="-1">' . __( 'None', 'zero-bs-crm' ) . '</option>';

	if ( count( $jpcrm_tasks_users ) > 0 ) {
		foreach ( $jpcrm_tasks_users as $possOwner ) {
			$html .= '<option value="' . $possOwner->ID . '"';
			if ( $possOwner->ID == $current_task_user_id ) {
				$html .= ' selected="selected"';
			}
			$html .= '>' . esc_html( $possOwner->display_name ) . '</option>';
		}
	}
	$html .= '</select></div></div>';

	return $html;
}

function zeroBSCRM_task_ui_mark_complete( $taskObject = array(), $taskID = -1 ) {

	$html = "<div class='mark-complete-task'>";

	if ( ! array_key_exists( 'complete', $taskObject ) ) {
		$taskObject['complete'] = 0;
	}

	if ( $taskObject['complete'] == 1 ) {

			$html .= "<div id='task-mark-incomplete' class='task-comp incomplete'><button class='ui button black' data-taskid='" . $taskID . "'><i class='ui icon check white'></i>" . __( 'Completed', 'zero-bs-crm' ) . '</button></div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		$complete  = "<input type='hidden' id='zbs-task-complete' value = '1' name = 'zbs-task-complete'/>";
	} else {
			$html .= sprintf(
				'<div id="task-mark-complete" class="task-comp complete"><button class="ui button black button-primary button-large" data-taskid="%s"><i class="ui icon check"></i>%s</button></div>',
				$taskID, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
				__( 'Mark Complete', 'zero-bs-crm' )
			);
		$complete  = "<input type='hidden' id='zbs-task-complete' value = '-1' name = 'zbs-task-complete'/>";
	}

	$html .= '</div>';
	$html .= $complete;

	return $html;
}

#} CRM company / contact assignment
#} assign to CRM user UI
function zeroBSCRM_task_ui_for( $taskObject = array() ) {
	global $zbs;
	$html = "<div class='no-contact zbs-task-for-who'><div class='zbs-task-for-help'><i class='ui icon users'></i> " . __( 'Contact', 'zero-bs-crm' ) . '</div>';

	//need UI for selecting who the task is for (company, then contaxt)
	$custName = '';
	$custID   = '';

	if ( isset( $taskObject['contact'] ) && is_array( $taskObject['contact'] ) ) {

		$taskContact = $taskObject['contact'];

		// for now this needs a 0 offset as has potential for multi-contact
		if ( isset( $taskContact[0] ) && is_array( $taskContact[0] ) ) {

			$taskContact = $taskContact[0];
		}

		if ( isset( $taskContact['id'] ) ) {
			$custID = $taskContact['id'];
		}
		$custName = $zbs->DAL->contacts->getContactNameWithFallback( $custID );
	} elseif ( isset( $_GET['zbsprefillcust'] ) && ! empty( $_GET['zbsprefillcust'] ) ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$custID   = (int) $_GET['zbsprefillcust'];
			$custName = $zbs->DAL->contacts->getContactNameWithFallback( $custID );
	}

	#} Output
	$html .= '<div class="zbs-task-for">' . zeroBSCRM_CustomerTypeList( 'jpcrm_tasks_setContact', $custName, true, 'jpcrm_tasks_changeContact' ) . '</div>'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$html .= '<input type="hidden" name="zbse_customer" id="zbse_customer" value="' . ( $custName ? $custID : '' ) . '" />'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
	$html .= '<div class="clear"></div></div>';

	return $html;
}

function zeroBSCRM_task_ui_for_co( $taskObject = array() ) {
	global $zbs;
	$html = '';

	if ( zeroBSCRM_getSetting( 'companylevelcustomers' ) == '1' ) {

		$html .= "<div class='no-contact zbs-task-for-who'><div class='zbs-task-for-help'><i class='ui icon building outline'></i> " . jpcrm_label_company() . '</div>';

		//need UI for selecting who the task is for (company, then contact)
		$co_name = '';
		$co_id   = '';

		if ( isset( $taskObject['company'] ) && is_array( $taskObject['company'] ) ) {

			$task_company = $taskObject['company']; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

			// for now this needs a 0 offset as has potential for multi-contact
			if ( isset( $task_company[0] ) && is_array( $task_company[0] ) ) {
				$task_company = $task_company[0];
			}

			if ( isset( $task_company['id'] ) ) {
				$co_id = $task_company['id'];
			}
			if ( isset( $task_company['name'] ) ) {
				$co_name = $task_company['name'];
			}
		} elseif ( isset( $_GET['zbsprefillco'] ) && ! empty( $_GET['zbsprefillco'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$co_id   = (int) $_GET['zbsprefillco']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
				$co_name = $zbs->DAL->companies->getCompanyNameEtc( $co_id ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		}

		#} Output
		$html .= '<div class="zbs-task-for-company">' . zeroBSCRM_CompanyTypeList( 'jpcrm_tasks_setCompany', $co_name, true, 'jpcrm_tasks_changeCompany' ) . '</div>';
		$html .= '<input type="hidden" name="zbse_company" id="zbse_company" value="' . ( $co_name ? $co_id : '' ) . '" />';
		$html .= '<div class="clear"></div></div>';

	}

	return $html;
}

/**
 * Returns a string for disabling browser autocomplete
 * Ideally we'd just use "off", but support is not complete: https://caniuse.com/input-autocomplete-onoff
 *
 * @param obj $task_object Object containing task details.
 *
 * @return string $html Contains the start/end date and time inputs.
 */
function jpcrm_task_ui_daterange( $task_object = array() ) {

	if ( ! isset( $task_object['start'] ) ) {

		// no task start defined yet, so use some defaults

		// start +1 hour from now
		$task_start = time() + 3600;

		// round to 15 minutes
		$task_start -= $task_start % 900;

		// end +1 hour from start
		$task_end = $task_start + 3600;

	} else {

		$task_start = $task_object['start'];
		$task_end   = $task_object['end'];

	}

	// For now, hack together a table so the date and time inputs line up nicely. Eventually we'll want to rework the entire UI of this page.
	$html = '
<table style="margin-left:20px;">
	<tr class="wh-large">
		<td><label>' . esc_html__( 'Start time', 'zero-bs-crm' ) . ':</label>&nbsp;</td>
		<td>
			<input type="date" name="jpcrm_start_datepart" value="' . esc_attr( jpcrm_uts_to_date_str( $task_start, 'Y-m-d' ) ) . '" autocomplete="' . esc_attr( jpcrm_disable_browser_autocomplete() ) . '" />
			@ 
			<input type="time" name="jpcrm_start_timepart" value="' . esc_attr( jpcrm_uts_to_date_str( $task_start, 'H:i' ) ) . '" autocomplete="' . esc_attr( jpcrm_disable_browser_autocomplete() ) . '" />
		</td>
	</tr>
	<tr class="wh-large">
		<td><label>' . esc_html__( 'End time', 'zero-bs-crm' ) . ':</label>&nbsp;</td>
		<td>
			<input type="date" name="jpcrm_end_datepart" value="' . esc_attr( jpcrm_uts_to_date_str( $task_end, 'Y-m-d' ) ) . '" autocomplete="' . esc_attr( jpcrm_disable_browser_autocomplete() ) . '" />
			@ 
			<input type="time" name="jpcrm_end_timepart" value="' . esc_attr( jpcrm_uts_to_date_str( $task_end, 'H:i' ) ) . '" autocomplete="' . esc_attr( jpcrm_disable_browser_autocomplete() ) . '" />
		</td>
	</tr>
</table>';

	return $html;
}

#} UI Reminders
function zeroBSCRM_task_ui_reminders( $taskObject = array(), $taskID = -1 ) {

	$show = false;

	// v3.0 + this is differently stored:
	//if (isset($taskObject['notify_crm'])) $show = $taskObject['notify_crm'];
	if ( isset( $taskObject['reminders'] ) && is_array( $taskObject['reminders'] ) ) {

		// eventually diff time reminders will be in this array, for v3.0 we only have 24h reminders
		foreach ( $taskObject['reminders'] as $reminder ) {

			if ( is_array( $reminder ) && isset( $reminder['remind_at'] ) ) {

				// catch 24
				if ( $reminder['remind_at'] == -86400 ) {
					$show = true;
				}
			}
		}
	} else {

		// new, set default:
		$show = true;
	}

	$html      = "<div class='remind_task'>";
		$html .= '<div>';

			// add admin cog (settings) for task notification template
	if ( zeroBSCRM_isZBSAdminOrAdmin() ) {
			$html .= sprintf(
				'<a href="%s" class="button button-primary button-large" style="background-color:black;border-color:black;" title="%s" target="_blank"><i class="cogs icon"></i></a>',
				esc_url_raw( jpcrm_esc_link( 'zbs-email-templates' ) . '&zbs_template_id=' . ZBSEMAIL_TASK_NOTIFICATION ),
				__( 'Admin: Notification Settings', 'zero-bs-crm' )
			);
	}

		$html .= '<input name="zbs_remind_task_24" id="zbs_remind_task_24" type="checkbox" value="24"';
	if ( $show ) {
		$html .= ' checked="checked"';
	}
		$html .= "/><label for='zbs_remind_task_24'>" . __( 'Remind CRM member 24 hours before', 'zero-bs-crm' ) . '</label></div>';
	//    $html .= "<a class='ui label blue' href='". admin_url('admin.php?page=zbs-reminders') ."' target='_blank' style='margin-top: 0.2em;margin-right: 0.3em;'>" .__('Add more reminders', 'zero-bs-crm') . "</a>";
	$html .= '</div>';

	#} Better reminders in Calendar Pro :-)
	$html = apply_filters( 'zbs_task_reminders', $html );

	return $html;
}

// NOTE show_on_portal is available and could clone this v3.0+
function zeroBSCRM_task_ui_showOnCalendar( $taskObject = array(), $taskID = -1 ) {

	global $zbs;

	// show?
	$show = false;
	if ( isset( $taskObject['show_on_cal'] ) ) {
		if ( $taskObject['show_on_cal'] == 1 ) {
			$show = true;
		}
	} else {
		// new, set default:
		$show = true;
	}

	$linked_cal = $zbs->DAL->meta( ZBS_TYPE_TASK, $taskID, $key = 'zbs_outlook_id', false ); // false = default here

	$html = "<div class='show-on-calendar'>";
	if ( $linked_cal != '' ) {
		$html .= '<div class="zbs-hide"><input name="zbse_show_on_cal" id="zbse_show_on_cal" type="checkbox" value="1"';
		if ( $show ) {
			$html .= ' checked="checked"';
		}
		$html .= "/></div><div class='outlook-event'>" . __( 'Linked to Online Calendar (will always show on CRM Calendar)', 'zero-bs-crm' ) . '</div>';
	} else {
		$html .= '<div><input name="zbse_show_on_cal" id="zbse_show_on_cal" type="checkbox" value="1"';
		if ( $show ) {
			$html .= ' checked="checked"';
		}
		$html .= "/><label for='zbse_show_on_cal'>" . __( 'Show on Calendar', 'zero-bs-crm' ) . '</label></div></div>';
	}

	#} anything else we may want to filter with.
	$html = apply_filters( 'zbs_calendar_add_to_calendar', $html );

	return $html;
}

function zeroBSCRM_task_ui_showOnPortal( $taskObject = array() ) {

	$show = true;

	if ( isset( $taskObject['show_on_portal'] ) ) {
		$show = $taskObject['show_on_portal'];
	}

	$html      = "<div class='show-on-calendar'>";
		$html .= '<div><input name="zbse_show_on_portal" id="zbse_show_on_portal" type="checkbox" value="1"';
	if ( $show ) {
		$html .= ' checked="checked"';
	}
		$html .= "/><label for='zbse_show_on_portal'>" . __( 'Show on Client Portal (if assigned to contact)', 'zero-bs-crm' ) . '</label></div>';
	$html     .= '</div>';

	return $html;
}

function zeroBSCRM_task_ui_comments( $pID = -1 ) {

	$args = array();

	$html = comment_form( $args, $pID );

	return $html;
}

function zeroBSCRM_task_ui_description( $taskObject = array() ) {

	$html = "<div class='clear'></div><div class='zbs-task-desc'><textarea id='zbse_desc' name='zbse_desc' placeholder='" . __( 'Task Description...', 'zero-bs-crm' ) . "'>";

	if ( isset( $taskObject ) && isset( $taskObject['desc'] ) ) {
		$html .= $taskObject['desc'];
	}

	$html .= '</textarea></div>';

	return $html;
}
/*
======================================================
	/ Task UI code
	====================================================== */
