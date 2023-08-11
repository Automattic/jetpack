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
require_once __DIR__ . '/launchpad-task-definitions.php';

/**
 * Registers all default launchpad checklists
 *
 * @return array
 */
function wpcom_launchpad_get_task_list_definitions() {
	$core_task_list_definitions = array(
		'build'                  => array(
			'title'               => 'Build',
			'task_ids'            => array(
				'setup_general',
				'design_selected',
				'plan_selected',
				'first_post_published',
				'design_edited',
				'site_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'free'                   => array(
			'title'               => 'Free',
			'task_ids'            => array(
				'plan_selected',
				'setup_free',
				'design_selected',
				'domain_upsell',
				'first_post_published',
				'design_edited',
				'site_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'link-in-bio'            => array(
			'title'               => 'Link In Bio',
			'task_ids'            => array(
				'design_selected',
				'setup_link_in_bio',
				'plan_selected',
				'links_added',
				'link_in_bio_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'link-in-bio-tld'        => array(
			'title'               => 'Link In Bio',
			'task_ids'            => array(
				'design_selected',
				'setup_link_in_bio',
				'plan_selected',
				'links_added',
				'link_in_bio_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'newsletter'             => array(
			'title'               => 'Newsletter',
			'task_ids'            => array(
				'setup_newsletter',
				'plan_selected',
				'subscribers_added',
				'verify_email',
				'set_up_payments',
				'newsletter_plan_created',
				'migrate_content',
				'first_post_published_newsletter',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'videopress'             => array(
			'title'               => 'Videopress',
			'task_ids'            => array(
				'videopress_setup',
				'plan_selected',
				'videopress_upload',
				'videopress_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'write'                  => array(
			'title'               => 'Write',
			'task_ids'            => array(
				'setup_write',
				'design_selected',
				'plan_selected',
				'first_post_published',
				'site_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'start-writing'          => array(
			'title'               => 'Start Writing',
			'task_ids'            => array(
				'first_post_published',
				'setup_blog',
				'domain_upsell',
				'plan_completed',
				'blog_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'design-first'           => array(
			'title'               => 'Pick a Design',
			'task_ids'            => array(
				'design_completed',
				'setup_blog',
				'domain_upsell',
				'plan_completed',
				'first_post_published',
				'blog_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'intent-build'           => array(
			'title'               => 'Keep Building',
			'task_ids'            => array(
				'site_title',
				'domain_claim',
				'verify_email',
				'domain_customize',
				'add_new_page',
				'drive_traffic',
				'edit_page',
				'share_site',
				'update_about_page',
			),
			'is_enabled_callback' => 'wpcom_launchpad_is_keep_building_enabled',
		),
		'intent-write'           => array(
			'title'               => 'Blog',
			'task_ids'            => array(
				'site_title',
				'domain_claim',
				'verify_email',
				'domain_customize',
				'drive_traffic',
				'write_3_posts',
			),
			'is_enabled_callback' => 'wpcom_launchpad_is_intent_write_enabled',
		),
		'intent-free-newsletter' => array(
			'title'               => 'Free Newsletter',
			'task_ids'            => array(
				'verify_email',
				'domain_claim',
				'domain_customize',
				'share_site',
				'customize_welcome_message',
				'enable_subscribers_modal',
				'add_10_email_subscribers',
				'manage_subscribers',
				'write_3_posts',
				'connect_social_media',
				'update_about_page',
				'add_about_page',
				'earn_money',
			),
			'is_enabled_callback' => 'wpcom_launchpad_is_free_newsletter_enabled',
		),
		'intent-paid-newsletter' => array(
			'title'               => 'Paid Newsletter',
			'task_ids'            => array(
				'verify_email',
				'domain_claim',
				'domain_customize',
				'share_site',
				'customize_welcome_message',
				'enable_subscribers_modal',
				'add_10_email_subscribers',
				'manage_subscribers',
				'write_3_posts',
				'connect_social_media',
				'manage_paid_newsletter_plan',
				'update_about_page',
				'add_about_page',
			),
			'is_enabled_callback' => 'wpcom_launchpad_is_paid_newsletter_enabled',
		),
	);

	$extended_task_list_definitions = apply_filters( 'wpcom_launchpad_extended_task_list_definitions', array() );

	// As for tasks, we can decide what overrides we allow later.
	return array_merge( $extended_task_list_definitions, $core_task_list_definitions );
}

/**
 * Get a registered task list.
 *
 * @param string $checklist_slug The checklist slug to get the task list for.
 *
 * @return array
 */
function wpcom_launchpad_get_task_list( $checklist_slug = null ) {
	// If we don't have a checklist slug, fall back to the site intent option.
	$checklist_slug = $checklist_slug ? $checklist_slug : get_option( 'site_intent' );
	if ( ! $checklist_slug ) {
		return array();
	}

	return wpcom_launchpad_checklists()->get_task_list( $checklist_slug );
}

/**
 * Register all tasks and task lists from definitions
 *
 * @param bool $rebuild Whether to rebuild the task lists or not.
 *
 * @return array
 */
function wpcom_launchpad_get_task_lists( $rebuild = false ) {
	// If we already have task lists registered and we don't want to rebuild, return all task lists.
	if ( ! $rebuild && wpcom_launchpad_checklists()->has_task_lists() ) {
		return wpcom_launchpad_checklists()->get_all_task_lists();
	}

	$task_definitions = wpcom_launchpad_get_task_definitions();

	// Register all tasks.
	foreach ( $task_definitions as $task_id => $task_definition ) {
		$task_data = array_merge( $task_definition, array( 'id' => $task_id ) );
		wpcom_register_launchpad_task( $task_data );
	}

	$task_list_definitions = wpcom_launchpad_get_task_list_definitions();

	// Register all task lists.
	foreach ( $task_list_definitions as $task_list_id => $task_list_definition ) {
		$task_list_data = array_merge( $task_list_definition, array( 'id' => $task_list_id ) );
		wpcom_register_launchpad_task_list( $task_list_data );
	}

	// Assuming the reference is good, just return all checklists.
	return wpcom_launchpad_checklists()->get_all_task_lists();
}

/**
 * Register all tasks and task lists on init.
 */
function wpcom_register_default_launchpad_checklists() {
	wpcom_launchpad_get_task_lists();
	wpcom_add_active_task_listener_hooks_to_correct_action();
}
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

/**
 * Determines whether or not design selected task is enabled
 *
 * @return boolean True if design selected task is enabled
 */
function wpcom_can_update_design_selected_task() {
	$site_intent = get_option( 'site_intent' );
	return $site_intent === 'free' || $site_intent === 'build' || $site_intent === 'write' || $site_intent === 'design-first';
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
 * Retrieves the required tasks from a given set of tasks.
 *
 * This function filters the provided tasks array and returns only the tasks that are marked as required,
 * based on the specified array of required task IDs. It's worth noting that some tasks may not be
 * visible to the user, so we are going to return all tasks that are marked as required, regardless
 *
 * @param array $required_task_ids An array of task IDs that are considered required.
 * @param array $tasks An array of tasks to filter.
 * @return array An array containing only the required tasks from the provided task list.
 */
function wpcom_launchpad_get_required_tasks( $required_task_ids, $tasks ) {
	return array_filter(
		$tasks,
		function ( $task ) use ( $required_task_ids ) {
			return in_array( $task['id'], $required_task_ids, true );
		}
	);
}

/**
 * Get all tasks that are marked as launch tasks.
 *
 * @param array $tasks Array of tasks.
 * @return array Array of launch tasks.
 */
function wpcom_launchpad_get_launch_tasks( $tasks ) {
	return array_filter(
		$tasks,
		function ( $task ) {
			if ( isset( $task['isLaunchTask'] ) ) {
				return $task['isLaunchTask'];
			}
			return false;
		}
	);
}

/**
 * Check if all the given tasks are completed.
 *
 * @param array $tasks Array of tasks to check if they are completed.
 * @return bool True if all tasks are completed, false otherwise.
 */
function wpcom_launchpad_are_all_tasks_completed( $tasks ) {
	return array_reduce(
		$tasks,
		function ( $carry, $launch_task ) {
			return $carry && $launch_task['completed'];
		},
		true
	);
}

/**
 * Determine the completion status of a task list based on its tasks.
 *
 * This function identifies any required tasks within the task list. If there are required tasks, the task list is considered complete
 * only if all required tasks are completed. In the absence of required tasks, a secondary check is performed on tasks flagged with
 * "isLaunchTask" to determine completion based on whether all of those tasks are complete. If there are no required tasks and no
 * launch tasks, the task list's completion is determined by checking whether all tasks are complete. However, if there are incomplete
 * tasks in this scenario, the completion status is based on whether the last task was completed. It is possible to control this behavior
 * using a flag, as the default approach might be confusing for task lists where the steps may not be sequential. By default, the task
 * list is marked as incomplete to align with most use cases that focus on user guidance and next steps rather than a specific end goal.
 *
 * @param array $task_list An array of tasks within the task list.
 * @return bool True if the task list is considered complete, false otherwise.
 */
function wpcom_default_launchpad_task_list_completed( $task_list ) {
	$task_list_id      = $task_list['id'];
	$required_task_ids = wpcom_launchpad_checklists()->get_required_task_ids( $task_list_id );
	$all_visible_tasks = wpcom_launchpad_checklists()->build( $task_list_id );

	// If there are required tasks, check if they are all completed.
	if ( ! empty( $required_task_ids ) ) {
		$required_tasks = wpcom_launchpad_get_required_tasks( $required_task_ids, $all_visible_tasks );
		return wpcom_launchpad_are_all_tasks_completed( $required_tasks );
	}

	// If there are no required tasks, check if there are any launch tasks.
	$launch_tasks = wpcom_launchpad_get_launch_tasks( $all_visible_tasks );
	if ( ! empty( $launch_tasks ) ) {
		return wpcom_launchpad_are_all_tasks_completed( $launch_tasks );
	}

	// If there are no required tasks and no launch tasks, check if all tasks are completed.
	if ( wpcom_launchpad_are_all_tasks_completed( $all_visible_tasks ) ) {
		return true;
	}

	// If there are incomplete tasks, check if the last task was completed.
	$require_last_task_completion = wpcom_launchpad_checklists()->get_require_last_task_completion( $task_list_id );
	$last_task                    = end( $all_visible_tasks );
	if ( $require_last_task_completion && $last_task['completed'] ) {
		return true;
	}

	return false;
}

/**
 * Callback to determine the completion status of a task list.
 *
 * @param string $task_list_id The task list ID.
 * @return bool True if the task list is considered complete, false otherwise.
 */
function wpcom_launchpad_is_task_list_completed( $task_list_id ) {
	return wpcom_launchpad_checklists()->is_task_list_completed( $task_list_id );
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

/**
 * The `/rest/v1.1/video-uploads` endpoint operates without calling the `rest_api_switched_to_blog` hook.
 * Which prevents our listeners from being added.
 * This mimics the legacy mu-plugin logic of always adding the listener.
 *
 * @param int $post_id The attachment ID.
 * @return void
 */
function wpcom_hacky_track_video_uploaded_task( $post_id ) {
	if ( get_option( 'site_intent' ) !== 'videopress' ) {
		return;
	}
	if ( get_option( 'launchpad_screen' ) !== 'full' ) {
		return;
	}
	if ( has_action( 'add_attachment', 'wpcom_track_video_uploaded_task' ) ) {
		return;
	}

	wpcom_track_video_uploaded_task( $post_id );
}
add_action( 'add_attachment', 'wpcom_hacky_track_video_uploaded_task' );

//
// Misc other Launchpad-related functionality below.
//

/**
 * A filter for `get_option( 'launchpad_screen' )`
 *
 * @param mixed $value The filterable option value, retrieved from the DB.
 * @return mixed       false if DIFM is active, the unaltered value otherwise.
 */
function wpcom_maybe_disable_for_difm( $value ) {
	// If it's already false I don't care
	if ( $value === false ) {
		return $value;
	}

	// We want to disable for Built By Express aka DIFM, in case they've
	// 1) Entered the Launchpad during signup, then 2) Purchased DIFM
	if ( has_blog_sticker( 'difm-lite-in-progress' ) ) {
		return false;
	}
	// Just in case, always return from a filter!
	return $value;
}
// only WPCOM has blog stickers.
if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	add_filter( 'option_launchpad_screen', 'wpcom_maybe_disable_for_difm' );
}

add_action( 'wp_head', 'wpcom_maybe_preview_with_no_interactions', PHP_INT_MAX );
/**
 * Add CSS that disallows interaction with the Launchpad preview.
 *
 * @return void|string
 */
function wpcom_maybe_preview_with_no_interactions() {
	// phpcs:ignore
	if ( empty( $_GET['do_preview_no_interactions'] ) || $_GET['do_preview_no_interactions'] !== 'true' ) {
		return;
	}

	?>
		<style type="text/css">
				body {
					pointer-events: none !important;
				}
		</style>
	<?php
}

// Temporarily log information to debug intermittent launchpad errors for e2e tests
if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	add_action( 'add_option_launchpad_screen', 'wpcom_log_launchpad_being_enabled_for_test_sites', 10, 2 );
}

/**
 * Logs data when e2eflowtesting5.wordpress.com has launchpad enabled
 *
 * @param string $option The previous option value.
 * @param string $value The new option value.
 * @return void
 */
function wpcom_log_launchpad_being_enabled_for_test_sites( $option, $value ) {
	// e2eflowtesting5.wordpress.com
	if ( get_current_blog_id() !== 208860881 || $value !== 'full' ) {
		return;
	}

	require_once WP_CONTENT_DIR . '/lib/log2logstash/log2logstash.php';
	require_once WP_CONTENT_DIR . '/admin-plugins/wpcom-billing.php';
	$current_plan = WPCOM_Store_API::get_current_plan( get_current_blog_id() );
	$extra        = array(
		'is_free'     => $current_plan['is_free'],
		'site_intent' => get_option( 'site_intent' ),
	);

	log2logstash(
		array(
			'feature' => 'launchpad',
			'message' => 'Launchpad enabled for e2e test site.',
			'extra'   => wp_json_encode( $extra ),
		)
	);
}

/**
 * Checks if the overall launchpad is enabled. Used with `is_enabled_callback`
 * for backwards compatibility with established task lists
 * that relied on the old `launchpad_screen` option.
 *
 * @return bool True if the launchpad is enabled, false otherwise.
 */
function wpcom_launchpad_get_fullscreen_enabled() {
	return wpcom_launchpad_checklists()->is_fullscreen_launchpad_enabled();
}

/**
 * Checks if a specific launchpad task list is enabled.
 *
 * @param string $checklist_slug The slug of the launchpad task list to check.
 * @return bool True if the task list is enabled, false otherwise.
 */
function wpcom_get_launchpad_task_list_is_enabled( $checklist_slug ) {
	if ( false !== $checklist_slug ) {
		return wpcom_launchpad_checklists()->is_task_list_enabled( $checklist_slug );
	}

	return false;
}

/**
 * Checks if a specific task list is dismissed.
 *
 * @param string $checklist_slug The slug of the launchpad task list to check.
 * @return bool True if the task list is dismissed, false otherwise.
 */
function wpcom_launchpad_is_task_list_dismissed( $checklist_slug ) {
	return wpcom_launchpad_checklists()->is_task_list_dismissed( $checklist_slug );
}

/**
 * Sets a specific task list dismissed state.
 *
 * @param string $checklist_slug The slug of the launchpad task list to check.
 * @param bool   $is_dismissed True if the task list is dismissed, false otherwise.
 */
function wpcom_launchpad_set_task_list_dismissed( $checklist_slug, $is_dismissed ) {
	wpcom_launchpad_checklists()->set_task_list_dismissed( $checklist_slug, $is_dismissed );
}

/**
 * Checks if the Keep building task list is enabled.
 *
 * @return bool True if the task list is enabled, false otherwise.
 */
function wpcom_launchpad_is_keep_building_enabled() {
	$intent                  = get_option( 'site_intent', false );
	$launchpad_task_statuses = get_option( 'launchpad_checklist_tasks_statuses', array() );

	// We don't care about the other *_launched tasks, since this is specific to the Build flow.
	$launched = isset( $launchpad_task_statuses['site_launched'] ) && $launchpad_task_statuses['site_launched'];
	$blog_id  = get_current_blog_id();

	if ( 'build' === $intent && $blog_id > 220443356 && $launched ) {
		return true;
	}

	return false;
}

/**
 * Checks if the Blog flow task list is enabled.
 *
 * @return bool True if the task list is enabled, false otherwise.
 */
function wpcom_launchpad_is_intent_write_enabled() {
	return apply_filters( 'is_launchpad_intent_write_enabled', false );
}

/**
 * Checks if the Free Newsletter flow task list is enabled.
 *
 * @return bool True if the task list is enabled, false otherwise.
 */
function wpcom_launchpad_is_free_newsletter_enabled() {
	$intent = get_option( 'site_intent', false );
	if ( 'newsletter' !== $intent ) {
		return false;
	}

	return ! wpcom_has_goal_paid_subscribers() && apply_filters( 'wpcom_launchpad_intent_free_newsletter_enabled', false );
}

/**
 * Checks if the Paid Newsletter flow task list is enabled.
 *
 * @return bool True if the task list is enabled, false otherwise.
 */
function wpcom_launchpad_is_paid_newsletter_enabled() {
	$intent = get_option( 'site_intent', false );
	if ( 'newsletter' !== $intent ) {
		return false;
	}

	return wpcom_has_goal_paid_subscribers() && apply_filters( 'wpcom_launchpad_intent_paid_newsletter_enabled', false );
}

// Unhook our old mu-plugin - this current file is being loaded on 0 priority for `plugins_loaded`.
if ( class_exists( 'WPCOM_Launchpad' ) ) {
	remove_action( 'plugins_loaded', array( WPCOM_Launchpad::get_instance(), 'init' ) );
}

/**
 * Add launchpad options to Jetpack Sync.
 *
 * @param array $allowed_options The allowed options.
 */
function add_launchpad_options_to_jetpack_sync( $allowed_options ) {
	// We are not either in Simple or Atomic
	if ( ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return $allowed_options;
	}

	if ( ! ( new Automattic\Jetpack\Status\Host() )->is_woa_site() ) {
		return $allowed_options;
	}

	if ( ! is_array( $allowed_options ) ) {
		return $allowed_options;
	}

	$launchpad_options = array(
		'site_intent',
		'launchpad_checklist_tasks_statuses',
		'site_goals',
		'sm_enabled',
	);

	return array_merge( $allowed_options, $launchpad_options );
}
add_filter( 'jetpack_sync_options_whitelist', 'add_launchpad_options_to_jetpack_sync', 10, 1 );
