<?php
/**
 * Launchpad: Task definitions and helpers
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Get the task definitions for the Launchpad.
 *
 * @return array
 */
function wpcom_launchpad_get_task_definitions() {
	$task_definitions = array(
		// Core tasks.
		'design_edited'                   => array(
			'get_title'             => function () {
				return __( 'Edit site design', 'jetpack-mu-wpcom' );
			},
			'id_map'                => 'site_edited',
			'add_listener_callback' => function () {
				add_action( 'load-site-editor.php', 'wpcom_track_edit_site_task' );
			},
			'get_calypso_path'      => function ( $task, $default, $data ) {
				return '/site-editor/' . $data['site_slug_encoded'];
			},
		),
		// design_completed checks for task completion while design_selected always returns true.
		'design_completed'                => array(
			'get_title'            => function () {
				return __( 'Select a design', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
		),
		'design_selected'                 => array(
			'get_title'            => function () {
				return __( 'Select a design', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => '__return_true',
			'is_disabled_callback' => 'wpcom_is_design_step_enabled',
		),
		'domain_claim'                    => array(
			'get_title'            => function () {
				return __( 'Claim your free one-year domain', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_domain_claim_completed',
			'is_visible_callback'  => 'wpcom_domain_claim_is_visible_callback',
			'get_task_url'         => function ( $task, $default, $data ) {
				return '/domains/add/' . $data['site_slug_encoded'];
			},
		),
		'domain_upsell'                   => array(
			'id_map'               => 'domain_upsell_deferred',
			'get_title'            => function () {
				return __( 'Choose a domain', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_domain_upsell_completed',
			'badge_text_callback'  => 'wpcom_get_domain_upsell_badge_text',
			'is_visible_callback'  => 'wpcom_is_domain_upsell_task_visible',
			'get_task_url'         => function ( $task, $default, $data ) {
				return '/domains/add/' . $data['site_slug_encoded'];
			},
		),
		'first_post_published'            => array(
			'get_title'             => function () {
				return __( 'Write your first post', 'jetpack-mu-wpcom' );
			},
			'add_listener_callback' => function () {
				add_action( 'publish_post', 'wpcom_track_publish_first_post_task' );
			},
			'get_calypso_path'      => function ( $task, $default, $data ) {
				return '/post/' . $data['site_slug_encoded'];
			},
		),
		'plan_completed'                  => array(
			'get_title'            => function () {
				return __( 'Choose a plan', 'jetpack-mu-wpcom' );
			},
			'subtitle'             => 'wpcom_get_plan_completed_subtitle', // This callback doesn't seem to exist.
			'is_complete_callback' => 'wpcom_is_task_option_completed',
		),
		'plan_selected'                   => array(
			'get_title'            => function () {
				return __( 'Choose a plan', 'jetpack-mu-wpcom' );
			},
			'subtitle'             => 'wpcom_get_plan_selected_subtitle',
			'is_complete_callback' => '__return_true',
			'badge_text_callback'  => 'wpcom_get_plan_selected_badge_text',
		),
		'setup_general'                   => array(
			'get_title'            => function () {
				return __( 'Set up your site', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => '__return_true',
			'is_disabled_callback' => '__return_true',
		),
		'site_launched'                   => array(
			'get_title'             => function () {
				return __( 'Launch your site', 'jetpack-mu-wpcom' );
			},
			'isLaunchTask'          => true,
			'add_listener_callback' => 'wpcom_add_site_launch_listener',
			'get_task_url'          => function ( $task, $default, $data ) {
				return '/settings/general/' . $data['site_slug_encoded'] . '#site-privacy-settings';
			},
		),
		'verify_email'                    => array(
			'get_title'           => function () {
				return __( 'Verify email address', 'jetpack-mu-wpcom' );
			},
			'is_visible_callback' => 'wpcom_launchpad_is_email_unverified',
			'get_task_url'        => function () {
				return '/me/account';
			},
		),

		// Newsletter pre-launch tasks.
		'first_post_published_newsletter' => array(
			'id_map'                => 'first_post_published',
			'get_title'             => function () {
				return __( 'Start writing', 'jetpack-mu-wpcom' );
			},
			'add_listener_callback' => function () {
				add_action( 'publish_post', 'wpcom_track_publish_first_post_task' );
			},
			'get_calypso_path'      => function ( $task, $default, $data ) {
				return '/post/' . $data['site_slug_encoded'];
			},
		),
		'newsletter_plan_created'         => array(
			'get_title'           => function () {
				return __( 'Create paid Newsletter', 'jetpack-mu-wpcom' );
			},
			'is_visible_callback' => 'wpcom_has_goal_paid_subscribers',
		),
		'setup_newsletter'                => array(
			'id'                   => 'setup_newsletter',
			'get_title'            => function () {
				return __( 'Personalize newsletter', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => '__return_true',
		),
		'set_up_payments'                 => array(
			'get_title'           => function () {
				return __( 'Set up payment method', 'jetpack-mu-wpcom' );
			},
			'is_visible_callback' => 'wpcom_has_goal_paid_subscribers',
			'get_calypso_path'    => function ( $task, $default, $data ) {
				if ( function_exists( 'get_memberships_connected_account_redirect' ) ) {
					return get_memberships_connected_account_redirect(
						get_current_user_id(),
						get_current_blog_id()
					);
				}
				return '/earn/payments/' . $data['site_slug_encoded'];
			},
		),
		'subscribers_added'               => array(
			'get_title'            => function () {
				return __( 'Add subscribers', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_has_goal_import_subscribers',
		),
		'migrate_content'                 => array(
			'get_title'            => function () {
				return __( 'Migrate content', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_has_goal_import_subscribers',
		),

		// Link in bio tasks.
		'link_in_bio_launched'            => array(
			'get_title'             => function () {
				return __( 'Launch your site', 'jetpack-mu-wpcom' );
			},
			'id_map'                => 'site_launched',
			'is_disabled_callback'  => 'wpcom_is_link_in_bio_launch_disabled',
			'add_listener_callback' => 'wpcom_add_site_launch_listener',
		),
		'links_added'                     => array(
			'get_title'             => function () {
				return __( 'Add links', 'jetpack-mu-wpcom' );
			},
			'id_map'                => 'links_edited',
			'add_listener_callback' => function () {
				add_action( 'load-site-editor.php', 'wpcom_track_edit_site_task' );
			},
			'get_calypso_path'      => function ( $task, $default, $data ) {
				return '/site-editor/' . $data['site_slug_encoded'];
			},
		),
		'setup_link_in_bio'               => array(
			'get_title'            => function () {
				return __( 'Personalize Link in Bio', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => '__return_true',
		),

		// Videopress tasks.
		'videopress_launched'             => array(
			'id_map'                => 'site_launched',
			'get_title'             => function () {
				return __( 'Launch site', 'jetpack-mu-wpcom' );
			},
			'is_disabled_callback'  => 'wpcom_is_videopress_launch_disabled',
			'add_listener_callback' => 'wpcom_add_site_launch_listener',
		),
		'videopress_setup'                => array(
			'get_title'            => function () {
				return __( 'Set up your video site', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => '__return_true',
		),
		'videopress_upload'               => array(
			'id_map'                => 'video_uploaded',
			'get_title'             => function () {
				return __( 'Upload your first video', 'jetpack-mu-wpcom' );
			},
			'is_disabled_callback'  => 'wpcom_is_videopress_upload_disabled',
			'add_listener_callback' => function () {
				add_action( 'add_attachment', 'wpcom_track_video_uploaded_task' );
			},
		),

		// Blog tasks.
		'blog_launched'                   => array(
			'get_title'             => function () {
				return __( 'Launch your blog', 'jetpack-mu-wpcom' );
			},
			'isLaunchTask'          => true,
			'add_listener_callback' => 'wpcom_add_site_launch_listener',
		),
		'setup_blog'                      => array(
			'get_title'            => function () {
				return __( 'Name your blog', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
		),

		// Free plan tasks.
		'setup_free'                      => array(
			'get_title'            => function () {
				return __( 'Personalize your site', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => '__return_true',
		),

		// Write tasks.
		'setup_write'                     => array(
			'get_title'            => function () {
				return __( 'Set up your site', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => '__return_true',
			'is_disabled_callback' => '__return_true',
		),

		// Keep Building tasks.
		'site_title'                      => array(
			'get_title'            => function () {
				return __( 'Give your site a name', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/settings/general/' . $data['site_slug_encoded'];
			},
		),

		'drive_traffic'                   => array(
			'get_title'            => function () {
				return __( 'Drive traffic to your site', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/marketing/connections/' . $data['site_slug_encoded'];
			},
		),

		'add_new_page'                    => array(
			'get_title'            => function () {
				return __( 'Add a new page', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/page/' . $data['site_slug_encoded'];
			},
		),

		'update_about_page'               => array(
			'get_title'            => function () {
				return __( 'Update your About page', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_is_update_about_page_task_visible',
			'extra_data_callback'  => function () {
				return array(
					'about_page_id' => wpcom_get_site_about_page_id(),
				);
			},
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/page/' . $data['site_slug_encoded'] . '/' . wpcom_get_site_about_page_id();
			},
		),

		'edit_page'                       => array(
			'get_title'            => function () {
				return __( 'Edit a page', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_is_edit_page_task_visible',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/pages/' . $data['site_slug_encoded'];
			},
		),

		'domain_customize'                => array(
			'id_map'               => 'domain_customize_deferred',
			'get_title'            => function () {
				return __( 'Customize your domain', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_domain_customize_completed',
			'is_visible_callback'  => 'wpcom_is_domain_customize_task_visible',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/domains/add/' . $data['site_slug_encoded'];
			},
		),

		'share_site'                      => array(
			'get_title'            => function () {
				return __( 'Share your site', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
		),

		// Newsletter post-launch tasks.
		'earn_money'                      => array(
			'get_title'            => function () {
				return __( 'Earn money with your newsletter', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/earn/' . $data['site_slug_encoded'];
			},
		),

		'customize_welcome_message'       => array(
			'get_title'            => function () {
				return __( 'Customize welcome message', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/settings/newsletter/' . $data['site_slug_encoded'];
			},
		),
		'enable_subscribers_modal'        => array(
			'get_title'            => function () {
				return __( 'Enable subscribers modal', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_is_enable_subscribers_modal_visible',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/settings/newsletter/' . $data['site_slug_encoded'];
			},
		),
		'add_10_email_subscribers'        => array(
			'get_title'                 => function () {
				return __( 'Get your first 10 subscribers', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback'      => 'wpcom_launchpad_is_repeated_task_complete',
			'is_visible_callback'       => 'wpcom_launchpad_are_newsletter_subscriber_counts_available',
			'target_repetitions'        => 10,
			'repetition_count_callback' => 'wpcom_launchpad_get_newsletter_subscriber_count',
			'get_calypso_path'          => function ( $task, $default, $data ) {
				return '/subscribers/' . $data['site_slug_encoded'];
			},
		),
		'write_3_posts'                   => array(
			'get_title'                 => function () {
				return __( 'Write 3 posts', 'jetpack-mu-wpcom' );
			},
			'repetition_count_callback' => 'wpcom_launchpad_get_write_3_posts_repetition_count',
			'target_repetitions'        => 3,
			'get_calypso_path'          => function ( $task, $default, $data ) {
				return '/post/' . $data['site_slug_encoded'];
			},
		),
		'manage_subscribers'              => array(
			'get_title'            => function () {
				return __( 'Manage your subscribers', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_has_goal_import_subscribers',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/subscribers/' . $data['site_slug_encoded'];
			},
		),
		'connect_social_media'            => array(
			'id_map'           => 'drive_traffic',
			'get_title'        => function () {
				return __( 'Connect your social media accounts', 'jetpack-mu-wpcom' );
			},
			'get_calypso_path' => function ( $task, $default, $data ) {
				return '/marketing/connections/' . $data['site_slug_encoded'];
			},
		),
		'manage_paid_newsletter_plan'     => array(
			'get_title'            => function () {
				return __( 'Manage your paid Newsletter plan', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_has_goal_paid_subscribers',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/earn/payments-plans/' . $data['site_slug_encoded'];
			},
		),
		'add_about_page'                  => array(
			'get_title'            => function () {
				return __( 'Add your About page', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_add_about_page_visible',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/page/' . $data['site_slug_encoded'];
			},
		),
	);

	$extended_task_definitions = apply_filters( 'wpcom_launchpad_extended_task_definitions', array() );

	return array_merge( $extended_task_definitions, $task_definitions );
}

/**
 * Record completion event in Tracks if we're running on WP.com.
 *
 * @param string $task_id The task ID.
 * @param array  $extra_props Optional extra arguments to pass to the Tracks event.
 *
 * @return void
 */
function wpcom_launchpad_track_completed_task( $task_id, $extra_props = array() ) {
	if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
		return;
	}

	require_lib( 'tracks/client' );

	tracks_record_event(
		wp_get_current_user(),
		'wpcom_launchpad_mark_task_complete',
		array_merge(
			array( 'task_id' => $task_id ),
			$extra_props
		)
	);
}

/**
 * Returns a list of mappings from 'id_map' to the actual task id.
 *
 * @return array
 */
function wpcom_launchpad_get_reverse_id_mappings() {
	$task_definitions = wpcom_launchpad_get_task_definitions();

	$mapping = array();
	foreach ( $task_definitions as $task_id => $value ) {
		if ( ! isset( $value['id_map'] ) ) {
			continue;
		}
		$mapping[ $value['id_map'] ] = $task_id;
	}

	return $mapping;
}
/**
 * Mark a task as complete.
 *
 * @param string $task_id The task ID that should be marked as complete.
 * @return bool True if the task was marked as complete, false otherwise.
 */
function wpcom_mark_launchpad_task_complete( $task_id ) {
	if ( empty( $task_id ) ) {
		return false;
	}

	$result = wpcom_launchpad_update_task_status( array( $task_id => true ) );

	return isset( $result[ $task_id ] ) && $result[ $task_id ];
}

/**
 * Mark a task as incomplete.
 *
 * @param string $task_id The task ID that should be marked as incomplete.
 * @return bool True if the task was marked as incomplete, false otherwise.
 */
function wpcom_mark_launchpad_task_incomplete( $task_id ) {
	if ( empty( $task_id ) ) {
		return false;
	}

	$result = wpcom_launchpad_update_task_status( array( $task_id => false ) );

	return isset( $result[ $task_id ] ) && ! $result[ $task_id ];
}

/**
 * Updates task/s statuses. If a non-existent task is passed, it will be ignored.
 *
 * @param bool[] $new_statuses Array of mappings [ task_id: string => new_status: bool ].
 * @return bool[] Return the new values of the requested statuses with the requested task ID as the key. This will be an empty array if the option update fails, and any ignored status values will not be returned.
 */
function wpcom_launchpad_update_task_status( $new_statuses ) {
	if ( ! is_array( $new_statuses ) ) {
		return array();
	}

	$task_definitions = wpcom_launchpad_get_task_definitions();
	$reverse_id_map   = wpcom_launchpad_get_reverse_id_mappings();

	$statuses_to_update = array();
	$response_statuses  = array();
	$option_map         = array();

	foreach ( $new_statuses as $requested_task_id => $new_status ) {
		// Work out what the underlying task ID/option is.
		if ( isset( $task_definitions[ $requested_task_id ] ) ) {
			// Check if the requested task has an id_map.
			if ( isset( $task_definitions[ $requested_task_id ]['id_map'] ) ) {
				$resolved_task_id = $task_definitions[ $requested_task_id ]['id_map'];
			} else {
				$resolved_task_id = $requested_task_id;
			}
		} elseif ( isset( $reverse_id_map[ $requested_task_id ] ) ) {
			// We have some tasks that are only an id_map, but not a standalone task ID.
			$resolved_task_id = $requested_task_id;
		} else {
			continue;
		}

		$new_status = (bool) $new_status;

		$statuses_to_update[ $resolved_task_id ] = $new_status;
		$response_statuses[ $requested_task_id ] = $new_status;
		$option_map[ $resolved_task_id ]         = $requested_task_id;
	}

	$old_values = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
	// Only store truthy values.
	$new_values = array_filter(
		array_merge( $old_values, $statuses_to_update )
	);

	// Check for a no-op where we are not actually writing anything.
	if ( $new_values === $old_values ) {
		return $response_statuses;
	}

	if ( empty( $new_values ) ) {
		// If the new value is empty, but we had values before, we need to delete the option.
		$update_result = delete_option( 'launchpad_checklist_tasks_statuses' );
	} else {
		$update_result = update_option( 'launchpad_checklist_tasks_statuses', $new_values );
	}

	if ( ! $update_result ) {
		return array();
	}

	// Track task completion for newly completed tasks.
	$maybe_newly_completed_tasks = array_filter( $statuses_to_update );

	foreach ( $maybe_newly_completed_tasks as $task_id => $task_status ) {
		if ( isset( $old_values[ $task_id ] ) ) {
			// Task was already complete - no need to mark as complete again.
			continue;
		}
		// Use the requested task ID for completion tracking.
		$requested_task_id = $option_map[ $task_id ];

		wpcom_launchpad_track_completed_task( $requested_task_id );
	}

	return $response_statuses;
}

/**
 * Initialize the Launchpad task listener callbacks.
 *
 * @param array $task_definitions The tasks to initialize.
 *
 * @return mixed void or WP_Error.
 */
function wpcom_launchpad_init_listeners( $task_definitions ) {
	foreach ( $task_definitions as $task_id => $task_definition ) {
		if ( isset( $task_definition['add_listener_callback'] ) && is_callable( $task_definition['add_listener_callback'] ) ) {
			$task_data = array_merge( $task_definition, array( 'id' => $task_id ) );

			try {
				call_user_func( $task_definition['add_listener_callback'], $task_data ); // Current callbacks expect the built, registered task for the second parameter, which won't work in this case.
			} catch ( Exception $e ) {
				if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
					require_once WP_CONTENT_DIR . '/lib/log2logstash/log2logstash.php';

					$data = array(
						'blog_id'     => get_current_blog_id(),
						'task_id'     => $task_id,
						'site_intent' => get_option( 'site_intent' ),
					);

					log2logstash(
						array(
							'feature' => 'launchpad',
							'message' => 'Launchpad failed to add listener callback.',
							'extra'   => wp_json_encode( $data ),
						)
					);
				}

				return new WP_Error( 'launchpad_add_listener_callback_failed', $e->getMessage() );
			}
		}
	}
}

/**
 * Initialize the Launchpad task definitions.
 *
 * @return void
 */
function wpcom_launchpad_init_task_definitions() {
	$task_definitions = wpcom_launchpad_get_task_definitions();

	wpcom_launchpad_init_listeners( $task_definitions );
}
add_action( 'init', 'wpcom_launchpad_init_task_definitions', 11 );

/**
 * Task callbacks.
 */

/**
 * Marks a task as complete if it is active for this site. This is a bit of a hacky way to be able to share a callback
 * among several tasks, calling several completion IDs from the same callback.
 *
 * @param string $task_id The task ID.
 * @return bool True if successful, false if not.
 */
function wpcom_mark_launchpad_task_complete_if_active( $task_id ) {
	if ( wpcom_launchpad_checklists()->mark_task_complete_if_active( $task_id ) ) {
		wpcom_launchpad_track_completed_task( $task_id );
		return true;
	}

	return false;
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

	if ( function_exists( 'wpcom_get_site_purchases' ) ) {
		$site_purchases = wpcom_get_site_purchases();

		// Check if the site has any domain purchases.
		$domain_purchases = array_filter(
			$site_purchases,
			function ( $site_purchase ) {
				return in_array( $site_purchase->product_type, array( 'domain_map', 'domain_reg' ), true );
			}
		);

		if ( ! empty( $domain_purchases ) ) {
			return true;
		}
	}

	return $default;
}

/**
 * Returns the badge text for the domain upsell task
 *
 * @return string Badge text
 */
function wpcom_get_domain_upsell_badge_text() {
	// Never run `wpcom_is_checklist_task_complete` within a is_complete_callback unless you are fond of infinite loops.
	return wpcom_is_checklist_task_complete( 'domain_upsell' ) ? '' : __( 'Upgrade plan', 'jetpack-mu-wpcom' );
}

/**
 * Determines whether or not domain upsell task should be visible.
 *
 * @return bool True if user is on a free plan.
 */
function wpcom_is_domain_upsell_task_visible() {
	if ( ! function_exists( 'wpcom_get_site_purchases' ) ) {
		return false;
	}

	$site_purchases = wpcom_get_site_purchases();

	$bundle_purchases = array_filter(
		$site_purchases,
		function ( $site_purchase ) {
			return $site_purchase->product_type === 'bundle';
		}
	);

	return empty( $bundle_purchases );
}

/**
 * Identify whether we can retrieve newsletter subscriber counts in
 * the current environment.
 *
 * @return bool Whether or not we can compute the number of newsletter subscribers.
 */
function wpcom_launchpad_are_newsletter_subscriber_counts_available() {
	// If we aren't running on WordPress.com, we can't access blog subscriber information accurately.
	if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
		return false;
	}

	// Note that these functions are used in wpcom_launchpad_get_newsletter_subscriber_count(),
	// so the list of functions needs to be kept in sync with that code.
	if ( ! function_exists( 'wpcom_subs_total_for_blog' ) || ! function_exists( 'wpcom_subs_is_subscribed' ) ) {
		return false;
	}

	return true;
}

/**
 * Get the number of newsletter subscribers.
 *
 * @return int The number of newsletter subscribers for the current blog.
 */
function wpcom_launchpad_get_newsletter_subscriber_count() {
	// Check whether we can compute the subscriber counts first.
	// If we add any WordPress.com function calls in this code, we
	// need to add checks in that function.
	if ( ! wpcom_launchpad_are_newsletter_subscriber_counts_available() ) {
		return 0;
	}

	$current_blog_id = get_current_blog_id();

	$total_subscribers = wpcom_subs_total_for_blog( $current_blog_id );

	// Account for the fact that the admin user is a subscriber by default.
	$is_subscribed_arguments = array(
		'blog_id' => $current_blog_id,
		'user_id' => get_current_user_id(),
	);
	if ( $total_subscribers > 0 && wpcom_subs_is_subscribed( $is_subscribed_arguments ) ) {
		--$total_subscribers;
	}

	return (int) $total_subscribers;
}

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
 * Gets the number of published posts that were not created by Headstart.
 *
 * @return int
 */
function wpcom_launchpad_get_published_non_headstart_posts_count() {
	// Ensure that Headstart posts don't affect the count
	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return 0;
	}

	// Make sure we don't count any published posts that were created by Headstart.
	$headstart_posts_filter = array(
		'post_type'    => 'post',
		'fields'       => 'ids',
		'status'       => 'publish',
		'meta_key'     => '_hs_old_id',
		'meta_compare' => 'EXISTS',
	);

	$total_posts_count     = wp_count_posts( 'post' )->publish;
	$headstart_posts_count = count( get_posts( $headstart_posts_filter ) );

	return $total_posts_count - $headstart_posts_count;
}

/**
 * Callback for completing the Write 3 posts task.
 *
 * @return void
 */
function wpcom_launchpad_track_write_3_posts_task() {
	// If the task is already completed, don't do anything.
	if ( wpcom_is_task_option_completed( array( 'id' => 'write_3_posts' ) ) ) {
		return;
	}

	$published_non_headstart_posts = wpcom_launchpad_get_published_non_headstart_posts_count();

	if ( $published_non_headstart_posts >= 3 ) {
		wpcom_mark_launchpad_task_complete( 'write_3_posts' );
	}
}
add_action( 'publish_post', 'wpcom_launchpad_track_write_3_posts_task' );

/**
 * Callback for getting the number of posts published.
 *
 * @param array $task The Task definition.
 * @return int
 */
function wpcom_launchpad_get_write_3_posts_repetition_count( $task ) {
	$published_non_headstart_posts = wpcom_launchpad_get_published_non_headstart_posts_count();

	return min( $task['target_repetitions'], $published_non_headstart_posts );
}

/**
 * Returns the option value for a task and false if no option exists.
 *
 * @param array $task The task data.
 * @return bool True if the option for the task is marked as complete, false otherwise.
 */
function wpcom_is_task_option_completed( $task ) {
	$checklist = get_option( 'launchpad_checklist_tasks_statuses', array() );
	if ( ! empty( $checklist[ $task['id'] ] ) ) {
		return true;
	}
	return false;
}

/**
 * Helper function to detect whether we've reached the number of repetitions for a task, or if
 * the task has already been marked as complete.
 * This is most useful for cases where it's simpler to look at the cached action count than
 * injecting additional logic into complex code paths.
 * NOTE: This function should only be used when (re)computing the repetition count is quick.
 *
 * @param array $task              The task data.
 * @param bool  $is_option_complete Whether the underlying option has already been marked as complete.
 * @return bool True if the underlying option has been marked as complete, or if we detect that
 * target_repetitions has been reached.
 */
function wpcom_launchpad_is_repeated_task_complete( $task, $is_option_complete ) {
	if ( $is_option_complete ) {
		return true;
	}

	if ( ! isset( $task['target_repetitions'] ) || ! is_int( $task['target_repetitions'] ) ) {
		return false;
	}

	if ( ! isset( $task['repetition_count_callback'] ) || ! is_callable( $task['repetition_count_callback'] ) ) {
		return false;
	}

	try {
		$repetition_count = call_user_func( $task['repetition_count_callback'], $task, 0 );
	} catch ( Exception $exception ) {
		return false;
	}

	if ( ! is_int( $repetition_count ) ) {
		return false;
	}

	$is_complete = $repetition_count >= $task['target_repetitions'];

	if ( $is_complete ) {
		// If we detect the task has been completed, make sure we mark it as complete.
		wpcom_mark_launchpad_task_complete( $task['id'] );
	}

	return $is_complete;
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
			'Your site contains custom styles. Upgrade now to publish them and unlock tons of other features.',
			'jetpack-mu-wpcom'
		) : '';
}

/**
 * Returns the badge text for the plan selected task
 *
 * @return string Badge text
 */
function wpcom_get_plan_selected_badge_text() {
	if ( ! function_exists( 'wpcom_global_styles_in_use' ) || ! function_exists( 'wpcom_should_limit_global_styles' ) ) {
		return '';
	}

	return wpcom_global_styles_in_use() && wpcom_should_limit_global_styles() ? __( 'Upgrade plan', 'jetpack-mu-wpcom' ) : '';
}

/**
 * Helper function to return the site slug for Calypso URLs.
 * The fallback logic here is derived from the following code:
 *
 * @see https://github.com/Automattic/wc-calypso-bridge/blob/85664e2c7836b2ddc29e99871ec2c5dc4015bcc8/class-wc-calypso-bridge.php#L227-L251
 *
 * @return string
 */
function wpcom_launchpad_get_site_slug() {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM && class_exists( 'WPCOM_Masterbar' ) && method_exists( 'WPCOM_Masterbar', 'get_calypso_site_slug' ) ) {
		return WPCOM_Masterbar::get_calypso_site_slug( get_current_blog_id() );
	}

	// The Jetpack class should be auto-loaded if Jetpack has been loaded,
	// but we've seen fatal errors from cases where the class wasn't defined.
	// So let's make double-sure it exists before calling it.
	if ( class_exists( '\Automattic\Jetpack\Status' ) ) {
		$jetpack_status = new \Automattic\Jetpack\Status();

		return $jetpack_status->get_site_suffix();
	}

	// If the Jetpack Status class doesn't exist, fall back on site_url()
	// with any trailing '/' characters removed.
	$site_url = untrailingslashit( site_url( '/', 'https' ) );

	// Remove the leading 'https://' and replace any remaining `/` characters with ::
	return str_replace( '/', '::', substr( $site_url, 8 ) );
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
	wpcom_mark_launchpad_task_complete_if_active( 'blog_launched' );

	// Remove site intent for blog onboarding flows and disable launchpad.
	$site_intent = get_option( 'site_intent' );
	if ( in_array( $site_intent, array( 'start-writing', 'design-first' ), true ) ) {
		update_option( 'site_intent', '' );
		update_option( 'launchpad_screen', 'off' );
	}

	// While in the design_first flow, if the user creates a post, deletes the default hello-world.
	$first_post_published = wpcom_launchpad_checklists()->is_task_id_complete( 'first_post_published' );
	if ( in_array( $site_intent, array( 'design-first' ), true ) && $first_post_published ) {
		$posts = get_posts( array( 'name' => 'hello-world' ) );

		if ( count( $posts ) > 0 ) {
			wp_delete_post( $posts[0]->ID, true );
		}
	}
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

/**
 * If the site has a import-subscriber goal.
 *
 * @return bool True if the site has a import-subscriber goal, false otherwise.
 */
function wpcom_has_goal_import_subscribers() {
	return in_array( 'import-subscribers', get_option( 'site_goals', array() ), true );
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
 * Determines whether or not the videopress launch task is enabled
 *
 * @return boolean True if videopress launch task is enabled
 */
function wpcom_is_videopress_launch_disabled() {
	return ! wpcom_is_checklist_task_complete( 'videopress_upload' );
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
 * Mark the site_title task as complete if the site title is not empty and not the default.
 *
 * @param string $old_value The old value of the site title.
 * @param string $value The new value of the site title.
 *
 * @return void
 */
function wpcom_mark_site_title_complete( $old_value, $value ) {
	if ( $value !== $old_value ) {
		wpcom_mark_launchpad_task_complete( 'site_title' );
	}
}
add_action( 'update_option_blogname', 'wpcom_mark_site_title_complete', 10, 3 );

/**
 * Mark the enable_subscribers_modal task complete
 * if its option is updated to `true`.
 *
 * @param string $old_value The old value of the option.
 * @param string $value The new value of the option.
 *
 * @return void
 */
function wpcom_mark_enable_subscribers_modal_complete( $old_value, $value ) {
	if ( $value ) {
		wpcom_mark_launchpad_task_complete( 'enable_subscribers_modal' );
	}
}
add_action( 'update_option_sm_enabled', 'wpcom_mark_enable_subscribers_modal_complete', 10, 3 );
add_action( 'add_option_sm_enabled', 'wpcom_mark_enable_subscribers_modal_complete', 10, 3 );

/**
 * Determines whether the enable_subscribers_modal task should show.
 *
 * @return bool True if the task should show, false otherwise.
 */
function wpcom_is_enable_subscribers_modal_visible() {
	return apply_filters( 'jetpack_subscriptions_modal_enabled', false );
}

/**
 * Determine `domain_claim` task visibility.
 *
 * @return bool True if we should show the task, false otherwise.
 */
function wpcom_domain_claim_is_visible_callback() {
	if ( ! function_exists( 'wpcom_site_has_feature' ) ) {
		return false;
	}

	return wpcom_site_has_feature( 'custom-domain' );
}

/**
 * Determines whether or not domain claim task is completed.
 *
 * @return bool True if domain claim task is completed.
 */
function wpcom_is_domain_claim_completed() {
	if ( ! function_exists( 'wpcom_get_site_purchases' ) ) {
		return false;
	}

	$site_purchases = wpcom_get_site_purchases();

	// Check if the site has any domain purchases.
	$domain_purchases = array_filter(
		$site_purchases,
		function ( $site_purchase ) {
			return in_array( $site_purchase->product_type, array( 'domain_map', 'domain_reg' ), true );
		}
	);

	return ! empty( $domain_purchases );
}

/**
 * When a new page is added to the site, mark the add_new_page task complete as needed.
 *
 * @param int    $post_id The ID of the post being updated.
 * @param object $post    The post object.
 */
function wpcom_add_new_page_check( $post_id, $post ) {
	// Don't do anything if the task is already complete.
	if ( wpcom_is_task_option_completed( array( 'id' => 'add_new_page' ) ) ) {
		return;
	}

	// We only care about pages, ignore other post types.
	if ( $post->post_type !== 'page' ) {
		return;
	}

	// Ensure that Headstart posts don't mark this as complete
	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return;
	}

	// We only care about published pages. Pages added via the API are not published by default.
	if ( $post->post_status !== 'publish' ) {
		return;
	}

	// This is necessary to avoid marking the task as complete when the about page is updated.
	if ( $post_id === wpcom_get_site_about_page_id() ) {
		return;
	}

	wpcom_mark_launchpad_task_complete( 'add_new_page' );
}
add_action( 'wp_insert_post', 'wpcom_add_new_page_check', 10, 3 );

/**
 * Return the about page id, if any.
 *
 * This function will retrieve the page from the cache whenever possible.
 *
 * @return int|null The page ID of the 'About' page if it exists, null otherwise.
 */
function wpcom_get_site_about_page_id() {
	// First, attempt to get the page ID from the cache.
	$about_page_id_cache_key = 'wpcom_about_page_id';
	$about_page_id           = wp_cache_get( $about_page_id_cache_key, 'jetpack_mu_wpcom' );

	if ( false !== $about_page_id ) {
		$about_page_id = (int) $about_page_id;
		if ( $about_page_id > 0 ) {
			return $about_page_id;
		}

		return null;
	}

	// Call the current function implementation without any caching logic.
	$about_page_id = wpcom_find_site_about_page_id();

	if ( null === $about_page_id ) {
		// In the event that we don't have a page id, cache -1 to avoid caching null
		$value_to_cache = -1;
	} else {
		$value_to_cache = $about_page_id;
	}

	// Use wp_cache_add() to avoid cache stampedes, and specify an expiration time
	wp_cache_add( $about_page_id_cache_key, $value_to_cache, 'jetpack_mu_wpcom', 3600 );

	return $about_page_id;
}

/**
 * Determine if the site has an 'About' page.
 * We do this by loading the `en` annotation for the site and theme.
 * We then check if there is a post with the title 'About'. If there is, we get the `hs_old_id` and check to make sure a corresponding post exists in the user's locale.
 *
 * @return int|null The page ID of the 'About' page if it exists, null otherwise.
 */
function wpcom_find_site_about_page_id() {
	if ( ! function_exists( 'wpcom_get_theme_annotation' ) ) {
		return null;
	}

	$annotation = wpcom_get_theme_annotation( get_stylesheet() );

	// Return null if there is no annotation, an error, or the annotation doesn't have any content.
	if ( ! $annotation || ! is_array( $annotation ) || ! isset( $annotation['content'] ) || ! is_array( $annotation['content'] ) ) {
		return null;
	}

	// Use the annotation to build up a list of 'About' pages.
	$headstart_about_pages = array_filter(
		$annotation['content'],
		function ( $page ) {
			if ( 'page' !== $page['post_type'] ) {
				return false;
			}

			if ( 'about' === $page['post_name'] || false !== strpos( $page['post_title'], 'About' ) ) {
				return true;
			}
		}
	);

	// Return null if there are no 'About' pages.
	if ( empty( $headstart_about_pages ) ) {
		return null;
	}

	// Get the hs_old_ids for the 'About' pages. We'll use these to find any published pages with the same hs_old_id.
	$headstart_about_page_hs_old_ids = array_map(
		function ( $about_page ) {
			return $about_page['hs_old_id'];
		},
		$headstart_about_pages
	);

	// Return null if there aren't any hs_old_ids to check.
	if ( empty( $headstart_about_page_hs_old_ids ) ) {
		return null;
	}

	$filters     = array(
		'post_type'    => 'page',
		'numberposts'  => 1,
		'fields'       => 'ids',
		'orderby'      => 'meta_value',
		'meta_key'     => '_hs_old_id',
		'meta_compare' => 'IN',
		'meta_value'   => $headstart_about_page_hs_old_ids,
	);
	$about_pages = get_posts( $filters );

	// Return null if we couldn't find any pages matching the hs_old_ids.
	if ( empty( $about_pages ) ) {
		return null;
	}

	// Return the id of the first About page.
	return (int) $about_pages[0];
}

/**
 * Check to see if a string has been translated.
 *
 * @param string $string The string to check.
 * @param string $domain The text domain to use.
 * @return bool True if the string has been translated, false otherwise.
 */
function wpcom_launchpad_has_translation( $string, $domain = 'jetpack-mu-wpcom' ) {
	if ( empty( $string ) ) {
		return false;
	}

	$current_locale = get_user_locale();
	if ( is_string( $current_locale ) && 0 === strpos( $current_locale, 'en' ) ) {
		return true;
	}

	// phpcs:disable WordPress.WP.I18n.NonSingularStringLiteralText, WordPress.WP.I18n.NonSingularStringLiteralDomain
	$translated_string = __( $string, $domain );

	return $translated_string !== $string;
}

/**
 * Determine `add_new_page` task visibility. The task is visible if there is no 'About' page on the site.
 *
 * @return bool True if we should show the task, false otherwise.
 */
function wpcom_launchpad_is_add_about_page_visible() {
	return ! wpcom_is_update_about_page_task_visible() && registered_meta_key_exists( 'post', '_wpcom_template_layout_category', 'page' );
}

/**
 * Completion hook for the `add_about_page` task.
 *
 * @param int    $post_id The post ID.
 * @param object $post    The post object.
 */
function wpcom_launchpad_add_about_page_check( $post_id, $post ) {
	// Ensure that Headstart posts don't mark this as complete
	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return;
	}

	// We only care about pages, ignore other post types.
	if ( $post->post_type !== 'page' ) {
		return;
	}

	// We only care about published pages. Pages added via the API are not published by default.
	if ( $post->post_status !== 'publish' ) {
		return;
	}

	// Don't do anything if we don't have the page category post_meta field registered.
	if ( ! registered_meta_key_exists( 'post', '_wpcom_template_layout_category', 'page' ) ) {
		return;
	}

	// Don't do anything if the task is already complete.
	if ( wpcom_is_task_option_completed( array( 'id' => 'add_about_page' ) ) ) {
		return;
	}

	// If the page is the previously located About page, ignore it.
	$about_page_id = wpcom_get_site_about_page_id();
	if ( null !== $about_page_id && $post->ID === $about_page_id ) {
		return;
	}

	$stored_page_categories = get_post_meta( $post->ID, '_wpcom_template_layout_category', true );
	if ( ! is_array( $stored_page_categories ) || ! in_array( 'about', $stored_page_categories, true ) ) {
		return;
	}

	wpcom_mark_launchpad_task_complete( 'add_about_page' );
}
add_action( 'wp_insert_post', 'wpcom_launchpad_add_about_page_check', 10, 3 );

/**
 * Determine `update_about_page` task visibility. The task is visible if there is an 'About' page on the site.
 *
 * @return bool True if we should show the task, false otherwise.
 */
function wpcom_is_update_about_page_task_visible() {
	// The task isn't visible if the task title hasn't been translated into the current locale.
	if ( ! wpcom_launchpad_has_translation( 'Update your About page', 'jetpack-mu-wpcom' ) ) {
		return false;
	}

	return wpcom_get_site_about_page_id() !== null;
}

/**
 * When a page is updated, check to see if it's the About page and mark the task complete accordingly.
 *
 * @param int     $post_id The ID of the post being updated.
 * @param WP_Post $post The post object.
 */
function wpcom_update_about_page_check( $post_id, $post ) {
	// Ensure that Headstart posts don't mark this as complete
	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return;
	}

	// We only care about pages, ignore other post types.
	if ( $post->post_type !== 'page' ) {
		return;
	}

	// We only care about published pages. Pages added via the API are not published by default.
	if ( $post->post_status !== 'publish' ) {
		return;
	}

	// Don't do anything if the task is already complete.
	if ( wpcom_is_task_option_completed( array( 'id' => 'update_about_page' ) ) ) {
		return;
	}

	// If the page is not the previously located About page, ignore it.
	$about_page_id = wpcom_get_site_about_page_id();
	if ( null === $about_page_id || $post->ID !== $about_page_id ) {
		return;
	}

	wpcom_mark_launchpad_task_complete( 'update_about_page' );
}
add_action( 'post_updated', 'wpcom_update_about_page_check', 10, 3 );

/**
 * Determine `edit_page` task visibility. The task is visible if there is at least one page and the add_new_page task is complete.
 *
 * @return bool True if we should show the task, false otherwise.
 */
function wpcom_is_edit_page_task_visible() {
	// Don't show the task if the update_about_page task is visible.
	if ( wpcom_is_update_about_page_task_visible() ) {
		return false;
	}

	// Otherwise, don't show the task until after a page has been added.
	if ( ! wpcom_is_task_option_completed( array( 'id' => 'add_new_page' ) ) ) {
		return false;
	}

	// Show the task if there is at least one page.
	return ! empty(
		get_posts(
			array(
				'numberposts' => 1,
				'post_type'   => 'page',
			)
		)
	);
}

/**
 * Mark the customize_welcome_message task complete
 * if the subscription_options['invitation'] value
 * for the welcome message has changed on option update.
 *
 * @param string $old_value The old value of the welcome message.
 * @param string $value The new value of the welcome message.
 *
 * @return void
 */
function wpcom_mark_customize_welcome_message_complete_on_update( $old_value, $value ) {
	if ( $value['invitation'] !== $old_value['invitation'] ) {
		wpcom_mark_launchpad_task_complete( 'customize_welcome_message' );
	}
}
add_action( 'update_option_subscription_options', 'wpcom_mark_customize_welcome_message_complete_on_update', 10, 2 );

/**
 * Mark the customize_welcome_message task complete
 * if the subscription_options['invitation'] value
 * for the welcome message has been added.
 *
 * @param string $value The value of the welcome message.
 *
 * @return void
 */
function wpcom_mark_customize_welcome_message_complete_on_add( $value ) {
	if ( $value['invitation'] ) {
		wpcom_mark_launchpad_task_complete( 'customize_welcome_message' );
	}
}
add_action( 'add_option_subscription_options', 'wpcom_mark_customize_welcome_message_complete_on_add', 10, 1 );

/**
 * When a page is updated, check to see if we've already completed the `add_new_page` task and mark the `edit_page` task complete accordingly.
 *
 * @param int     $post_id The ID of the post being updated.
 * @param WP_Post $post The post object.
 */
function wpcom_edit_page_check( $post_id, $post ) {
	// Don't do anything if the task is already complete.
	if ( wpcom_is_task_option_completed( array( 'id' => 'edit_page' ) ) ) {
		return;
	}

	// Don't do anything if the add_new_page task is incomplete.
	if ( ! wpcom_is_task_option_completed( array( 'id' => 'add_new_page' ) ) ) {
		return false;
	}

	// We only care about pages, ignore other post types.
	if ( $post->post_type !== 'page' ) {
		return;
	}

	// Ensure that Headstart posts don't mark this as complete
	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return;
	}

	// We only care about published pages. Pages added via the API are not published by default.
	if ( $post->post_status !== 'publish' ) {
		return;
	}

	wpcom_mark_launchpad_task_complete( 'edit_page' );
}
add_action( 'post_updated', 'wpcom_edit_page_check', 10, 3 );

/**
 * Returns if the site has domain or bundle purchases.
 *
 * @return array Array of booleans, first value is if the site has a bundle, second is if the site has a domain.
 */
function wpcom_domain_customize_check_purchases() {
	if ( ! function_exists( 'wpcom_get_site_purchases' ) ) {
		return false;
	}

	$site_purchases = wpcom_get_site_purchases();
	$has_bundle     = false;
	$has_domain     = false;

	foreach ( $site_purchases as $site_purchase ) {
		if ( 'bundle' === $site_purchase->product_type ) {
			$has_bundle = true;
		}

		if ( in_array( $site_purchase->product_type, array( 'domain_map', 'domain_reg' ), true ) ) {
			$has_domain = true;
		}
	}

	return array( $has_bundle, $has_domain );
}

/**
 * Determines whether or not domain customize task is complete.
 *
 * @param array $task    The Task object.
 * @param mixed $default The default value.
 * @return bool True if domain customize task is complete.
 */
function wpcom_is_domain_customize_completed( $task, $default ) {
	$result = wpcom_domain_customize_check_purchases();

	if ( $result === false ) {
		return false;
	}

	list( $has_bundle, $has_domain ) = $result;

	// For paid users with a custom domain, show the task as complete.
	if ( $has_bundle && $has_domain ) {
		return true;
	}

	// For everyone else, show the task as incomplete.
	return $default;
}

/**
 * Determines whether or not domain customize task is visible.
 *
 * @return bool True if user is on a free plan and didn't purchase domain or if user is on a paid plan and did purchase a domain.
 */
function wpcom_is_domain_customize_task_visible() {
	$result = wpcom_domain_customize_check_purchases();

	if ( $result === false ) {
		return false;
	}

	list( $has_bundle, $has_domain ) = $result;

	// Free user who didn't purchase a domain.
	if ( ! $has_bundle && ! $has_domain ) {
		return true;
	}

	// Paid user who purchased a domain.
	if ( $has_bundle && $has_domain ) {
		return true;
	}

	return false;
}

/**
 * Mark `domain_claim`, `domain_upsell`, and `domain_upsell_deferred` tasks complete
 * when a domain product is activated.
 *
 * @param int    $blog_id The blog ID.
 * @param int    $user_id The user ID.
 * @param string $product_id The product ID.
 *
 * @return void
 */
function wpcom_mark_domain_tasks_complete( $blog_id, $user_id, $product_id ) {
	if ( ! class_exists( 'domains' ) ) {
		return;
	}

	if ( ! domains::is_domain_product( $product_id ) ) {
		return;
	}

	wpcom_mark_launchpad_task_complete( 'domain_claim' );
	wpcom_mark_launchpad_task_complete( 'domain_upsell' );
	wpcom_mark_launchpad_task_complete( 'domain_upsell_deferred' );
}
add_action( 'activate_product', 'wpcom_mark_domain_tasks_complete', 10, 6 );

/**
 * Re-trigger email campaigns for blog onboarding after user edit one of the fields in the launchpad.
 */
function wpcom_trigger_email_campaign() {
	$site_intent = get_option( 'site_intent' );
	if ( ! $site_intent ) {
		return;
	}

	if ( ! in_array( $site_intent, array( 'start-writing', 'design-first' ), true ) ) {
		return;
	}

	MarketingEmailCampaigns::start_tailored_use_case_new_site_workflows_if_eligible(
		get_current_user_id(),
		get_current_blog_id(),
		$site_intent
	);
}
add_action( 'update_option_launchpad_checklist_tasks_statuses', 'wpcom_trigger_email_campaign', 10, 3 );
