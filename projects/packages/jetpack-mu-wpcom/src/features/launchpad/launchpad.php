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
			'id'                    => 'first_post_published',
			'title'                 => __( 'Write your first post', 'jetpack-mu-wpcom' ),
			'add_listener_callback' => function () {
				add_action( 'publish_post', 'wpcom_track_publish_first_post_task' );
			},
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                    => 'first_post_published_newsletter',
			'title'                 => __( 'Start writing', 'jetpack-mu-wpcom' ),
			'id_map'                => 'first_post_published',
			'add_listener_callback' => function () {
				add_action( 'publish_post', 'wpcom_track_publish_first_post_task' );
			},
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
			'id'                    => 'links_added',
			'title'                 => __( 'Add links', 'jetpack-mu-wpcom' ),
			'id_map'                => 'links_edited',
			'add_listener_callback' => function () {
				add_action( 'load-site-editor.php', 'wpcom_track_edit_site_task' );
			},
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                    => 'link_in_bio_launched',
			'title'                 => __( 'Launch your site', 'jetpack-mu-wpcom' ),
			'id_map'                => 'site_launched',
			'is_disabled_callback'  => 'wpcom_is_link_in_bio_launch_disabled',
			'add_listener_callback' => 'wpcom_add_site_launch_listener',
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
			'id'                    => 'videopress_upload',
			'title'                 => __( 'Upload your first video', 'jetpack-mu-wpcom' ),
			'id_map'                => 'video_uploaded',
			'is_disabled_callback'  => 'wpcom_is_videopress_upload_disabled',
			'add_listener_callback' => function () {
				add_action( 'add_attachment', 'wpcom_track_video_uploaded_task' );
			},
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                    => 'videopress_launched',
			'title'                 => __( 'Launch site', 'jetpack-mu-wpcom' ),
			'id_map'                => 'site_launched',
			'is_disabled_callback'  => 'wpcom_is_videopress_launch_disabled',
			'add_listener_callback' => 'wpcom_add_site_launch_listener',
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
			'id'                    => 'design_edited',
			'title'                 => __( 'Edit site design', 'jetpack-mu-wpcom' ),
			'id_map'                => 'site_edited',
			'add_listener_callback' => function () {
				add_action( 'load-site-editor.php', 'wpcom_track_edit_site_task' );
			},
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                    => 'site_launched',
			'title'                 => __( 'Launch your site', 'jetpack-mu-wpcom' ),
			'isLaunchTask'          => true,
			'add_listener_callback' => 'wpcom_add_site_launch_listener',
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
			'id'                  => 'verify_email',
			'title'               => __( 'Confirm email (check your inbox)', 'jetpack-mu-wpcom' ),
			'is_visible_callback' => 'wpcom_launchpad_is_email_unverified',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                  => 'set_up_payments',
			'title'               => __( 'Set up payment method', 'jetpack-mu-wpcom' ),
			'is_visible_callback' => 'wpcom_has_goal_paid_subscribers',
		)
	);

	wpcom_register_launchpad_task(
		array(
			'id'                  => 'newsletter_plan_created',
			'title'               => __( 'Create paid Newsletter', 'jetpack-mu-wpcom' ),
			'is_visible_callback' => 'wpcom_has_goal_paid_subscribers',
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
				'set_up_payments',
				'newsletter_plan_created',
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

/**
 * Determines whether or not the videopress upload task is enabled
 *
 * @return boolean True if videopress upload task is enabled
 */
function wpcom_is_videopress_upload_disabled() {
	return wpcom_is_checklist_task_complete( 'videopress_upload' );
}

/**
 * Determines whether or not the videopress launch task is enabled
 *
 * @return boolean True if videopress launch task is enabled
 */
function wpcom_is_videopress_launch_disabled() {
	return ! wpcom_is_checklist_task_complete( 'videopress_upload' );
}

/**
 * Determines whether or not the link-in-bio launch task is enabled
 *
 * @return boolean True if link-in-bio launch task is enabled
 */
function wpcom_is_link_in_bio_launch_disabled() {
	return ! wpcom_is_checklist_task_complete( 'links_added' );
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
 * Marks a task as complete.
 *
 * @param string $task_id The task ID.
 * @return bool True if successful, false if not.
 */
function wpcom_mark_launchpad_task_complete( $task_id ) {
	return wpcom_launchpad_checklists()->mark_task_complete( $task_id );
}

/**
 * Marks a task as complete if it is active for this site. This is a bit of a hacky way to be able to share a callback
 * among several tasks, calling several completion IDs from the same callback.
 *
 * @param string $task_id The task ID.
 * @return bool True if successful, false if not.
 */
function wpcom_mark_launchpad_task_complete_if_active( $task_id ) {
	return wpcom_launchpad_checklists()->mark_task_complete_if_active( $task_id );
}

/**
 * Helper function to return a `Launchpad_Task_Lists` instance.
 *
 * @return object Launchpad_Task_Lists instance.
 */
function wpcom_launchpad_checklists() {
	return Launchpad_Task_Lists::get_instance();
}

/*** Update logic callbacks  ***/

/**
 * Callback for completing first post published task.
 *
 * @return void
 */
function wpcom_track_publish_first_post_task() {
	// Ensure that Headstart posts don't mark this as complete
	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return;
	}
	// Since we share the same callback for generic first post and newsletter-specific, we mark both.
	wpcom_mark_launchpad_task_complete_if_active( 'first_post_published' );
	wpcom_mark_launchpad_task_complete_if_active( 'first_post_published_newsletter' );
}

/**
 * Callback for completing edit site task.
 *
 * @return void
 */
function wpcom_track_edit_site_task() {
	wpcom_mark_launchpad_task_complete_if_active( 'links_added' );
	wpcom_mark_launchpad_task_complete_if_active( 'design_edited' );
}

/**
 * Callback that conditionally adds the site launch listener based on platform.
 *
 * @return void
 */
function wpcom_add_site_launch_listener() {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		add_action( 'wpcom_site_launched', 'wpcom_track_site_launch_task' );
	} else {
		add_action( 'update_option_blog_public', 'wpcom_launch_task_listener_atomic', 10, 2 );
	}
}

/**
 * Callback that fires when `blog_public` is updated.
 *
 * @param string $old_value The updated option value.
 * @param string $new_value The previous option value.
 * @return void
 */
function wpcom_launch_task_listener_atomic( $old_value, $new_value ) {
	$blog_public = (int) $new_value;
	// 'blog_public' is set to '1' when a site is launched.
	if ( $blog_public === 1 ) {
		wpcom_track_site_launch_task();
	}
}

/**
 * Callback for completing site launched task.
 *
 * @return void
 */
function wpcom_track_site_launch_task() {
	// it would be ideal if the registry was smart enough to map based on id_map but it isn't.
	// So we mark them all. We'd avoid this if we had dedicated callbacks for each task.
	wpcom_mark_launchpad_task_complete_if_active( 'site_launched' );
	wpcom_mark_launchpad_task_complete_if_active( 'link_in_bio_launched' );
	wpcom_mark_launchpad_task_complete_if_active( 'videopress_launched' );
}

/**
 * Update Launchpad's video_uploaded task.
 *
 * Only updated for videopress flows currently.
 *
 * @param string $post_id The id of the post being udpated.
 * @return void
 */
function wpcom_track_video_uploaded_task( $post_id ) {
	// Not using `wp_attachment_is` because it requires the actual file
	// which is not the case for Atomic VideoPress.
	if ( 0 !== strpos( get_post_mime_type( $post_id ), 'video/' ) ) {
		return;
	}
	wpcom_mark_launchpad_task_complete( 'videopress_upload' );
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

/**
 * Callback for email verification visibility.
 *
 * @return bool True if email is unverified, false otherwise.
 */
function wpcom_launchpad_is_email_unverified() {
	// TODO: handle the edge case where an Atomic user can be unverified.
	if ( ! class_exists( 'Email_Verification' ) ) {
		return false;
	}

	return Email_Verification::is_email_unverified();
}

/**
 * If the site has a paid-subscriber goal.
 *
 * @return bool True if the site has a paid-subscriber goal, false otherwise.
 */
function wpcom_has_goal_paid_subscribers() {
	return in_array( 'paid-subscribers', get_option( 'site_goals', array() ), true );
}

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

// Unhook our old mu-plugin - this current file is being loaded on 0 priority for `plugins_loaded`.
if ( class_exists( 'WPCOM_Launchpad' ) ) {
	remove_action( 'plugins_loaded', array( WPCOM_Launchpad::get_instance(), 'init' ) );
}
