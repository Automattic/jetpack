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

// Type aliases used in a bunch of places in this file. Unfortunately Phan doesn't have a way to set these more globally than copy-pasting them into each file needing them.
<<<PHAN
@phan-type Task_List = array{id:string, task_ids:string[], required_task_ids?:string[], visible_tasks_callback?:callable, require_last_task_completion?:bool, get_title?:callable, is_dismissible?:bool, is_enabled_callback?:callable}
@phan-type Task = array{id:string, title?:string, get_title?:callable, id_map?:string, add_listener_callback?:callable, badge_text_callback?:callable, extra_data_callback?:callable, get_calypso_path?:callable, is_complete_callback?:callable, is_disabled_callback?:callable, isLaunchTask?:bool, is_visible_callback?:callable, target_repetitions?:int, repetition_count_callback?:callable, subtitle?:callable, completed?:bool}
PHAN;

require_once __DIR__ . '/../../utils.php';
require_once __DIR__ . '/class-launchpad-task-lists.php';
require_once __DIR__ . '/launchpad-task-definitions.php';

/**
 * Registers all default launchpad checklists
 *
 * @return Task[]
 */
function wpcom_launchpad_get_task_list_definitions() {
	$core_task_list_definitions = array(
		'build'                   => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
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
		'free'                    => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
			'task_ids'            => array(
				'plan_selected',
				'setup_free',
				'design_completed',
				'domain_upsell',
				'first_post_published',
				'design_edited',
				'site_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'link-in-bio'             => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
			'task_ids'            => array(
				'design_selected',
				'setup_link_in_bio',
				'plan_selected',
				'links_added',
				'link_in_bio_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'link-in-bio-tld'         => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
			'task_ids'            => array(
				'design_selected',
				'setup_link_in_bio',
				'plan_selected',
				'links_added',
				'link_in_bio_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'newsletter'              => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
			'task_ids'            => array(
				'setup_newsletter',
				'plan_selected',
				'verify_email',
				'subscribers_added',
				'migrate_content',
				'set_up_payments',
				'newsletter_plan_created',
				'first_post_published_newsletter',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'videopress'              => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
			'task_ids'            => array(
				'videopress_setup',
				'plan_selected',
				'videopress_upload',
				'videopress_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'write'                   => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
			'task_ids'            => array(
				'setup_write',
				'design_completed',
				'plan_selected',
				'first_post_published',
				'site_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'start-writing'           => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
			'task_ids'            => array(
				'first_post_published',
				'setup_blog',
				'domain_upsell',
				'plan_completed',
				'blog_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'design-first'            => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
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
		'intent-build'            => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
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
		'intent-write'            => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
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
		'intent-free-newsletter'  => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
			'task_ids'            => array(
				'verify_email',
				'share_site',
				'enable_subscribers_modal',
				'manage_subscribers',
				'update_about_page',
				'add_about_page',
			),
			'is_enabled_callback' => 'wpcom_launchpad_is_free_newsletter_enabled',
		),
		'intent-paid-newsletter'  => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
			'task_ids'            => array(
				'verify_email',
				'share_site',
				'set_up_payments',
				'enable_subscribers_modal',
				'manage_subscribers',
				'manage_paid_newsletter_plan',
				'update_about_page',
				'add_about_page',
			),
			'is_enabled_callback' => 'wpcom_launchpad_is_paid_newsletter_enabled',
		),
		'earn'                    => array(
			'task_ids'            => array(
				'stripe_connected',
				'paid_offer_created',
			),
			'is_enabled_callback' => '__return_true',
		),
		'host-site'               => array(
			'task_ids'            => array(
				'site_theme_selected',
				'install_custom_plugin',
				'setup_ssh',
				'verify_email',
				'site_monitoring_page',
				'site_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_is_hosting_flow_enabled',
		),
		'subscribers'             => array(
			'task_ids' => array(
				'import_subscribers',
				'add_subscribe_block',
				'share_site',
			),
		),
		'assembler-first'         => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
			'task_ids'            => array(
				'verify_domain_email',
				'plan_completed',
				'setup_free',
				'design_selected',
				'domain_upsell',
				'first_post_published',
				'design_edited',
				'site_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'readymade-template'      => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
			'task_ids'            => array(
				'verify_domain_email',
				'design_selected',
				'setup_general',
				'generate_content',
				'plan_completed',
				'domain_upsell',
				'design_edited',
				'site_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'ai-assembler'            => array(
			'get_title'           => function () {
				return __( 'Next steps for your site', 'jetpack-mu-wpcom' );
			},
			'task_ids'            => array(
				'verify_domain_email',
				'plan_completed',
				'setup_free',
				'design_selected',
				'domain_upsell',
				'design_edited',
				'site_launched',
			),
			'is_enabled_callback' => 'wpcom_launchpad_get_fullscreen_enabled',
		),
		'legacy-site-setup'       => array(
			'get_title'      => function () {
				return __( 'Site setup', 'jetpack-mu-wpcom' );
			},
			'is_dismissible' => true,
			'task_ids'       => array(
				'woocommerce_setup',
				'sensei_setup',
				'site_title',
				'front_page_updated',
				'verify_domain_email',
				'verify_email',
				'mobile_app_installed',
				'post_sharing_enabled',
				'site_launched',
			),
		),
		'entrepreneur-site-setup' => array(
			'task_ids' => array(
				'woo_customize_store',
				'woo_products',
				'woo_woocommerce_payments',
				'woo_tax',
				'woo_marketing',
				'woo_add_domain',
				'woo_launch_site',
			),
		),
		'post-migration'          => array(
			'get_title' => function () {
				return __( 'Site migration', 'jetpack-mu-wpcom' );
			},
			'task_ids'  => array(
				'migrating_site',
				'review_site',
				'review_plugins',
				'connect_migration_domain',
				'domain_dns_mapped',
				'check_ssl_status',
			),
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
 * @return Task_List
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
 * @return Task_List[]
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
 * @param string      $checklist_slug Checklist slug.
 * @param string|null $launchpad_context Optional. Screen where Launchpad is loading.
 *
 * @return Task[] Collection of tasks for a given checklist
 */
function wpcom_get_launchpad_checklist_by_checklist_slug( $checklist_slug, $launchpad_context = null ) {
	if ( ! $checklist_slug ) {
		return array();
	}

	return wpcom_launchpad_checklists()->build( $checklist_slug, $launchpad_context );
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
 * @param array  $required_task_ids An array of task IDs that are considered required.
 * @param Task[] $tasks An array of tasks to filter.
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
 * @param Task[] $tasks Array of tasks.
 * @return Task[] Array of launch tasks.
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
 * @param Task[] $tasks Array of tasks to check if they are completed.
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
 * @param Task_List $task_list Task list.
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
	if ( has_action( 'add_attachment', 'wpcom_launchpad_track_video_uploaded_task' ) ) {
		return;
	}

	wpcom_launchpad_track_video_uploaded_task( $post_id );
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
 * Checks if the Launchpad is dismissible.
 *
 * @param string $checklist_slug The slug of the launchpad task list to check.
 * @return bool True if the Launchpad is dismissible, false otherwise.
 */
function wpcom_launchpad_is_task_list_dismissible( $checklist_slug ) {
	if ( false === $checklist_slug ) {
		return false;
	}
	return wpcom_launchpad_checklists()->is_task_list_dismissible( $checklist_slug );
}

/**
 * Returns the the temporary dismissed timestamps for a specific task list.
 *
 * @param string $checklist_slug The slug of the launchpad task list to check.
 * @return int The timestamp until which the task list is dismissed.
 */
function wpcom_launchpad_task_list_dismissed_until( $checklist_slug ) {
	return wpcom_launchpad_checklists()->get_task_list_dismissed_until( $checklist_slug );
}

/**
 * Sets a specific task list dismissed state.
 *
 * @param string        $checklist_slug The slug of the launchpad task list to check.
 * @param bool          $is_dismissed True if the task list is dismissed, false otherwise.
 * @param string | null $dismissed_until The date until which the task list is dismissed.
 */
function wpcom_launchpad_set_task_list_dismissed( $checklist_slug, $is_dismissed, $dismissed_until ) {

	if ( isset( $dismissed_until ) ) {
		wpcom_launchpad_checklists()->set_task_list_dismissed_until( $checklist_slug, $dismissed_until );
	} else {
		wpcom_launchpad_checklists()->set_task_list_dismissed( $checklist_slug, $is_dismissed );
	}
}

/**
 * Helper function to indicate whether the Next Steps modal in
 * the Full Site Editor should be hidden.
 *
 * @return bool
 */
function wpcom_launchpad_is_fse_next_steps_modal_hidden() {
	$wpcom_launchpad_config = get_option( 'wpcom_launchpad_config' );

	if ( ! $wpcom_launchpad_config || ! is_array( $wpcom_launchpad_config ) ) {
		return false;
	}

	if ( ! isset( $wpcom_launchpad_config['hide_fse_next_steps_modal'] ) ) {
		return false;
	}

	return true === $wpcom_launchpad_config['hide_fse_next_steps_modal'];
}

/**
 * Helper function to hide and show the Next Steps modal we show in the
 * Full Site Editor.
 *
 * @param bool $should_hide Should the modal be hidden (true) or displayed (false).
 * @return bool Whether the option update succeeded.
 */
function wpcom_launchpad_set_fse_next_steps_modal_hidden( $should_hide ) {
	$wpcom_launchpad_config = get_option( 'wpcom_launchpad_config' );

	// If we want to show the modal, we don't need to do anything if either the main
	// wpcom_launchpad_config option OR the hide sub-option aren't set.
	if ( ! $should_hide ) {
		if ( ! $wpcom_launchpad_config || ! is_array( $wpcom_launchpad_config ) ) {
			return true;
		}

		if ( ! isset( $wpcom_launchpad_config['hide_fse_next_steps_modal'] ) ) {
			return true;
		}

		unset( $wpcom_launchpad_config['hide_fse_next_steps_modal'] );
	} else {
		// Make sure we have an array for the main option.
		if ( ! $wpcom_launchpad_config || ! is_array( $wpcom_launchpad_config ) ) {
			$wpcom_launchpad_config = array();
		}

		// If we already have the option set, we can return early.
		if ( isset( $wpcom_launchpad_config['hide_fse_next_steps_modal'] ) && true === $wpcom_launchpad_config['hide_fse_next_steps_modal'] ) {
			return true;
		}

		$wpcom_launchpad_config['hide_fse_next_steps_modal'] = true;
	}

	if ( empty( $wpcom_launchpad_config ) ) {
		return delete_option( 'wpcom_launchpad_config' );
	}

	return update_option( 'wpcom_launchpad_config', $wpcom_launchpad_config );
}

/**
 * Returns a list of all the checklists that are currently available for the navigator.
 *
 * @return array Array of strings representing the checklist slugs.
 */
function wpcom_launchpad_navigator_get_checklists() {
	$wpcom_launchpad_config = get_option( 'wpcom_launchpad_config', array() );

	if ( ! isset( $wpcom_launchpad_config['navigator_checklists'] ) ) {
		return array();
	}
	$all_checklists  = wpcom_launchpad_checklists()->get_all_task_lists();
	$checklist_slugs = $wpcom_launchpad_config['navigator_checklists'];

	$results = array();
	foreach ( $checklist_slugs as $slug ) {
		if ( ! isset( $all_checklists[ $slug ] ) ) {
			continue;
		}

		$results[ $slug ] = array(
			'slug'  => $slug,
			'title' => $all_checklists[ $slug ]['title'],
		);
	}

	return $results;
}

/**
 * Updates the list of checklists that are currently available for the navigator.
 *
 * @param array $new_checklists Array of strings representing the checklist slugs.
 * @return bool Whether the option update succeeded.
 */
function wpcom_launchpad_navigator_update_checklists( $new_checklists ) {
	if ( ! is_array( $new_checklists ) ) {
		return false;
	}

	$wpcom_launchpad_config = get_option( 'wpcom_launchpad_config', array() );

	$wpcom_launchpad_config['navigator_checklists'] = $new_checklists;

	return update_option( 'wpcom_launchpad_config', $wpcom_launchpad_config );
}

/**
 * Removes a checklist from the list of checklists that are currently available for the navigator.
 *
 * @param string $checklist_slug The slug of the checklist to remove.
 * @return array Array with two values: whether the option update succeeded, and the new active checklist slug.
 */
function wpcom_launchpad_navigator_remove_checklist( $checklist_slug ) {
	$wpcom_launchpad_config = get_option( 'wpcom_launchpad_config', array() );

	if ( ! isset( $wpcom_launchpad_config['navigator_checklists'] ) ) {
		return array(
			'updated'              => false,
			'new_active_checklist' => null,
		);
	}

	$current_active_checklist = wpcom_launchpad_get_active_checklist();

	$checklists = $wpcom_launchpad_config['navigator_checklists'];
	// Find if $checklist_slug is in the checklists array. If it is, remove it.
	$key = array_search( $checklist_slug, $checklists, true );
	if ( $key === false ) {
		return array(
			'updated'              => false,
			'new_active_checklist' => $current_active_checklist,
		);
	}

	unset( $checklists[ $key ] );

	$new_active_checklist = $current_active_checklist;
	if ( $current_active_checklist === $checklist_slug ) {
		// get last item on $checklists array, if there is one; otherwise set to null
		$new_active_checklist = end( $checklists ) ? end( $checklists ) : null;
		wpcom_launchpad_set_current_active_checklist( $new_active_checklist );
	}

	return array(
		'updated'              => wpcom_launchpad_navigator_update_checklists( $checklists ),
		'new_active_checklist' => $new_active_checklist,
	);
}

/**
 * Adds a new checklist to the list of checklists that are currently available for the navigator.
 *
 * @param string $new_checklist_slug The slug of the launchpad task list to add.
 */
function wpcom_launchpad_navigator_add_checklist( $new_checklist_slug ) {
	$wpcom_launchpad_config = get_option( 'wpcom_launchpad_config', array() );
	$checklists             = array();

	if ( isset( $wpcom_launchpad_config['navigator_checklists'] ) ) {
		$checklists = $wpcom_launchpad_config['navigator_checklists'];
	}

	// add the new_checklist_slug to the checklists array if it's not already there.
	if ( ! in_array( $new_checklist_slug, $checklists, true ) ) {
		$checklists[] = $new_checklist_slug;
	}

	wpcom_launchpad_navigator_update_checklists( $checklists );
}

/**
 * Helper function to indicate what's the current active checklist
 * in the context of the navigator.
 * It will try to read the key 'active_checklist_slug' from the 'wpcom_launchpad_config' option.
 *
 * @return string|null The active checklist slug, null if none is set.
 */
function wpcom_launchpad_get_active_checklist() {
	$wpcom_launchpad_config = get_option( 'wpcom_launchpad_config' );

	if ( ! $wpcom_launchpad_config || ! is_array( $wpcom_launchpad_config ) ) {
		return null;
	}

	if ( ! isset( $wpcom_launchpad_config['active_checklist_slug'] ) ) {
		return null;
	}

	return $wpcom_launchpad_config['active_checklist_slug'];
}

/**
 * Helper function to set the current active checklist in the navigator context.
 *
 * @param string $checklist_slug The slug of the launchpad task list to mark as active.
 * @return bool Whether the option update succeeded.
 */
function wpcom_launchpad_set_current_active_checklist( $checklist_slug ) {
	$wpcom_launchpad_config = get_option( 'wpcom_launchpad_config' );

	if ( null !== $checklist_slug ) {
		$checklists = wpcom_launchpad_checklists()->get_all_task_lists();
		if ( ! array_key_exists( $checklist_slug, $checklists ) ) {
			return false;
		}
	}

	if ( ! $wpcom_launchpad_config || ! is_array( $wpcom_launchpad_config ) ) {
		$wpcom_launchpad_config = array();
	}

	if ( null === $checklist_slug ) {
		if ( ! isset( $wpcom_launchpad_config['active_checklist_slug'] ) ) {
			return true;
		}
		unset( $wpcom_launchpad_config['active_checklist_slug'] );
	} else {
		if ( isset( $wpcom_launchpad_config['active_checklist_slug'] ) && $checklist_slug === $wpcom_launchpad_config['active_checklist_slug'] ) {
			return true;
		}
		$wpcom_launchpad_config['active_checklist_slug'] = $checklist_slug;
	}

	$return_value = update_option( 'wpcom_launchpad_config', $wpcom_launchpad_config );
	// add to available checklists if not null
	if ( $checklist_slug !== null ) {
		wpcom_launchpad_navigator_add_checklist( $checklist_slug );
	}

	return $return_value;
}

/**
 * Checks if the Keep building task list is enabled.
 *
 * @return bool True if the task list is enabled, false otherwise.
 */
function wpcom_launchpad_is_keep_building_enabled() {
	$intent  = get_option( 'site_intent', false );
	$blog_id = get_current_blog_id();

	if ( 'build' === $intent && $blog_id > 220443356 ) {
		return true;
	}

	return false;
}

/**
 * Checks if the hosting flow task list is enabled.
 *
 * @return bool True if the task list is enabled, false otherwise.
 */
function wpcom_launchpad_is_hosting_flow_enabled() {
	return apply_filters( 'is_launchpad_intent_hosting_enabled', false );
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

	return ! wpcom_launchpad_has_goal_paid_subscribers() && apply_filters( 'wpcom_launchpad_intent_free_newsletter_enabled', false );
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

	return wpcom_launchpad_has_goal_paid_subscribers() && apply_filters( 'wpcom_launchpad_intent_paid_newsletter_enabled', false );
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

/**
 * Get the title of a checklist by its slug.
 *
 * @param string $checklist_slug The slug of the checklist.
 * @return string The title of the checklist.
 */
function wpcom_get_launchpad_checklist_title_by_checklist_slug( $checklist_slug ) {
	if ( ! $checklist_slug ) {
		return array();
	}

	return wpcom_launchpad_checklists()->get_task_list_title( $checklist_slug );
}

/**
 * Gets a launchpad config option.
 *
 * @param string $option The option to get.
 * @param mixed  $default The default value to return if the option is not set.
 */
function wpcom_get_launchpad_config_option( $option, $default = null ) {
	$wpcom_launchpad_config = get_option( 'wpcom_launchpad_config', array() );

	if ( ! is_array( $wpcom_launchpad_config ) || ! isset( $wpcom_launchpad_config[ $option ] ) ) {
		return $default;
	}

	return $wpcom_launchpad_config[ $option ];
}

/**
 * Sets a launchpad config option.
 *
 * @param string $option The option to set.
 * @param mixed  $value The value to set.
 */
function wpcom_set_launchpad_config_option( $option, $value ) {
	$wpcom_launchpad_config = get_option( 'wpcom_launchpad_config', array() );

	$wpcom_launchpad_config[ $option ] = $value;

	return update_option( 'wpcom_launchpad_config', $wpcom_launchpad_config );
}
