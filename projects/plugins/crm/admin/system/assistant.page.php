<?php
/*
!
 * System Assistant: Assistant page
 */

global $zbs;

// render title
jpcrm_render_system_title( __( 'System Assistant', 'zero-bs-crm' ) );

// render page
jpcrm_render_system_assistant_page();

/**
 * Render the page
 *
 * Example job:
 *
 * 'my_job' => array(
 *   'title'           => '', // set a job title
 *   'icon'            => '', // choose an icon from Semantic UI: https://semantic-ui.com/elements/icon.html
 *   'desc_incomplete' => '', // text to show when job is incomplete
 *   'desc_complete'   => '', // text to show when job is complete
 *   'button_url'      => '', // url where one can perform an action or get more info
 *   'button_txt'      => '', // text for button that leads to the above; if omitted it defaults to 'Read Guide'
 *   'state'           => true, // condition that triggers a bool response; complete = true, incomplete = false
 * ),
 */
function jpcrm_render_system_assistant_page() {

	global $zbs;

	?><p><?php esc_html_e( 'Welcome to the CRM System Assistant. This page provides an admin overview of the progress through setup of your CRM systems.', 'zero-bs-crm' ); ?></p>

	<div class="ui segment">
		<?php

		// all assumes admin.

		// MVP Job list:
		$job_list = array(

			'complete_welcome_tour' => array(

				'title'           => __( 'Complete the Welcome Tour', 'zero-bs-crm' ),
				'icon'            => 'magic',
				'desc_incomplete' => wp_sprintf( __( 'Try out the welcome tour by <a href="%s">clicking here</a>.', 'zero-bs-crm' ), zeroBSCRM_getAdminURL( $zbs->slugs['dash'] ) . '&zbs-welcome-tour=1' ),
				'desc_complete'   => __( 'Good start! You have completed the welcome tour.', 'zero-bs-crm' ),
				'button_url'      => zeroBSCRM_getAdminURL( $zbs->slugs['dash'] ) . '&zbs-welcome-tour=1',
				'button_txt'      => __( 'Start tour', 'zero-bs-crm' ),
				'state'           => true, // for now default

			),

			'first_contact'         => array(

				'title'           => __( 'First Contact', 'zero-bs-crm' ),
				'icon'            => 'address book',
				'desc_incomplete' => sprintf( __( 'The first step for using any CRM is to get your first contact added. Go ahead and <a href="%s">add a contact now</a>!', 'zero-bs-crm' ), admin_url( 'admin.php?page=' . $zbs->slugs['addedit'] . '&action=edit&zbstype=contact' ) ),
				'desc_complete'   => __( 'Great, you already have a contact in your CRM!', 'zero-bs-crm' ),
				'button_url'      => $zbs->urls['kbfirstcontact'],
				'state'           => zeroBS_customerCount() > 0,

			),

		);

		// try invoicing
		$job_list['try_invoicing'] = array(

			'title'           => __( 'Try Invoicing', 'zero-bs-crm' ),
			'icon'            => 'file alternate',
			'desc_incomplete' => __( 'Enable Invoicing so you can try out our invoicing system.', 'zero-bs-crm' ),
			'desc_complete'   => __( 'Great, you already have invoicing enabled!', 'zero-bs-crm' ),
			'button_url'      => $zbs->urls['kbactivatecoreext'],
			'state'           => zeroBSCRM_getSetting( 'feat_invs' ) > 0,

		);

		// extension dependent
		if ( zeroBSCRM_getSetting( 'feat_invs' ) > 0 ) {

			// add invoice
			$job_list['first_invoice'] = array(

				'title'           => __( 'Try Invoicing II', 'zero-bs-crm' ),
				'icon'            => 'file',
				'desc_incomplete' => __( 'Add your first invoice to see how the CRM invoicing system works.', 'zero-bs-crm' ),
				'desc_complete'   => __( 'Great, you\'re using Invoices.', 'zero-bs-crm' ),
				'button_url'      => $zbs->urls['kbinvoicebuilder'],
				'state'           => zeroBS_invCount() > 0,

			);

		}

		$job_list['add_team'] = array(

			'title'           => __( 'Add your team', 'zero-bs-crm' ),
			'icon'            => 'users',
			'desc_incomplete' => sprintf( __( 'If you have any team members who might need access to the CRM, <a href="%s">add them now</a>.', 'zero-bs-crm' ), zeroBSCRM_getAdminURL( $zbs->slugs['team'] ) ),
			'desc_complete'   => __( 'Great, it looks like you have several users who can access the CRM.', 'zero-bs-crm' ),
			'button_url'      => $zbs->urls['kbteam'],
			'state'           => count( zeroBSCRM_crm_users_list() ) > 0,

		);

		$job_list = apply_filters( 'jpcrm_system_assistant_jobs', $job_list );

		##WLREMOVE
		$job_list['add_extension'] = array(

			'title'           => __( 'Get Tooled Up', 'zero-bs-crm' ),
			'icon'            => 'dashboard',
			'desc_incomplete' => __( 'Add extensions to your CRM to supercharge your work.', 'zero-bs-crm' ),
			'desc_complete'   => __( 'Good job, you already have an extension installed.', 'zero-bs-crm' ),
			'button_url'      => $zbs->urls['home'],
			'button_txt'      => __( 'Get Extensions', 'zero-bs-crm' ),
			'state'           => count( zeroBSCRM_activeInstalledProExt() ) > 0,

		);
		##/WLREMOVE

		// updates?
		$has_update = false;

		// check for updates - core
		$update_data = zeroBSCRM_updates_pluginHasUpdate( 'Jetpack CRM', 'zero-bs-crm' );
		if ( is_object( $update_data ) && isset( $update_data->update ) && is_object( $update_data->update ) && isset( $update_data->update->new_version ) ) {

			// has update available
			$has_update = true;

		}

		$job_list['stay_up_to_date'] = array(

			'title'           => __( 'Stay Up To Date', 'zero-bs-crm' ),
			'icon'            => 'calendar',
			'desc_incomplete' => __( 'Looks like you need to update the Core CRM plugin.', 'zero-bs-crm' ),
			'desc_complete'   => __( 'Good job, your core CRM is up to date.', 'zero-bs-crm' ),
			'button_url'      => admin_url( 'update-core.php' ),
			'button_txt'      => __( 'View Updates', 'zero-bs-crm' ),
			'state'           => ! $has_update,

		);

		foreach ( $job_list as $job_key => $job ) {

			jpcrm_render_system_assistant_job( $job );

		}

		?>

	</div>
	<?php
}

/**
 * Render a single system assistant job
 */
function jpcrm_render_system_assistant_job( $job = array() ) {

	// if no help txt, use default:
	if ( empty( $job['button_txt'] ) ) {
		##WLREMOVE
		$job['button_txt'] = __( 'Read Guide', 'zero-bs-crm' );
		##/WLREMOVE
	}

	?>
		<div class="jpcrm-assistant-job jpcrm-assistant-state-<?php echo $job['state'] ? 1 : 0; ?>">
			<div class="ui grid">
				<div class="two wide column iconWrap">
					<i class="minus circle icon state-incomplete"></i>
					<i class="check circle outline icon green state-complete"></i>
				</div>
				<div class="fourteen wide column">
					<h4 class="ui header"><i class="<?php echo esc_attr( $job['icon'] ); ?> icon"></i> <?php echo esc_html( $job['title'] ); ?></h4>
					<p class="job-desc state-incomplete"><?php echo esc_html( $job['desc_incomplete'] ); ?></p>
					<p class="job-desc state-complete"><?php echo esc_html( $job['desc_complete'] ); ?></p>
					<?php
					if ( ! empty( $job['button_txt'] ) ) {
						?>
						<p class="job-help">
							<a href="<?php echo esc_url( $job['button_url'] ); ?>" target="_blank" class="ui button"><?php echo esc_html( $job['button_txt'] ); ?></a>
						</p>
						<?php
					}
					?>
				</div>
			</div>
		</div>
	<?php
}
