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
 * 
 * @return array
 */
function wpcom_launchpad_get_task_list_definitions() {
	$core_task_list_definitions = array(
		'build' => array(
			'title'    => 'Build',
			'task_ids' => array(
				'setup_general',
				'design_selected',
				'plan_selected',
				'first_post_published',
				'design_edited',
				'site_launched',
			),
		),
		'free' => array(
			'title'    => 'Free',
			'task_ids' => array(
				'plan_selected',
				'setup_free',
				'design_selected',
				'domain_upsell',
				'first_post_published',
				'design_edited',
				'site_launched',
			),
		),
		'link-in-bio' => array(
			'title'    => 'Link In Bio',
			'task_ids' => array(
				'design_selected',
				'setup_link_in_bio',
				'plan_selected',
				'links_added',
				'link_in_bio_launched',
			),
		),
		'link-in-bio-tld' => array(
			'title'    => 'Link In Bio',
			'task_ids' => array(
				'design_selected',
				'setup_link_in_bio',
				'plan_selected',
				'links_added',
				'link_in_bio_launched',
			),
		),
		'newsletter' => array(
			'title'    => 'Newsletter',
			'task_ids' => array(
				'setup_newsletter',
				'plan_selected',
				'subscribers_added',
				'verify_email',
				'set_up_payments',
				'newsletter_plan_created',
				'first_post_published_newsletter',
			),
		),
		'videopress' => array(
			'title'    => 'Videopress',
			'task_ids' => array(
				'videopress_setup',
				'plan_selected',
				'videopress_upload',
				'videopress_launched',
			),
		),
		'write' => array(
			'title'    => 'Write',
			'task_ids' => array(
				'setup_write',
				'design_selected',
				'plan_selected',
				'first_post_published',
				'site_launched',
			),
		),
		'start-writing' => array(
			'title'    => 'Start Writing',
			'task_ids' => array(
				'first_post_published',
				'setup_blog',
				'domain_upsell',
				'plan_completed',
				'blog_launched',
			),
		),
		'design-first' => array(
			'title'    => 'Pick a Design',
			'task_ids' => array(
				'design_selected',
				'setup_blog',
				'domain_upsell',
				'plan_completed',
				'first_post_published',
				'blog_launched',
			),
		),
		'keep-building' => array(
			'title'               => 'Keep Building',
			'task_ids'            => array(
				'design_edited',
				// @todo Add more tasks here!
			),
			'is_enabled_callback' => '__return_false',
		),
	);
 
	$extended_task_list_definitions = apply_filters( 'wpcom_launchpad_extended_task_list_definitions', array() );
 
	// As for tasks, we can decide what overrides we allow later.
	return array_merge( $extended_task_list_definitions, $core_task_list_definitions );
}

/**
 * Get a task list, falling back to site_intent option if no checklist slug is provided.
 * 
 * @param string $checklist_slug
 * 
 * @return array
 */
function wpcom_launchpad_get_task_list( $checklist_slug = null ) {
	$task_list_definitions = wpcom_launchpad_get_task_list_definitions();
	
	// If we don't have a checklist slug, fall back to the site intent.
	$checklist_slug = $checklist_slug ? $checklist_slug : get_option( 'site_intent' );
	if ( ! $checklist_slug ) {
		return array();
	}

	// If the checklist slug isn't defined, return an empty array.
	if ( ! isset( $task_list_definitions[ $checklist_slug ] ) ) {
		return array();
	}

	return $task_list_definitions[ $checklist_slug ];
}

/**
 * Register all tasks and task lists from definitions
 * 
 * @param bool $rebuild Whether to rebuild the task lists or not
 * 
 * @return array
 */
function wpcom_launchpad_get_task_lists( $rebuild = false ) {
	// If we already have task lists registered and we don't want to rebuild, return all task lists.
	if ( ! $rebuild && $launchpad_instance->has_task_lists() ) {
		return wpcom_launchpad_checklists()->get_all_task_lists();
	}

	require_once( dirname( __FILE__ ) . '/launchpad-task-definitions.php' );
 
	$task_definitions = wpcom_launchpad_get_task_definitions();
 
	// Register all tasks
	foreach ( $task_definitions as $task_id => $task_definition ) {
		$task_data = array_merge( $task_definition, array( 'id' => $task_id ) );
		wpcom_register_launchpad_task( $task_data );
	}
 
	$task_list_definitions = wpcom_launchpad_get_task_list_definitions();
 
	// Register all task lists
	foreach ( $task_list_definitions as $task_list_id => $task_list_definition ) {
		$task_list_data = array_merge( $task_list_definition, array( 'id' => $task_list_id ) );
		wpcom_register_launchpad_task_list( $task_list_data );
	}
 
	// Assuming the reference is good, just return all checklists
	return wpcom_launchpad_checklists()->get_all_task_lists();
}

function wpcom_register_default_launchpad_checklists() {
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
function wpcom_get_launchpad_is_enabled() {
	return wpcom_launchpad_checklists()->is_launchpad_enabled();
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
 * Checks if the Keep building task list is enabled.
 *
 * This function uses the `is_launchpad_keep_building_enabled` filter to allow for overriding the
 * default value.
 *
 * @return bool True if the task list is enabled, false otherwise.
 */
function wpcom_launchpad_is_keep_building_enabled() {
	return apply_filters( 'is_launchpad_keep_building_enabled', false );
}

// Unhook our old mu-plugin - this current file is being loaded on 0 priority for `plugins_loaded`.
if ( class_exists( 'WPCOM_Launchpad' ) ) {
	remove_action( 'plugins_loaded', array( WPCOM_Launchpad::get_instance(), 'init' ) );
}
