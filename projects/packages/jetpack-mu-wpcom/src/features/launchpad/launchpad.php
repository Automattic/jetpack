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
 * Determine if site was started via Newsletter flow.
 *
 * @return bool
 */
function is_newsletter_flow() {
	return get_option( 'site_intent' ) === 'newsletter';
}

/**
 * Determine if site was started via Link in Bio flow.
 *
 * @return bool
 */
function is_link_in_bio_flow() {
	return get_option( 'site_intent' ) === 'link-in-bio';
}

/**
 * Determine if site was started via Newsletter flow.
 *
 * @return bool
 */
function is_podcast_flow() {
	return get_option( 'site_intent' ) === 'podcast';
}

/**
 * Determine if site was started via Videopress flow.
 *
 * @return bool
 */
function is_videopress_flow() {
	return get_option( 'site_intent' ) === 'videopress';
}

/**
 * Determine if site was started via Free flow.
 *
 * @return bool
 */
function is_free_flow() {
	return get_option( 'site_intent' ) === 'free';
}

/**
 * Determine if site was started via a general onbaording flow.
 *
 * @return bool
 */
function is_general_flow() {
	$intent = get_option( 'site_intent' );
	return 'write' === $intent || 'build' === $intent;
}

/**
 * Returns the list of tasks by flow or checklist id.
 *
 * @return array Associative array with checklist task data
 */
function get_checklist_definitions() {
	return array(
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
		),
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
		),
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
		),
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
		),
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
		),
		array(
			'id'       => 'videopress',
			'title'    => 'Videopress',
			'task_ids' => array(
				'videopress_setup',
				'plan_selected',
				'videopress_upload',
				'videopress_launched',
			),
		),
		array(
			'id'       => 'write',
			'title'    => 'Write',
			'task_ids' => array(
				'setup_write',
				'design_selected',
				'first_post_published',
				'site_launched',
			),
		),
	);
}

/**
 * Determines whether or not design selected task is enabled
 *
 * @return boolean True if design selected task is enabled
 */
function can_update_design_selected_task() {
	$site_intent = get_option( 'site_intent' );
	return $site_intent === 'free' || $site_intent === 'build' || $site_intent === 'write';
}

/**
 * Determines whether or not domain upsell task is completed
 *
 * @return boolean True if domain upsell task is completed
 */
function is_domain_upsell_completed() {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		if ( class_exists( '\WPCOM_Store_API' ) ) {
			$plan = \WPCOM_Store_API::get_current_plan( \get_current_blog_id() );
			return ! $plan['is_free'] || get_checklist_task( 'domain_upsell_deferred' );
		}
	}

	return get_checklist_task( 'domain_upsell_deferred' );
}

/**
 * Returns the subtitle for the plan selected task
 *
 * @return string Subtitle text
 */
function get_plan_selected_subtitle() {
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
function get_domain_upsell_badge_text() {
	return is_domain_upsell_completed() ? '' : __( 'Upgrade plan', 'jetpack-mu-wpcom' );
}

/**
 * Returns the checklist task definitions.
 *
 * @return array Associative array with checklist task data
 */
function get_task_definitions() {
	return array(
		array(
			'id'        => 'setup_newsletter',
			'title'     => __( 'Personalize newsletter', 'jetpack-mu-wpcom' ),
			'completed' => true,
			'disabled'  => false,
		),
		array(
			'id'        => 'plan_selected',
			'title'     => __( 'Choose a plan', 'jetpack-mu-wpcom' ),
			'subtitle'  => get_plan_selected_subtitle(),
			'completed' => true,
			'disabled'  => false,
		),
		array(
			'id'        => 'subscribers_added',
			'title'     => __( 'Add subscribers', 'jetpack-mu-wpcom' ),
			'completed' => true,
			'disabled'  => false,
		),
		array(
			'id'        => 'first_post_published',
			'title'     => __( 'Write your first post', 'jetpack-mu-wpcom' ),
			'completed' => false,
			'disabled'  => false,
		),
		array(
			'id'        => 'first_post_published_newsletter',
			'title'     => __( 'Start writing', 'jetpack-mu-wpcom' ),
			'completed' => false,
			'disabled'  => false,
		),
		array(
			'id'        => 'design_selected',
			'title'     => __( 'Select a design', 'jetpack-mu-wpcom' ),
			'completed' => true,
			'disabled'  => ! can_update_design_selected_task(),
		),
		array(
			'id'        => 'setup_link_in_bio',
			'title'     => __( 'Personalize Link in Bio', 'jetpack-mu-wpcom' ),
			'completed' => true,
			'disabled'  => false,
		),
		array(
			'id'        => 'links_added',
			'title'     => __( 'Add links', 'jetpack-mu-wpcom' ),
			'completed' => false,
			'disabled'  => false,
		),
		array(
			'id'        => 'link_in_bio_launched',
			'title'     => __( 'Launch your site', 'jetpack-mu-wpcom' ),
			'completed' => false,
			'disabled'  => ! get_checklist_task( 'links_edited' ),
		),
		array(
			'id'        => 'videopress_setup',
			'title'     => __( 'Set up your video site', 'jetpack-mu-wpcom' ),
			'completed' => true,
			'disabled'  => false,
		),
		array(
			'id'        => 'videopress_upload',
			'title'     => __( 'Upload your first video', 'jetpack-mu-wpcom' ),
			'completed' => false,
			'disabled'  => get_checklist_task( 'video_uploaded' ),
		),
		array(
			'id'        => 'videopress_launched',
			'title'     => __( 'Launch site', 'jetpack-mu-wpcom' ),
			'completed' => false,
			'disabled'  => ! get_checklist_task( 'video_uploaded' ),
		),
		array(
			'id'        => 'setup_free',
			'title'     => __( 'Personalize your site', 'jetpack-mu-wpcom' ),
			'completed' => true,
			'disabled'  => false,
		),
		array(
			'id'        => 'setup_general',
			'title'     => __( 'Set up your site', 'jetpack-mu-wpcom' ),
			'completed' => true,
			'disabled'  => true,
		),
		array(
			'id'        => 'design_edited',
			'title'     => __( 'Edit site design', 'jetpack-mu-wpcom' ),
			'completed' => false,
			'disabled'  => false,
		),
		array(
			'id'           => 'site_launched',
			'title'        => __( 'Launch your site', 'jetpack-mu-wpcom' ),
			'completed'    => false,
			'disabled'     => false,
			'isLaunchTask' => true,
		),
		array(
			'id'        => 'setup_write',
			'title'     => __( 'Set up your site', 'jetpack-mu-wpcom' ),
			'completed' => true,
			'disabled'  => true,
		),
		array(
			'id'         => 'domain_upsell',
			'title'      => __( 'Choose a domain', 'jetpack-mu-wpcom' ),
			'completed'  => false,
			'disabled'   => false,
			'badge_text' => get_domain_upsell_badge_text(),
		),
		array(
			'id'        => 'verify_email',
			'title'     => __( 'Confirm email (check your inbox)', 'jetpack-mu-wpcom' ),
			'completed' => false,
			'disabled'  => true,
		),
	);
}

/**
 * Returns launchpad checklist task by task id.
 *
 * @param string $task Task id.
 *
 * @return array Associative array with task data
 *               or false if task id is not found.
 */
function get_checklist_task( $task ) {
	$launchpad_checklist_tasks_statuses_option = get_option( 'launchpad_checklist_tasks_statuses' );
	if ( is_array( $launchpad_checklist_tasks_statuses_option ) && isset( $launchpad_checklist_tasks_statuses_option[ $task ] ) ) {
			return $launchpad_checklist_tasks_statuses_option[ $task ];
	}

	return false;
}

/**
 * Update a Launchpad task status.
 * Note: We store all launchpad checklist task statuses in one option, 'launchpad_checklist_tasks_statuses'.
 *
 * @param string $task The name of the task being updated.
 * @param string $value The new value.
 * @return void
 */
function update_checklist_task( $task, $value ) {
	$launchpad_checklist_tasks_statuses_option = get_option( 'launchpad_checklist_tasks_statuses' );
	if ( ! is_array( $launchpad_checklist_tasks_statuses_option ) ) {
		$launchpad_checklist_tasks_statuses_option = array( $task => $value );
	} else {
		$launchpad_checklist_tasks_statuses_option[ $task ] = $value;
	}
	update_option( 'launchpad_checklist_tasks_statuses', $launchpad_checklist_tasks_statuses_option );
}

/**
 * Returns launchpad checklist by checklist slug.
 *
 * @param string $checklist_slug Checklist slug.
 *
 * @return Task[] Collection of tasks for a given checklist
 */
function get_launchpad_checklist_by_checklist_slug( $checklist_slug ) {
	if ( ! $checklist_slug ) {
		return array();
	}

	$launchpad_task_lists = Launchpad_Task_Lists::get_instance();
	return $launchpad_task_lists->build( $checklist_slug );
}

// TODO: Write code p2 post or dotcom post
/**
 * Wrapper that registers a launchpad checklist.
 *
 * @param Task_List $task_list Task list definition.
 *
 * @return bool True if successful, false otherwise.
 */
function register_launchpad_task_list( $task_list ) {
	$launchpad_task_lists = Launchpad_Task_Lists::get_instance();
	return $launchpad_task_lists->register_task_list( $task_list );
}

/**
 * Wrapper that registers a launchpad checklist.
 *
 * @param Task $tasks Collection of Task definitions.
 *
 * @return bool True if successful, false otherwise.
 */
function register_launchpad_tasks( $tasks ) {
	$launchpad_task_lists = Launchpad_Task_Lists::get_instance();
	return $launchpad_task_lists->register_tasks( $tasks );
}

/**
 * Wrapper that registers a launchpad checklist.
 *
 * @param Task $task Task definition.
 *
 * @return bool True if successful, false otherwise.
 */
function register_launchpad_task( $task ) {
	$launchpad_task_lists = Launchpad_Task_Lists::get_instance();
	return $launchpad_task_lists->register_task( $task );
}

/**
 * Registers all default launchpad checklists
 */
function register_default_checklists() {
	foreach ( get_checklist_definitions() as $checklist ) {
		register_launchpad_task_list( $checklist );
	}

	register_launchpad_tasks( get_task_definitions() );
}

/**
 * Add CSS that disallows interaction with the Launchpad preview.
 *
 * @return void|string
 */
function maybe_preview_with_no_interactions() {
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

/**
 * Update Launchpad's site_edited or links_edited tasks to true.
 *
 * This will currently run whenever a user visites the Site Editor.
 * For generic flows (currently just Free Flow), we set site_edited to true.
 * For Link in Bio flows, we set links_edited to true.
 *
 * The site_edited and links_edited options effectively track the same thing.
 * We are keeping them separate in case the different use cases eventually
 * require different handling, and to avoid complexity for existing link in bio
 * sites with links_edited already set.
 *
 * @return void
 */
function track_edit_site_task() {
	if ( is_link_in_bio_flow() && should_update_tasks() ) {
		if ( ! get_checklist_task( 'links_edited' ) ) {
			update_checklist_task( 'links_edited', true );
		}
	}

	if ( is_free_flow() && should_update_tasks() ) {
		if ( ! get_checklist_task( 'site_edited' ) ) {
			update_checklist_task( 'site_edited', true );
		}
	}

	if ( is_general_flow() && should_update_tasks() ) {
		if ( ! get_checklist_task( 'site_edited' ) ) {
			update_checklist_task( 'site_edited', true );
		}
	}
}

/**
 * We should only update Launchpad tasks if launchpad has been enabled, and is not yet complete.
 *
 * @return bool
 */
function should_update_tasks() {
	$has_launchpad_been_enabled   = in_array( get_option( 'launchpad_screen' ), array( 'off', 'minimized', 'full' ), true );
	$has_launchpad_been_completed = get_option( 'launchpad_screen' ) === 'off';

	return $has_launchpad_been_enabled && ! $has_launchpad_been_completed;
}

/**
 * Update Launchpad's video_uploaded task.
 *
 * Only updated for videopress flows currently.
 *
 * @param string $post_id The id of the post being udpated.
 * @return void
 */
function track_video_uploaded_task( $post_id ) {
	if ( ! is_videopress_flow() ) {
		return;
	}

	// Not using `wp_attachment_is` because it requires the actual file
	// which is not the case for Atomic VideoPress.
	if ( 0 !== strpos( get_post_mime_type( $post_id ), 'video/' ) ) {
		return;
	}

	if ( should_update_tasks() && ! get_checklist_task( 'video_uploaded' ) ) {
		update_checklist_task( 'video_uploaded', true );
	}
}

/**
 * Update Launchpad's site_launched task
 *
 * We only update this task for flows with a site launch task.
 * Some flows have tasks that must be completed prior to site launch.
 * So we also only update the launch task if/when those tasks
 * are already complete.
 *
 * When this task is updated to true, we also turn off Launchpad (it is complete).
 *
 * @return void
 */
function track_site_launch_task() {
	if ( ! is_link_in_bio_flow() && ! is_videopress_flow() && ! is_free_flow() && ! is_general_flow() ) {
		return;
	}

	if ( ! should_update_tasks() ) {
		return;
	}

	$is_link_in_bio_flow_ready_to_launch = is_link_in_bio_flow() && get_checklist_task( 'links_edited' );
	$is_videopress_flow_ready_to_launch  = is_videopress_flow() && get_checklist_task( 'video_uploaded' );
	$is_free_flow_ready_to_launch        = is_free_flow();
	$is_general_flow_ready_to_launch     = is_general_flow();

	$is_site_ready_to_launch = $is_link_in_bio_flow_ready_to_launch || $is_videopress_flow_ready_to_launch || $is_free_flow_ready_to_launch || $is_general_flow_ready_to_launch;

	if ( $is_site_ready_to_launch ) {
		if ( ! get_checklist_task( 'site_launched' ) ) {
			update_checklist_task( 'site_launched', true );
		}

		update_option( 'launchpad_screen', 'off' );
	}
}

/**
 * Action that fires when `blog_public` is updated.
 *
 * @param string $old_value The updated option value.
 * @param string $new_value The previous option value.
 * @return void
 */
function maybe_track_site_launch( $old_value, $new_value ) {
	$blog_public = (int) $new_value;
	// 'blog_public' is set to '1' when a site is launched.
	if ( $blog_public === 1 ) {
		track_site_launch_task();
	}
}

/**
 * A filter for `get_option( 'launchpad_screen' )`
 *
 * @param mixed $value The filterable option value, retrieved from the DB.
 * @return mixed       false if DIFM is active, the unaltered value otherwise.
 */
function maybe_disable_for_difm( $value ) {
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

/**
 * Update Launchpad's first_post_published task to true.
 *
 * @return void
 */
function mark_publish_first_post_task_as_complete() {
	if ( ! get_checklist_task( 'first_post_published' ) ) {
		update_checklist_task( 'first_post_published', true );
	}
}

/**
 * Only update first_post_pubished task under specific conditions.
 * Also turn launchpad_screen optoin off when this task is completed for Newsletters.
 *
 * @return void
 */
function track_publish_first_post_task() {
	// Ensure that Headstart posts don't mark this as complete
	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return;
	}

	if ( is_newsletter_flow() && should_update_tasks() ) {
		mark_publish_first_post_task_as_complete();
		update_option( 'launchpad_screen', 'off' );
	}

	if ( is_free_flow() && should_update_tasks() ) {
		mark_publish_first_post_task_as_complete();
	}

	if ( is_general_flow() && should_update_tasks() ) {
		mark_publish_first_post_task_as_complete();
	}
}

/**
 * Logs data when e2eflowtesting5.wordpress.com has launchpad enabled.
 *
 * @param string $option The updated option value.
 * @param string $value The previous option value.
 * @return void
 */
function log_launchpad_being_enabled_for_test_sites( $option, $value ) {
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

add_action( 'init', 'register_default_checklists' );
add_action( 'load-site-editor.php', 'track_edit_site_task', 10 );
add_action( 'wp_head', 'maybe_preview_with_no_interactions', PHP_INT_MAX );
add_action( 'publish_post', 'track_publish_first_post_task', 10 );
add_action( 'wpcom_site_launched', 'track_site_launch_task', 10 );
add_action( 'add_attachment', 'track_video_uploaded_task', 10, 1 );
// Atomic Only
if ( ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
	add_action( 'update_option_blog_public', 'maybe_track_site_launch', 10, 2 );
} else {
	// WPCOM only - relies on blog stickers
	add_filter( 'option_launchpad_screen', 'maybe_disable_for_difm' );
}
// Temporarily log information to debug intermittent launchpad errors for e2e tests
if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	add_action( 'add_option_launchpad_screen', 'log_launchpad_being_enabled_for_test_sites', 10, 2 );
}
