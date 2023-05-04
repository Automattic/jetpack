<?php
/**
 * Launchpad Helpers
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 1.4.0
 */

/**
 * This file provides helpers that return the appropriate Launchpad
 * checklist and tasks for a given checklist id.
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 1.4.0
 */

require_once __DIR__ . '/class-launchpad-task-lists.php';

/**
 * Registers all default launchpad checklists
 */
function wpcom_register_default_launchpad_checklists() {
	wpcom_register_launchpad_task(
		array(
			'id'                   => 'setup_newsletter',
			'title'                => __( 'Personalize newsletter', 'jetpack-mu-wpcom' ),
			'is_complete_callback' => '__return_true',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'plan_selected',
			'title'                => __( 'Choose a plan', 'jetpack-mu-wpcom' ),
			'subtitle'             => 'wpcom_get_plan_selected_subtitle',
			'is_complete_callback' => '__return_true',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'subscribers_added',
			'title'                => __( 'Add subscribers', 'jetpack-mu-wpcom' ),
			'is_complete_callback' => '__return_true',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'    => 'first_post_published',
			'title' => __( 'Write your first post', 'jetpack-mu-wpcom' ),
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'     => 'first_post_published_newsletter',
			'title'  => __( 'Start writing', 'jetpack-mu-wpcom' ),
			'id_map' => 'first_post_published',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'design_selected',
			'title'                => __( 'Select a design', 'jetpack-mu-wpcom' ),
			'is_complete_callback' => '__return_true',
			'is_disabled_callback' => 'wpcom_is_design_step_enabled',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'setup_link_in_bio',
			'title'                => __( 'Personalize Link in Bio', 'jetpack-mu-wpcom' ),
			'is_complete_callback' => '__return_true',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'     => 'links_added',
			'title'  => __( 'Add links', 'jetpack-mu-wpcom' ),
			'id_map' => 'links_edited',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'link_in_bio_launched',
			'title'                => __( 'Launch your site', 'jetpack-mu-wpcom' ),
			'id_map'               => 'site_launched',
			'is_disabled_callback' => 'wpcom_is_link_in_bio_launch_disabled',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'videopress_setup',
			'title'                => __( 'Set up your video site', 'jetpack-mu-wpcom' ),
			'is_complete_callback' => '__return_true',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'videopress_upload',
			'title'                => __( 'Upload your first video', 'jetpack-mu-wpcom' ),
			'id_map'               => 'video_uploaded',
			'is_disabled_callback' => 'wpcom_is_videopress_upload_disabled',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'videopress_launched',
			'title'                => __( 'Launch site', 'jetpack-mu-wpcom' ),
			'id_map'               => 'site_launched',
			'is_disabled_callback' => 'wpcom_is_videopress_launch_disabled',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'setup_free',
			'title'                => __( 'Personalize your site', 'jetpack-mu-wpcom' ),
			'is_complete_callback' => '__return_true',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'setup_general',
			'title'                => __( 'Set up your site', 'jetpack-mu-wpcom' ),
			'is_complete_callback' => '__return_true',
			'is_disabled_callback' => '__return_true',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'     => 'design_edited',
			'title'  => __( 'Edit site design', 'jetpack-mu-wpcom' ),
			'id_map' => 'site_edited',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'           => 'site_launched',
			'title'        => __( 'Launch your site', 'jetpack-mu-wpcom' ),
			'isLaunchTask' => true,
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'setup_write',
			'title'                => __( 'Set up your site', 'jetpack-mu-wpcom' ),
			'is_complete_callback' => '__return_true',
			'is_disabled_callback' => '__return_true',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'domain_upsell',
			'id_map'               => 'domain_upsell_deferred',
			'title'                => __( 'Choose a domain', 'jetpack-mu-wpcom' ),
			'is_complete_callback' => 'wpcom_is_domain_upsell_completed',
			'badge_text_callback'  => 'wpcom_get_domain_upsell_badge_text',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                   => 'verify_email',
			'title'                => __( 'Confirm email (check your inbox)', 'jetpack-mu-wpcom' ),
			'is_disabled_callback' => '__return_true',
		)
	);

	// Tasks registered, now onto the checklists.
	wpcom_register_launchpad_task_list(
		array(
			'id'       => 'build',
			'title'    => 'Build',
			'task_ids' => array(
				'setup_general',
				'design_selected',
				'first_post_published',
				'design_edited',
				'site_launched',
			),
		)
	);

	wpcom_register_launchpad_task_list(
		array(
			'id'       => 'free',
			'title'    => 'Free',
			'task_ids' => array(
				'setup_free',
				'design_selected',
				'domain_upsell',
				'first_post_published',
				'design_edited',
				'site_launched',
			),
		)
	);

	wpcom_register_launchpad_task_list(
		array(
			'id'       => 'link-in-bio',
			'title'    => 'Link In Bio',
			'task_ids' => array(
				'design_selected',
				'setup_link_in_bio',
				'plan_selected',
				'links_added',
				'link_in_bio_launched',
			),
		)
	);

	wpcom_register_launchpad_task_list(
		array(
			'id'       => 'link-in-bio-tld',
			'title'    => 'Link In Bio',
			'task_ids' => array(
				'design_selected',
				'setup_link_in_bio',
				'plan_selected',
				'links_added',
				'link_in_bio_launched',
			),
		)
	);

	wpcom_register_launchpad_task_list(
		array(
			'id'       => 'newsletter',
			'title'    => 'Newsletter',
			'task_ids' => array(
				'setup_newsletter',
				'plan_selected',
				'subscribers_added',
				'verify_email',
				'first_post_published_newsletter',
			),
		)
	);

	wpcom_register_launchpad_task_list(
		array(
			'id'       => 'videopress',
			'title'    => 'Videopress',
			'task_ids' => array(
				'videopress_setup',
				'plan_selected',
				'videopress_upload',
				'videopress_launched',
			),
		)
	);

	wpcom_register_launchpad_task_list(
		array(
			'id'       => 'write',
			'title'    => 'Write',
			'task_ids' => array(
				'setup_write',
				'design_selected',
				'first_post_published',
				'site_launched',
			),
		)
	);

	// This is the hook that allows other plugins to register their own checklists.
	do_action( 'wpcom_register_launchpad_tasks' );

	wpcom_add_active_task_listener_hooks_to_correct_action();
}

// Running on priority 11 will allow anything that adds hooks on init with default priority 10 to add their hooks to the `wpcom_register_launchpad_tasks` action.
add_action( 'init', 'wpcom_register_default_launchpad_checklists', 11 );

/**
 * Adds hooks to the correct action to add active task listeners.
 * Handles REST API requests vs non-REST API requests.
 *
 * @return null
 */
function wpcom_add_active_task_listener_hooks_to_correct_action() {
	$url = wp_parse_url( home_url(), PHP_URL_HOST );
	if ( $url === 'public-api.wordpress.com' ) {
		return add_action( 'rest_api_switched_to_blog', 'wpcom_launchpad_add_active_task_listeners' );
	}

	// If we're not deferring to REST API blog switch, just run now
	return wpcom_launchpad_add_active_task_listeners();
}

/**
 * Adds task-defined `add_listener_callback` hooks for incomplete tasks.
 *
 * @return void
 */
function wpcom_launchpad_add_active_task_listeners() {
	wpcom_launchpad_checklists()->add_hooks_for_active_tasks();
}

// unhook our old mu-plugin
add_action(
	'plugins_loaded',
	function () {
		if ( class_exists( 'WPCOM_Launchpad' ) ) {
			remove_action( 'plugins_loaded', array( WPCOM_Launchpad::get_instance(), 'init' ) );
		}
	},
	9
);

/**
 * Determines whether or not the videopress upload task is enabled
 *
 * @return boolean True if videopress upload task is enabled
 */
function wpcom_is_videopress_upload_disabled() {
	return wpcom_is_checklist_task_complete( 'video_uploaded' );
}

/**
 * Determines whether or not the videopress launch task is enabled
 *
 * @return boolean True if videopress launch task is enabled
 */
function wpcom_is_videopress_launch_disabled() {
	return ! wpcom_is_checklist_task_complete( 'video_uploaded' );
}

/**
 * Determines whether or not the link-in-bio launch task is enabled
 *
 * @return boolean True if link-in-bio launch task is enabled
 */
function wpcom_is_link_in_bio_launch_disabled() {
	return ! wpcom_is_checklist_task_complete( 'links_edited' );
}

/**
 * Determines whether or not design selected task is enabled
 *
 * @return boolean True if design selected task is enabled
 */
function wpcom_can_update_design_selected_task() {
	$site_intent = get_option( 'site_intent' );
	return $site_intent === 'free' || $site_intent === 'build' || $site_intent === 'write';
}

/**
 * Callback for design task enabled state
 *
 * @return boolean
 */
function wpcom_is_design_step_enabled() {
	return ! wpcom_can_update_design_selected_task();
}

/**
 * Determines whether or not domain upsell task is completed.
 *
 * @param array $task    The Task object.
 * @param mixed $default The default value.
 * @return bool True if domain upsell task is completed.
 */
function wpcom_is_domain_upsell_completed( $task, $default ) {
	if ( wpcom_site_has_feature( 'custom-domain' ) ) {
		return true;
	}
	return $default;
}

/**
 * Returns the subtitle for the plan selected task
 *
 * @return string Subtitle text
 */
function wpcom_get_plan_selected_subtitle() {
	if ( ! function_exists( 'wpcom_global_styles_in_use' ) || ! function_exists( 'wpcom_should_limit_global_styles' ) ) {
		return '';
	}

	return wpcom_global_styles_in_use() && wpcom_should_limit_global_styles()
		? __(
			'Your site contains custom colors that will only be visible once you upgrade to a Premium plan.',
			'jetpack-mu-wpcom'
		) : '';
}

/**
 * Returns the badge text for the plan selected task
 *
 * @return string Badge text
 */
function wpcom_get_domain_upsell_badge_text() {
	// Never run `wpcom_is_checklist_task_complete` within a is_complete_callback unless you are fond of infinite loops.
	return wpcom_is_checklist_task_complete( 'domain_upsell' ) ? '' : __( 'Upgrade plan', 'jetpack-mu-wpcom' );
}

/**
 * Returns launchpad checklist task by task id.
 *
 * @param string $task_id Task id.
 *
 * @return array Associative array with task data
 *               or false if task id is not found.
 */
function wpcom_is_checklist_task_complete( $task_id ) {
	return wpcom_launchpad_checklists()->is_task_id_complete( $task_id );
}

/**
 * Returns launchpad checklist by checklist slug.
 *
 * @param string $checklist_slug Checklist slug.
 *
 * @return Task[] Collection of tasks for a given checklist
 */
function wpcom_get_launchpad_checklist_by_checklist_slug( $checklist_slug ) {
	if ( ! $checklist_slug ) {
		return array();
	}

	return wpcom_launchpad_checklists()->build( $checklist_slug );
}

// TODO: Write code p2 post or dotcom post
/**
 * Wrapper that registers a launchpad checklist.
 *
 * @param Task_List $task_list Task list definition.
 *
 * @return bool True if successful, false otherwise.
 */
function wpcom_register_launchpad_task_list( $task_list ) {
	return wpcom_launchpad_checklists()->register_task_list( $task_list );
}

/**
 * Wrapper that registers a launchpad checklist.
 *
 * @param Task $tasks Collection of Task definitions.
 *
 * @return bool True if successful, false otherwise.
 */
function wpcom_register_launchpad_tasks( $tasks ) {
	return wpcom_launchpad_checklists()->register_tasks( $tasks );
}

/**
 * Wrapper that registers a launchpad checklist.
 *
 * @param Task $task Task definition.
 *
 * @return bool True if successful, false otherwise.
 */
function wpcom_register_launchpad_task( $task ) {
	return wpcom_launchpad_checklists()->register_task( $task );
}

/**
 * Helper function to return a `Launchpad_Task_Lists` instance.
 *
 * @return object Launchpad_Task_Lists instance.
 */
function wpcom_launchpad_checklists() {
	return Launchpad_Task_Lists::get_instance();
}
