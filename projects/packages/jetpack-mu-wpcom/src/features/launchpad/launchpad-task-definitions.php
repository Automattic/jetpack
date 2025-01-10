<?php
/**
 * Launchpad: Task definitions and helpers
 *
 * @package automattic/jetpack-mu-wpcom
 */

// Type aliases used in a bunch of places in this file. Unfortunately Phan doesn't have a way to set these more globally than copy-pasting them into each file needing them.
<<<PHAN
@phan-type Task = array{id:string, title?:string, get_title?:callable, id_map?:string, add_listener_callback?:callable, badge_text_callback?:callable, extra_data_callback?:callable, get_calypso_path?:callable, is_complete_callback?:callable, is_disabled_callback?:callable, isLaunchTask?:bool, is_visible_callback?:callable, target_repetitions?:int, repetition_count_callback?:callable, subtitle?:callable, completed?:bool}
PHAN;

/**
 * Returns whether the task link should point to wp-admin page
 * instead of Calypso page.
 *
 * @return bool
 */
function wpcom_launchpad_should_use_wp_admin_link() {
	return get_option( 'wpcom_admin_interface' ) === 'wp-admin';
}

/**
 * Get the task definitions for the Launchpad.
 *
 * @return Task[]
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
				add_action( 'load-site-editor.php', 'wpcom_launchpad_track_edit_site_task' );
			},
			'get_calypso_path'      => function () {
				return admin_url( 'site-editor.php' );
			},
		),
		// design_completed checks for task completion while design_selected always returns true.
		'design_completed'                => array(
			'get_title'            => function () {
				return __( 'Select a design', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				$flow = get_option( 'site_intent' );
				return '/setup/update-design/designSetup?siteSlug=' . $data['site_slug_encoded'] . '&flow=' . $flow;
			},
		),
		'design_selected'                 => array(
			'get_title'            => function () {
				return __( 'Select a design', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => '__return_true',
			'is_disabled_callback' => 'wpcom_launchpad_is_design_step_enabled',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/setup/update-design/designSetup?siteSlug=' . $data['site_slug_encoded'];
			},
		),
		'domain_claim'                    => array(
			'get_title'            => function () {
				return __( 'Claim your free one-year domain', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_domain_claim_completed',
			'is_visible_callback'  => 'wpcom_launchpad_domain_claim_is_visible_callback',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/domains/add/' . $data['site_slug_encoded'];
			},
		),
		'domain_upsell'                   => array(
			'id_map'               => 'domain_upsell_deferred',
			'get_title'            => function () {
				return __( 'Choose a domain', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_domain_upsell_completed',
			'badge_text_callback'  => 'wpcom_launchpad_get_domain_upsell_badge_text',
			'is_visible_callback'  => 'wpcom_launchpad_is_domain_upsell_task_visible',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_checklists()->is_task_complete( $task ) ) {
						return '/domains/manage/' . $data['site_slug_encoded'];
				}

				return '/setup/domain-upsell/domains?siteSlug=' . $data['site_slug_encoded'];
			},
		),
		'first_post_published'            => array(
			'get_title'             => function () {
				$latest_draft_id = wpcom_launchpad_get_latest_draft_id();
				return $latest_draft_id === false
						? __( 'Write your first post', 'jetpack-mu-wpcom' )
						: __( 'Continue to write your first post', 'jetpack-mu-wpcom' );
			},
			'add_listener_callback' => function () {
				add_action( 'publish_post', 'wpcom_launchpad_track_publish_first_post_task' );
			},
			'get_calypso_path'      => function ( $task, $default, $data ) {
				$is_blog_onboarding_flow = in_array( get_option( 'site_intent' ), array( 'start-writing', 'design-first' ), true );
				$use_wp_admin_link = wpcom_launchpad_should_use_wp_admin_link() || $is_blog_onboarding_flow;
				$latest_draft_id = wpcom_launchpad_get_latest_draft_id();

				if ( is_int( $latest_draft_id ) ) {
					// There is a draft post, redirect the user to the draft instead of making a fresh post.
					if ( $use_wp_admin_link ) {
						return admin_url( 'post.php?action=edit&post=' . rawurlencode( $latest_draft_id ) );
					}
					return '/post/' . $data['site_slug_encoded'] . '/' . rawurlencode( $latest_draft_id );
				}

				$base_path = $use_wp_admin_link
					? admin_url( 'post-new.php' )
					: '/post/' . $data['site_slug_encoded'];

				// Add a new_prompt query param for Write sites.
				if ( 'write' === get_option( 'site_intent' ) ) {
					return add_query_arg( 'new_prompt', 'true', $base_path );
				}

				return $base_path;
			},
		),
		'generate_content'                => array(
			'get_title'            => function () {
				return __( 'Customize content with AI', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/setup/readymade-template/generateContent?siteSlug=' . $data['site_slug_encoded'];
			},
		),
		'plan_completed'                  => array(
			'get_title'            => function () {
				return __( 'Choose a plan', 'jetpack-mu-wpcom' );
			},
			'subtitle'             => 'wpcom_launchpad_get_plan_selected_subtitle',
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'badge_text_callback'  => 'wpcom_launchpad_get_plan_selected_badge_text',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				$flow = get_option( 'site_intent' );
				return '/setup/' . $flow . '/plans?siteSlug=' . $data['site_slug_encoded'];
			},
		),
		'plan_selected'                   => array(
			'get_title'            => function () {
				return __( 'Choose a plan', 'jetpack-mu-wpcom' );
			},
			'subtitle'             => 'wpcom_launchpad_get_plan_selected_subtitle',
			'is_complete_callback' => '__return_true',
			'badge_text_callback'  => 'wpcom_launchpad_get_plan_selected_badge_text',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/plans/' . $data['site_slug_encoded'];
			},
		),
		'setup_general'                   => array(
			'get_title'            => function () {
				return __( 'Give your site a name', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_disabled_callback' => '__return_true',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'options-general.php' );
				}
				return '/settings/general/' . $data['site_slug_encoded'];
			},
		),
		'site_launched'                   => array(
			'get_title'             => function () {
				return __( 'Launch your site', 'jetpack-mu-wpcom' );
			},
			'isLaunchTask'          => true,
			'is_complete_callback'  => 'wpcom_launchpad_is_site_launched',
			'add_listener_callback' => 'wpcom_launchpad_add_site_launch_listener',
		),
		'verify_email'                    => array(
			'get_title'            => function () {
				return __( 'Verify email address', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_email_verified',
			'is_disabled_callback' => 'wpcom_launchpad_is_email_verified',
			'get_calypso_path'     => function () {
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
				add_action( 'publish_post', 'wpcom_launchpad_track_publish_first_post_task' );
			},
			'get_calypso_path'      => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'post-new.php' );
				}
				return '/post/' . $data['site_slug_encoded'];
			},
		),
		'newsletter_plan_created'         => array(
			'get_title'           => function () {
				return __( 'Create paid Newsletter', 'jetpack-mu-wpcom' );
			},
			'is_visible_callback' => 'wpcom_launchpad_has_goal_paid_subscribers',
			'get_calypso_path'    => function ( $task, $default, $data ) {
				return '/earn/payments/' . $data['site_slug_encoded'] . '#add-newsletter-payment-plan';
			},
		),
		'setup_newsletter'                => array(
			'id'                   => 'setup_newsletter',
			'get_title'            => function () {
				return __( 'Personalize newsletter', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => '__return_true',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'options-general.php' );
				}
				return '/settings/general/' . $data['site_slug_encoded'];
			},
		),
		'set_up_payments'                 => array(
			'get_title'           => function () {
				return __( 'Set up payment method', 'jetpack-mu-wpcom' );
			},
			'is_visible_callback' => 'wpcom_launchpad_has_goal_paid_subscribers',
			'get_calypso_path'    => function ( $task, $default, $data ) {
				if ( function_exists( 'get_memberships_connected_account_redirect' ) ) {
					$user_id = get_current_user_id();
					$blog_id = get_current_blog_id();
					$source = $data['launchpad_context'];
					return $source
						? get_memberships_connected_account_redirect( $user_id, $blog_id, $source )
						: get_memberships_connected_account_redirect( $user_id, $blog_id );
				}
				return '/earn/payments/' . $data['site_slug_encoded'];
			},
		),
		'subscribers_added'               => array(
			'get_title'            => function () {
				return __( 'Add subscribers', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_has_goal_import_subscribers',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/subscribers/' . $data['site_slug_encoded'] . '#add-subscribers';
			},
		),
		'migrate_content'                 => array(
			'get_title'            => function () {
				return __( 'Migrate content', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_has_goal_import_subscribers',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'import.php' );
				}
				return '/import/' . $data['site_slug_encoded'];
			},
		),

		// Link in bio tasks.
		'link_in_bio_launched'            => array(
			'get_title'             => function () {
				return __( 'Launch your site', 'jetpack-mu-wpcom' );
			},
			'id_map'                => 'site_launched',
			'is_disabled_callback'  => 'wpcom_launchpad_is_link_in_bio_launch_disabled',
			'add_listener_callback' => 'wpcom_launchpad_add_site_launch_listener',
		),
		'links_added'                     => array(
			'get_title'             => function () {
				return __( 'Add links', 'jetpack-mu-wpcom' );
			},
			'id_map'                => 'links_edited',
			'add_listener_callback' => function () {
				add_action( 'load-site-editor.php', 'wpcom_launchpad_track_edit_site_task' );
			},
			'get_calypso_path'      => function () {
				return admin_url( 'site-editor.php' );
			},
		),
		'setup_link_in_bio'               => array(
			'get_title'            => function () {
				return __( 'Personalize Link in Bio', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => '__return_true',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/setup/link-in-bio-post-setup/linkInBioPostSetup?siteSlug=' . $data['site_slug_encoded'];
			},
		),

		// Videopress tasks.
		'videopress_launched'             => array(
			'id_map'                => 'site_launched',
			'get_title'             => function () {
				return __( 'Launch site', 'jetpack-mu-wpcom' );
			},
			'is_disabled_callback'  => 'wpcom_launchpad_is_videopress_launch_disabled',
			'add_listener_callback' => 'wpcom_launchpad_add_site_launch_listener',
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
			'is_disabled_callback'  => 'wpcom_launchpad_is_videopress_upload_disabled',
			'add_listener_callback' => function () {
				add_action( 'add_attachment', 'wpcom_launchpad_track_video_uploaded_task' );
			},
			'get_calypso_path'      => function ( $task, $default, $data ) {
				$page_on_front = get_option( 'page_on_front', false );
				if ( $page_on_front ) {
					if ( wpcom_launchpad_should_use_wp_admin_link() ) {
						return admin_url( 'post.php?post=' . $page_on_front . '&action=edit' );
					}
					return '/page/' . $data['site_slug_encoded'] . '/' . $page_on_front;
				}
				return admin_url( 'site-editor.php?canvas=edit' );
			},
		),

		// Blog tasks.
		'blog_launched'                   => array(
			'get_title'             => function () {
				return __( 'Launch your blog', 'jetpack-mu-wpcom' );
			},
			'isLaunchTask'          => true,
			'is_disabled_callback'  => 'wpcom_launchpad_is_blog_launched_task_disabled',
			'add_listener_callback' => 'wpcom_launchpad_add_site_launch_listener',
		),
		'setup_blog'                      => array(
			'get_title'            => function () {
				return __( 'Name your blog', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				$flow = get_option( 'site_intent' );
				return '/setup/' . $flow . '/setup-blog?siteSlug=' . $data['site_slug_encoded'];
			},
		),

		// Free plan tasks.
		'setup_free'                      => array(
			'get_title'            => function () {
				return __( 'Personalize your site', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'options-general.php' );
				}
				return '/settings/general/' . $data['site_slug_encoded'];
			},
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
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_site_title_task_visible',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'options-general.php' );
				}
				return '/settings/general/' . $data['site_slug_encoded'];
			},
		),

		'drive_traffic'                   => array(
			'get_title'            => function () {
				return __( 'Drive traffic to your site', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/marketing/connections/' . $data['site_slug_encoded'];
			},
		),

		'add_new_page'                    => array(
			'get_title'            => function () {
				return __( 'Add a new page', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'post-new.php?post_type=page' );
				}
				return '/page/' . $data['site_slug_encoded'];
			},
		),

		'update_about_page'               => array(
			'get_title'            => function () {
				return __( 'Update your About page', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_update_about_page_task_visible',
			'extra_data_callback'  => function () {
				return array(
					'about_page_id' => wpcom_launchpad_get_site_about_page_id(),
				);
			},
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'post.php?post=' . wpcom_launchpad_get_site_about_page_id() . '&action=edit' );
				}
				return '/page/' . $data['site_slug_encoded'] . '/' . wpcom_launchpad_get_site_about_page_id();
			},
		),

		'edit_page'                       => array(
			'get_title'            => function () {
				return __( 'Edit a page', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_edit_page_task_visible',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'edit.php?post_type=page' );
				}
				return '/pages/' . $data['site_slug_encoded'];
			},
		),

		'domain_customize'                => array(
			'id_map'               => 'domain_customize_deferred',
			'get_title'            => function () {
				return __( 'Customize your domain', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_domain_customize_completed',
			'is_disabled_callback' => 'wpcom_launchpad_is_domain_customize_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				// The from parameter is used to redirect the user back to the Launchpad when they
				// click on the Back button on the domain customization page.
				// TODO: This can cause problem if this task is used in the future for other flows
				// that are not in the Customer Home page. We should find a better way to handle this.
				return '/domains/add/' . $data['site_slug_encoded'] . '?from=my-home';
			},
		),

		'share_site'                      => array(
			'get_title'            => function () {
				return __( 'Share your site', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
		),

		// Newsletter post-launch tasks.
		'earn_money'                      => array(
			'get_title'            => function () {
				return __( 'Earn money with your newsletter', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/earn/' . $data['site_slug_encoded'];
			},
		),

		'customize_welcome_message'       => array(
			'get_title'            => function () {
				return __( 'Customize welcome message', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'admin.php?page=jetpack#/newsletter' );
				}
				return '/settings/newsletter/' . $data['site_slug_encoded'];
			},
		),
		'enable_subscribers_modal'        => array(
			'get_title'            => function () {
				return __( 'Enable subscribers modal', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'admin.php?page=jetpack#/newsletter' );
				}
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
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'post-new.php' );
				}
				return '/post/' . $data['site_slug_encoded'];
			},
		),
		'manage_subscribers'              => array(
			'get_title'            => function () {
				return __( 'Manage your subscribers', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_has_goal_import_subscribers',
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
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_has_goal_paid_subscribers',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/earn/payments/' . $data['site_slug_encoded'];
			},
		),
		'add_about_page'                  => array(
			'get_title'            => function () {
				return __( 'Add your About page', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_add_about_page_visible',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'post-new.php?post_type=page' );
				}
				return '/page/' . $data['site_slug_encoded'];
			},
		),

		// Earn tasks
		'stripe_connected'                => array(
			'get_title'            => function () {
				return __( 'Connect a Stripe account to collect payments', 'jetpack-mu-wpcom' );
			},
			'is_visible_callback'  => '__return_true',
			'is_complete_callback' => 'wpcom_launchpad_is_stripe_connected',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( function_exists( 'get_memberships_connected_account_redirect' ) ) {
					return get_memberships_connected_account_redirect(
						get_current_user_id(),
						get_current_blog_id(),
						'earn-launchpad'
					);
				}
				return '/earn/payments/' . $data['site_slug_encoded'];
			},
		),
		'paid_offer_created'              => array(
			'get_title'            => function () {
				return __( 'Set up an offer for your supporters', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_has_paid_membership_plans',
			'is_visible_callback'  => '__return_true',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/earn/payments/' . $data['site_slug_encoded'] . '#add-new-payment-plan';
			},
		),

		// Hosting flow tasks
		'site_theme_selected'             => array(
			'get_title'            => function () {
				return __( 'Choose a theme', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'themes.php' );
				}
				return '/themes/' . $data['site_slug_encoded'];
			},
		),
		'install_custom_plugin'           => array(
			'get_title'            => function () {
				return __( 'Install a custom plugin', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				if ( wpcom_launchpad_should_use_wp_admin_link() ) {
					return admin_url( 'plugins.php' );
				}
				return '/plugins/' . $data['site_slug_encoded'];
			},
		),
		'setup_ssh'                       => array(
			'get_title'            => function () {
				return __( 'Set up ssh', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/hosting-config/' . $data['site_slug_encoded'] . '#sftp-credentials';
			},
		),
		'site_monitoring_page'            => array(
			'get_title'            => function () {
				return __( 'View site metrics', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/site-monitoring/' . $data['site_slug_encoded'];
			},
		),
		'import_subscribers'              => array(
			'get_title'            => function () {
				return __( 'Import existing subscribers', 'jetpack-mu-wpcom' );
			},
			'id_map'               => 'subscribers_added',
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => '__return_true',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/subscribers/' . $data['site_slug_encoded'] . '#add-subscribers';
			},
		),
		'add_subscribe_block'             => array(
			'get_title'            => function () {
				return __( 'Add the Subscribe Block to your site', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_add_subscribe_block_visible',
			'get_calypso_path'     => function () {
				return admin_url( 'site-editor.php?canvas=edit&help-center=subscribe-block' );
			},
		),
		'mobile_app_installed'            => array(
			'get_title'            => function () {
				return __( 'Install the mobile app', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_mobile_app_installed',
			'get_calypso_path'     => function () {
				return '/me/get-apps';
			},
		),
		'post_sharing_enabled'            => array(
			'get_title'            => function () {
				return __( 'Enable post sharing', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/marketing/connections/' . $data['site_slug_encoded'];
			},
		),
		'front_page_updated'              => array(
			'get_title'            => function () {
				return __( "Update your site's design", 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_front_page_updated_visible',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				$page_on_front = get_option( 'page_on_front', false );
				if ( $page_on_front ) {
					if ( wpcom_launchpad_should_use_wp_admin_link() ) {
						return admin_url( 'post.php?post=' . $page_on_front . '&action=edit' );
					}
					return '/page/' . $data['site_slug_encoded'] . '/' . $page_on_front;
				}
				return admin_url( 'site-editor.php?canvas=edit' );
			},
		),
		'woocommerce_setup'               => array(
			'get_title'            => function () {
				return __( 'Finish store setup', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_woocommerce_setup_visible',
			'get_calypso_path'     => function () {
				return site_url( '/wp-admin/admin.php?page=wc-admin' );
			},
		),
		'sensei_setup'                    => array(
			'get_title'            => function () {
				return __( 'Finish Sensei setup', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_sensei_setup_visible',
			'get_calypso_path'     => function () {
				return site_url( '/wp-admin/admin.php?page=sensei' );
			},
		),
		'verify_domain_email'             => array(
			'get_title'            => function () {
				return __( 'Verify the email address for your domains', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_verify_domain_email_visible',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/domains/manage/' . $data['site_slug_encoded'];
			},
		),

		// WooCommerce tasks
		'woo_customize_store'             => array(
			'get_title'            => function () {
				return __( 'Customize your store', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_woocommerce_task_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_woocommerce_setup_visible',
			'get_calypso_path'     => function () {
				return site_url( '/wp-admin/admin.php?page=wc-admin&path=%2Fcustomize-store' );
			},
		),
		'woo_products'                    => array(
			'get_title'            => function () {
				return __( 'Add your products', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_woocommerce_task_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_woocommerce_setup_visible',
			'get_calypso_path'     => function () {
				return site_url( '/wp-admin/admin.php?page=wc-admin&task=products' );
			},
		),
		'woo_woocommerce_payments'        => array(
			'get_title'            => function () {
				return __( 'Get paid with WooPayments', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_woocommerce_task_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_woocommerce_setup_visible',
			'get_calypso_path'     => function () {
				return site_url( '/wp-admin/admin.php?page=wc-admin&task=woocommerce-payments' );
			},
		),
		'woo_tax'                         => array(
			'get_title'            => function () {
				return __( 'Collect sales tax', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_woocommerce_task_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_woocommerce_setup_visible',
			'get_calypso_path'     => function () {
				return site_url( '/wp-admin/admin.php?page=wc-admin&task=tax' );
			},
		),
		'woo_marketing'                   => array(
			'get_title'            => function () {
				return __( 'Grow your business', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_woocommerce_task_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_woocommerce_setup_visible',
			'get_calypso_path'     => function () {
				return site_url( '/wp-admin/admin.php?page=wc-admin&task=marketing' );
			},
		),
		'woo_add_domain'                  => array(
			'get_title'            => function () {
				return __( 'Add a domain', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_woocommerce_task_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_woocommerce_setup_visible',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				return '/domains/add/' . $data['site_slug_encoded'];
			},
		),
		'woo_launch_site'                 => array(
			'get_title'            => function () {
				return __( 'Launch your store', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_woocommerce_task_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_woocommerce_setup_visible',
			'get_calypso_path'     => function () {
				return site_url( '/wp-admin/admin.php?page=wc-admin&task=launch_site' );
			},
		),
		'migrating_site'                  => array(
			'get_title'            => function () {
				return __( 'Migrating the site', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => '__return_true',
			'is_visible_callback'  => '__return_true',
		),
		// Post-migration tasks.
		'review_site'                     => array(
			'get_title'            => function () {
				return __( "Review the site's content", 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => '__return_true',
		),
		'review_plugins'                  => array(
			'get_title'             => function () {
				return __( 'Review the migrated plugins', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback'  => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'   => '__return_true',
			'add_listener_callback' => function () {
				add_action( 'pre_current_active_plugins', 'wpcom_launchpad_mark_review_plugins_complete' );
			},
			'get_calypso_path'      => function () {
				return admin_url( 'plugins.php' );
			},
		),
		'connect_migration_domain'        => array(
			'get_title'            => function () {
				return __( 'Connect your domain', 'jetpack-mu-wpcom' );
			},
			'get_calypso_path'     => function ( $task, $default, $data ) {
				$site_id = get_current_blog_id();
				// Attempt to get the domain from the pre-transfer site option if the function exists, otherwise check the current site option.
				// @phan-suppress-next-line PhanUndeclaredFunction -- Being checked before being called.
				$domain = function_exists( 'wpcom_get_migration_source_site_domain' ) ? wpcom_get_migration_source_site_domain( $site_id ) : get_option( 'migration_source_site_domain', null );
				$path   = $domain ? '/domains/add/use-my-domain/' . $data['site_slug_encoded'] . '/?initialQuery=' . $domain : '/domains/add/use-my-domain/' . $data['site_slug_encoded'];
				return $path;
			},
			'is_complete_callback' => 'wpcom_launchpad_is_domain_customize_completed',
			'is_visible_callback'  => '__return_true',
		),
		'domain_dns_mapped'               => array(
			'get_title'            => function () {
				return __( "Update your domain's DNS", 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => '__return_true',
		),
		'check_ssl_status'                => array(
			'get_title'            => function () {
				return __( 'Provision SSL certificate', 'jetpack-mu-wpcom' );
			},
			'is_complete_callback' => 'wpcom_launchpad_is_task_option_completed',
			'is_visible_callback'  => 'wpcom_launchpad_is_ssl_task_visible',
			'get_calypso_path'     => function ( $task, $default, $data ) {
				$domain = $data['site_slug_encoded'];
				return '/domains/manage/' . $domain . '/edit/' . $domain;
			},
		),
	);

	$extended_task_definitions = apply_filters( 'wpcom_launchpad_extended_task_definitions', array() );

	return array_merge( $extended_task_definitions, $task_definitions );
}

/**
 * Returns true if the current site is launched.
 *
 * @param Task $task The task object.
 * @param bool $is_complete The current task status.
 *
 * @return boolean
 */
function wpcom_launchpad_is_site_launched( $task, $is_complete ) {
	if ( $is_complete ) {
		return true;
	}

	$launch_status = get_option( 'launch-status' );

	if ( 'launched' === $launch_status ) {
		wpcom_mark_launchpad_task_complete( 'site_launched' );
		return true;
	} else {
		return false;
	}
}

/**
 * Returns true if one of the site's WooCommerce tasks is complete.
 *
 * @param Task $task The task object.
 * @param bool $is_complete The current task status.
 *
 * @return boolean
 */
function wpcom_launchpad_is_woocommerce_task_completed( $task, $is_complete ) {
	if ( $is_complete ) {
		return true;
	}

	// Array mapping task 'id' from $task to keys used in 'woocommerce_task_list_tracked_completed_tasks' site option
	$task_map = array(
		'woo_customize_store'      => 'customize-store',
		'woo_products'             => 'products',
		'woo_woocommerce_payments' => 'woocommerce-payments',
		'woo_tax'                  => 'tax',
		'woo_marketing'            => 'marketing',
		'woo_add_domain'           => 'add_domain',
		'woo_launch_site'          => 'launch_site',
	);

	$completed_tasks = get_option( 'woocommerce_task_list_tracked_completed_tasks', array() );

	if ( array_key_exists( $task['id'], $task_map ) && in_array( $task_map[ $task['id'] ], $completed_tasks, true ) ) {
		wpcom_mark_launchpad_task_complete( $task['id'] );
		return true;
	} else {
		return false;
	}
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
 * Also included wp-content/lib/memberships/connected-accounts.php#36
 * and wp-content/lib/memberships/class.membership-product.php#497
 *
 * @param string $task_id The task ID that should be marked as complete.
 *
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
 * @param Task[] $task_definitions The tasks to initialize.
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
function wpcom_launchpad_mark_launchpad_task_complete_if_active( $task_id ) {
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
function wpcom_launchpad_track_edit_site_task() {
	wpcom_launchpad_mark_launchpad_task_complete_if_active( 'links_added' );
	wpcom_launchpad_mark_launchpad_task_complete_if_active( 'design_edited' );
}

/**
 * Callback for design task enabled state
 *
 * @return boolean
 */
function wpcom_launchpad_is_design_step_enabled() {
	return ! wpcom_can_update_design_selected_task();
}

/**
 * Determines whether or not domain upsell task is completed.
 *
 * @param Task  $task    The Task object.
 * @param mixed $default The default value.
 * @return bool True if domain upsell task is completed.
 */
function wpcom_launchpad_is_domain_upsell_completed( $task, $default ) {
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
function wpcom_launchpad_get_domain_upsell_badge_text() {
	// Never run `wpcom_is_checklist_task_complete` within a is_complete_callback unless you are fond of infinite loops.
	return wpcom_is_checklist_task_complete( 'domain_upsell' ) ? '' : __( 'Upgrade plan', 'jetpack-mu-wpcom' );
}

/**
 * Determines whether or not domain upsell task should be visible.
 *
 * @return bool True if user is on a free plan.
 */
function wpcom_launchpad_is_domain_upsell_task_visible() {
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
 * Verifies if the Mobile App is installed for the current user.
 *
 * @param Task $task The task object.
 * @param bool $is_complete The current task status.
 * @return bool True if the Mobile App is installed for the current user.
 */
function wpcom_launchpad_is_mobile_app_installed( $task, $is_complete ) {
	if ( $is_complete ) {
		return true;
	}

	$has_used_jetpack_app = null;
	$is_atomic_site       = ( new Automattic\Jetpack\Status\Host() )->is_woa_site();
	if ( $is_atomic_site ) {
		$user_attributes = wpcom_launchpad_request_user_attributes( array( 'has_used_jetpack_app' ) );
		if ( is_wp_error( $user_attributes ) ) {
			return false;
		}

		if ( ! isset( $user_attributes['has_used_jetpack_app'] ) ) {
			return false;
		}

		$has_used_jetpack_app = $user_attributes['has_used_jetpack_app'];
	} else {
		if ( ! function_exists( 'get_user_attribute' ) ) {
			return false;
		}

		$user_id              = get_current_user_id();
		$has_used_jetpack_app = get_user_attribute( $user_id, 'jp_mobile_app_last_seen' );
	}

	if ( empty( $has_used_jetpack_app ) ) {
		return false;
	}

	wpcom_mark_launchpad_task_complete( 'mobile_app_installed' );

	return true;
}

/**
 * Determines whether or not the WooCommerce setup task should be visible.
 *
 * @param Task $task The task object.
 * @return bool True if the site is a WOA site and WooCommerce is active.
 */
function wpcom_launchpad_is_woocommerce_setup_visible( $task ) {
	// Get current plan
	$is_ecommerce_trial_plan = false;
	if ( function_exists( 'wpcom_get_site_purchases' ) ) {
		$purchases = wpcom_get_site_purchases();
		foreach ( $purchases as $purchase ) {
			if ( 'ecommerce-trial-bundle-monthly' === $purchase->product_slug ) {
				$is_ecommerce_trial_plan = true;
				break;
			}
		}
	}

	// Hide these tasks in ecommerce trial plan
	if ( in_array( $task['id'], array( 'woo_marketing', 'woo_launch_site' ), true ) && $is_ecommerce_trial_plan ) {
		return false;
	}

	$is_atomic_site = ( new Automattic\Jetpack\Status\Host() )->is_woa_site();
	if ( ! $is_atomic_site ) {
		return false;
	}

	return is_plugin_active( 'woocommerce/woocommerce.php' );
}

/**
 * Determines wheter or not the sensei setup task should be visible.
 *
 * @return bool True if the sensei setup task should be visible.
 */
function wpcom_launchpad_is_sensei_setup_visible() {
	$is_atomic_site = ( new Automattic\Jetpack\Status\Host() )->is_woa_site();
	if ( ! $is_atomic_site ) {
		return false;
	}

	return is_plugin_active( 'sensei-lms/sensei-lms.php' );
}

/**
 * Determines whether or not the verify domain email task should be visible.
 *
 * @return bool True if the verify domain email task should be visible.
 */
function wpcom_launchpad_is_verify_domain_email_visible() {
	// If the task is complete, we should show it and prevent the logic below
	// to be executed.
	if ( wpcom_is_checklist_task_complete( 'verify_domain_email' ) ) {
		return true;
	}

	$domains_pending_icann_verification = array();

	// For Atomic sites we need to get the domain list from
	// the public API.
	$is_atomic_site = ( new Automattic\Jetpack\Status\Host() )->is_woa_site();
	if ( $is_atomic_site ) {
		$domains = wpcom_launchpad_request_domains_list();

		if ( is_wp_error( $domains ) ) {
			return false;
		}

		$domains_pending_icann_verification = array_filter(
			$domains,
			function ( $domain ) {
				return isset( $domain->is_pending_icann_verification ) && $domain->is_pending_icann_verification;
			}
		);
	} else {
		if ( ! class_exists( 'Domain_Management' ) ) {
			return false;
		}

		$domains = \Domain_Management::get_paid_domains_with_icann_verification_status();

		$domains_pending_icann_verification = array_filter(
			$domains,
			function ( $domain ) {
				return isset( $domain['is_pending_icann_verification'] ) && $domain['is_pending_icann_verification'];
			}
		);
	}

	$has_domains_pending_icann_verification = ! empty( $domains_pending_icann_verification );

	if ( ! $has_domains_pending_icann_verification && wpcom_launchpad_verify_domain_email_task_displayed() ) {
		wpcom_mark_launchpad_task_complete( 'verify_domain_email' );
		return true;
	}

	if ( $has_domains_pending_icann_verification ) {
		if ( ! wpcom_launchpad_verify_domain_email_task_displayed() ) {
			wpcom_set_launchpad_config_option( 'verify_domain_email_task_displayed', true );
		}
		return true;
	}

	return false;
}

/**
 * Checks if the Verify Email Domain task was displayed to the user.
 */
function wpcom_launchpad_verify_domain_email_task_displayed() {
	return wpcom_get_launchpad_config_option( 'verify_domain_email_task_displayed', false );
}

/**
 * Make a request to the WordPress.com API to get the domain list for the current site.
 *
 * @return array|WP_Error Array of domains and their verification status or WP_Error if the request fails.
 */
function wpcom_launchpad_request_domains_list() {
	// Use a static variable as a temporary in-memory cache to avoid multiple outbound
	// HTTP requests within a single incoming request.
	// We don't expect this to be triggered multiple times, but it's worth adding some
	// light caching to avoid multiple, possibly slow HTTP requests where the underlying data
	// is highly unlikely to change.
	// The "cache" only lasts as long as the current request/memory space, so we don't need to invalidate it.
	static $cached_domains = null;

	if ( $cached_domains !== null ) {
		return $cached_domains;
	}

	$site_id       = \Jetpack_Options::get_option( 'id' );
	$request_path  = sprintf( '/sites/%d/domains', $site_id );
	$wpcom_request = Automattic\Jetpack\Connection\Client::wpcom_json_api_request_as_blog(
		$request_path,
		'1.2',
		array(
			'method'  => 'GET',
			'headers' => array(
				'content-type'    => 'application/json',
				'X-Forwarded-For' => ( new Automattic\Jetpack\Status\Visitor() )->get_ip( true ),
			),
		),
		null,
		'rest'
	);

	$response_code = wp_remote_retrieve_response_code( $wpcom_request );
	if ( 200 !== $response_code ) {
		return new \WP_Error(
			'failed_to_fetch_data',
			esc_html__( 'Unable to fetch the requested data.', 'jetpack-mu-wpcom' ),
			array( 'status' => $response_code )
		);
	}

	$body         = wp_remote_retrieve_body( $wpcom_request );
	$decoded_body = json_decode( $body );

	if ( ! isset( $decoded_body->domains ) || ! is_array( $decoded_body->domains ) ) {
		return new \WP_Error(
			'failed_to_fetch_data',
			esc_html__( 'Unable to fetch the requested data.', 'jetpack-mu-wpcom' )
		);
	}

	$cached_domains = $decoded_body->domains;

	return $cached_domains;
}

/**
 * Make a request to the WordPress.com API to get the values of the user
 * attributes sent by the client.
 *
 * @param string[]                                  $attributes The attributes to request.
 * @param Automattic\Jetpack\Connection\Client|null $client_wrapper Optional client wrapper to use, this is only used for testing.
 * @return array|WP_Error Array of user attributes or WP_Error if the request fails.
 */
function wpcom_launchpad_request_user_attributes( $attributes, $client_wrapper = null ) {
	if ( ! is_array( $attributes ) || $attributes === array() ) {
		return array();
	}
	// Use a static variable as a temporary in-memory cache to avoid multiple outbound
	// HTTP requests within a single incoming request.
	// We don't expect this to be triggered multiple times, but it's worth adding some
	// light caching to avoid multiple, possibly slow HTTP requests where the underlying data
	// is highly unlikely to change.
	// The "cache" only lasts as long as the current request/memory space, so we don't need to invalidate it.
	static $cached_attributes = array();

	// Check if all requested attributes are available in the cache
	$resolved_values = array_intersect_key( $cached_attributes, array_flip( $attributes ) );
	if ( count( $resolved_values ) === count( $attributes ) ) {
		return $resolved_values;
	}

	$attributes_to_fetch = array_diff( $attributes, array_keys( $resolved_values ) );

	$query_params  = build_query( array( 'attributes' => $attributes_to_fetch ) );
	$client        = $client_wrapper ? $client_wrapper : new Automattic\Jetpack\Connection\Client();
	$wpcom_request = $client->wpcom_json_api_request_as_user(
		'/jetpack-user-attributes?' . $query_params,
		'v2',
		array(
			'method'  => 'GET',
			'headers' => array(
				'X-Forwarded-For' => ( new Automattic\Jetpack\Status\Visitor() )->get_ip( true ),
			),
		)
	);

	$response_code = wp_remote_retrieve_response_code( $wpcom_request );
	if ( 200 !== $response_code ) {
		return new \WP_Error(
			'failed_to_fetch_data',
			esc_html__( 'Unable to fetch the requested data.', 'jetpack-mu-wpcom' ),
			array( 'status' => $response_code )
		);
	}

	$body         = wp_remote_retrieve_body( $wpcom_request );
	$decoded_body = json_decode( $body );

	if ( ! isset( $decoded_body->user_attributes ) ) {
		return new \WP_Error(
			'failed_to_fetch_data',
			esc_html__( 'Unable to fetch the requested data.', 'jetpack-mu-wpcom' )
		);
	}

	$user_attributes = get_object_vars( $decoded_body->user_attributes );
	if ( ! is_array( $user_attributes ) ) {
		return new \WP_Error(
			'failed_to_fetch_data',
			esc_html__( 'Unable to fetch the requested data.', 'jetpack-mu-wpcom' )
		);
	}

	$cached_attributes = array_merge( $cached_attributes, $user_attributes );

	return $cached_attributes;
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
 * Determines if Stripe has been connected.
 *
 * @return bool Whether Stripe account is connected.
 */
function wpcom_launchpad_is_stripe_connected() {
	$membership_settings = wpcom_launchpad_get_membership_settings();
	if ( ! $membership_settings ) {
		return false;
	}
	return isset( $membership_settings['connected_account_id'] ) && $membership_settings['connected_account_id'] !== '';
}

/**
 * Determines if any paid membership plan exists.
 *
 * @return bool Whether paid plan exists.
 */
function wpcom_launchpad_has_paid_membership_plans() {
	$membership_settings = wpcom_launchpad_get_membership_settings();
	if ( ! $membership_settings ) {
		return false;
	}
	return isset( $membership_settings['products'] ) && is_array( $membership_settings['products'] ) && ( count( $membership_settings['products'] ) > 0 );
}

/**
 * Get membership settings.
 *
 * @return array|null Membership settings or null.
 */
function wpcom_launchpad_get_membership_settings() {
	$is_atomic = defined( 'IS_ATOMIC' ) && IS_ATOMIC;

	// Memberships lib is only available on Simple sites.
	// A follow up will fetch membership settings for Atomic.
	if ( $is_atomic ) {
		return null;
	}

	require_lib( 'memberships' );
	$blog_id  = get_current_blog_id();
	$settings = (array) get_memberships_settings_for_site( $blog_id );
	return $settings;
}

/**
 * Callback for completing first post published task.
 *
 * @return void
 */
function wpcom_launchpad_track_publish_first_post_task() {
	// Ensure that Headstart posts don't mark this as complete.
	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return;
	}
	// Since we share the same callback for generic first post and newsletter-specific, we mark both.
	wpcom_launchpad_mark_launchpad_task_complete_if_active( 'first_post_published' );
	wpcom_launchpad_mark_launchpad_task_complete_if_active( 'first_post_published_newsletter' );
}

/**
 * Gets the number of published posts that were not created by Headstart.
 *
 * @return int
 */
function wpcom_launchpad_get_published_non_headstart_posts_count() {
	// Ensure that Headstart posts don't affect the count.
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
	if ( wpcom_launchpad_is_task_option_completed( array( 'id' => 'write_3_posts' ) ) ) {
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
 * @param Task $task The Task definition.
 * @return int
 */
function wpcom_launchpad_get_write_3_posts_repetition_count( $task ) {
	$published_non_headstart_posts = wpcom_launchpad_get_published_non_headstart_posts_count();

	return min( $task['target_repetitions'], $published_non_headstart_posts );
}

/**
 * Returns the option value for a task and false if no option exists.
 *
 * @param Task $task The task data.
 * @return bool True if the option for the task is marked as complete, false otherwise.
 */
function wpcom_launchpad_is_task_option_completed( $task ) {
	$checklist = get_option( 'launchpad_checklist_tasks_statuses', array() );
	if ( ! empty( $checklist[ $task['id'] ] ) ) {
		return true;
	}
	if ( isset( $task['id_map'] ) && ! empty( $checklist[ $task['id_map'] ] ) ) {
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
 * @param Task $task              The task data.
 * @param bool $is_option_complete Whether the underlying option has already been marked as complete.
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
function wpcom_launchpad_get_plan_selected_subtitle() {
	if ( ! function_exists( 'wpcom_global_styles_in_use' ) || ! function_exists( 'wpcom_should_limit_global_styles' ) ) {
		return '';
	}

	return wpcom_global_styles_in_use() && wpcom_should_limit_global_styles()
		? __(
			'Your site contains premium styles. Upgrade now to publish them and unlock tons of other features.',
			'jetpack-mu-wpcom'
		) : '';
}

/**
 * Returns the badge text for the plan selected task
 *
 * @return string Badge text
 */
function wpcom_launchpad_get_plan_selected_badge_text() {
	if ( ! function_exists( 'wpcom_global_styles_in_use' ) || ! function_exists( 'wpcom_should_limit_global_styles' ) ) {
		return '';
	}

	return wpcom_global_styles_in_use() && wpcom_should_limit_global_styles() ? __( 'Upgrade plan', 'jetpack-mu-wpcom' ) : '';
}

/**
 * Callback for completing site launched task.
 *
 * Also included in bin/tests/isolated/suites/Guides/observer-modules/OnboardingUseCaseBlogTest.php
 *
 * @return void
 */
function wpcom_track_site_launch_task() {
	// it would be ideal if the registry was smart enough to map based on id_map but it isn't.
	// So we mark them all. We'd avoid this if we had dedicated callbacks for each task.
	wpcom_launchpad_mark_launchpad_task_complete_if_active( 'site_launched' );
	wpcom_launchpad_mark_launchpad_task_complete_if_active( 'link_in_bio_launched' );
	wpcom_launchpad_mark_launchpad_task_complete_if_active( 'videopress_launched' );
	wpcom_launchpad_mark_launchpad_task_complete_if_active( 'blog_launched' );

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
 * Mark the plugins reviewed task as complete.
 *
 * @return void
 */
function wpcom_launchpad_mark_review_plugins_complete() {
	wpcom_mark_launchpad_task_complete( 'review_plugins' );
}
/**
 * Callback that conditionally adds the site launch listener based on platform.
 *
 * @return void
 */
function wpcom_launchpad_add_site_launch_listener() {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		add_action( 'wpcom_site_launched', 'wpcom_track_site_launch_task' );
	} else {
		add_action( 'update_option_blog_public', 'wpcom_launchpad_launch_task_listener_atomic', 10, 2 );
	}
}

/**
 * Callback that fires when `blog_public` is updated.
 *
 * @param string $old_value The updated option value.
 * @param string $new_value The previous option value.
 * @return void
 */
function wpcom_launchpad_launch_task_listener_atomic( $old_value, $new_value ) {
	$blog_public = (int) $new_value;
	// 'blog_public' is set to '1' when a site is launched.
	if ( $blog_public === 1 ) {
		wpcom_track_site_launch_task();
	}
}

/**
 * Callback for email verification completion.
 *
 * @return bool True if email is verified, false otherwise.
 */
function wpcom_launchpad_is_email_verified() {
	// TODO: handle the edge case where an Atomic user can be unverified.
	if ( ! class_exists( 'Email_Verification' ) ) {
		return true;
	}

	return ! Email_Verification::is_email_unverified();
}

/**
 * If the site has a paid-subscriber goal.
 *
 * @return bool True if the site has a paid-subscriber goal, false otherwise.
 */
function wpcom_launchpad_has_goal_paid_subscribers() {
	return in_array( 'paid-subscribers', get_option( 'site_goals', array() ), true );
}

/**
 * If the site has a import-subscriber goal.
 *
 * @return bool True if the site has a import-subscriber goal, false otherwise.
 */
function wpcom_launchpad_has_goal_import_subscribers() {
	return in_array( 'import-subscribers', get_option( 'site_goals', array() ), true );
}

/**
 * Determines whether or not the link-in-bio launch task is enabled
 *
 * @return boolean True if link-in-bio launch task is enabled
 */
function wpcom_launchpad_is_link_in_bio_launch_disabled() {
	return ! wpcom_is_checklist_task_complete( 'links_added' );
}

/**
 * Determines whether or not the videopress launch task is enabled
 *
 * @return boolean True if videopress launch task is enabled
 */
function wpcom_launchpad_is_videopress_launch_disabled() {
	return ! wpcom_is_checklist_task_complete( 'videopress_upload' );
}

/**
 * Determines whether or not the blog launch task is enabled
 *
 * @return boolean True if blog launch task is enabled
 */
function wpcom_launchpad_is_blog_launched_task_disabled() {
	if ( 'design-first' === get_option( 'site_intent' ) ) {
		// We only want the blog_launched task enabled after other key tasks are all complete.
		if ( wpcom_is_checklist_task_complete( 'plan_completed' )
			&& wpcom_is_checklist_task_complete( 'domain_upsell' )
			&& wpcom_is_checklist_task_complete( 'setup_blog' ) ) {
			return false;
		}
		return true;
	}
	if ( 'start-writing' === get_option( 'site_intent' ) ) {
		if ( wpcom_is_checklist_task_complete( 'plan_completed' )
			&& wpcom_is_checklist_task_complete( 'domain_upsell' )
			&& wpcom_is_checklist_task_complete( 'setup_blog' )
			&& wpcom_is_checklist_task_complete( 'first_post_published' ) ) {
			return false;
		}
		return true;
	}
	return false;
}

/**
 * Determines whether or not the videopress upload task is enabled
 *
 * @return boolean True if videopress upload task is enabled
 */
function wpcom_launchpad_is_videopress_upload_disabled() {
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
function wpcom_launchpad_track_video_uploaded_task( $post_id ) {
	// Not using `wp_attachment_is` because it requires the actual file
	// which is not the case for Atomic VideoPress.
	if ( ! str_starts_with( get_post_mime_type( $post_id ), 'video/' ) ) {
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
function wpcom_launchpad_mark_site_title_complete( $old_value, $value ) {
	if ( $value !== $old_value ) {
		wpcom_mark_launchpad_task_complete( 'site_title' );
	}
}
add_action( 'update_option_blogname', 'wpcom_launchpad_mark_site_title_complete', 10, 3 );

/**
 * Mark the setup site task as complete if the value is changed.
 *
 * @param string $old_value The old value of the site title.
 * @param string $value The new value of the site title.
 *
 * @return void
 */
function wpcom_launchpad_mark_setup_site_tasks_complete( $old_value, $value ) {
	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return;
	}

	if ( wp_installing() ) {
		return;
	}

	if ( $value !== $old_value ) {
		wpcom_mark_launchpad_task_complete( 'setup_free' );
	}
}
add_action( 'update_option_blogname', 'wpcom_launchpad_mark_setup_site_tasks_complete', 10, 3 );
add_action( 'update_option_blogdescription', 'wpcom_launchpad_mark_setup_site_tasks_complete', 10, 3 );
add_action( 'update_option_site_icon', 'wpcom_launchpad_mark_setup_site_tasks_complete', 10, 3 );
add_action( 'update_option_site_logo', 'wpcom_launchpad_mark_setup_site_tasks_complete', 10, 3 );

/**
 * Mark the setup_general task as complete if the site title or the site description is changed.
 *
 * @param string $old_value The old value of the site title.
 * @param string $value The new value of the site title.
 *
 * @return void
 */
function wpcom_launchpad_mark_setup_general_task_complete( $old_value, $value ) {
	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return;
	}

	if ( wp_installing() ) {
		return;
	}

	if ( $old_value !== $value ) {
		wpcom_mark_launchpad_task_complete( 'setup_general' );
	}
}
add_action( 'update_option_blogname', 'wpcom_launchpad_mark_setup_general_task_complete', 10, 3 );
add_action( 'update_option_blogdescription', 'wpcom_launchpad_mark_setup_general_task_complete', 10, 3 );

/**
 * Mark the enable_subscribers_modal task complete
 * if its option is updated to `true`.
 *
 * @param string $old_value The old value of the option.
 * @param string $value The new value of the option.
 *
 * @return void
 */
function wpcom_launchpad_mark_enable_subscribers_modal_complete( $old_value, $value ) {
	if ( $value ) {
		wpcom_mark_launchpad_task_complete( 'enable_subscribers_modal' );
	}
}
add_action( 'update_option_sm_enabled', 'wpcom_launchpad_mark_enable_subscribers_modal_complete', 10, 3 );
add_action( 'add_option_sm_enabled', 'wpcom_launchpad_mark_enable_subscribers_modal_complete', 10, 3 );

/**
 * Mark the Sensei setup task as complete if the value is changed.
 *
 * @param string $old_value The old value of the option.
 * @param string $value The new value of the option.
 *
 * @return void
 */
function wpcom_launchpad_mark_sensei_setup_complete( $old_value, $value ) {
	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return;
	}

	if ( wp_installing() ) {
		return;
	}

	if ( true === $value ) {
		wpcom_mark_launchpad_task_complete( 'sensei_setup' );
	}
}
add_action( 'update_option_sensei_home_tasks_list_is_completed', 'wpcom_launchpad_mark_sensei_setup_complete', 10, 3 );
add_action( 'add_option_sensei_home_tasks_list_is_completed', 'wpcom_launchpad_mark_sensei_setup_complete', 10, 3 );

/**
 * Determine `domain_claim` task visibility.
 *
 * @return bool True if we should show the task, false otherwise.
 */
function wpcom_launchpad_domain_claim_is_visible_callback() {
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
function wpcom_launchpad_is_domain_claim_completed() {
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
 * @param int     $post_id The ID of the post being updated.
 * @param ?object $post    The post object.
 */
function wpcom_launchpad_add_new_page_check( $post_id, $post = null ) {
	// There are cases when plugins trigger insert hooks without arguments, we just return in this case.
	if ( null === $post ) {
		return;
	}

	// Don't do anything if the task is already complete.
	if ( wpcom_launchpad_is_task_option_completed( array( 'id' => 'add_new_page' ) ) ) {
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
	if ( $post_id === wpcom_launchpad_get_site_about_page_id() ) {
		return;
	}

	wpcom_mark_launchpad_task_complete( 'add_new_page' );
}
add_action( 'wp_insert_post', 'wpcom_launchpad_add_new_page_check', 10, 3 );

/**
 * Return the about page id, if any.
 *
 * This function will retrieve the page from the cache whenever possible.
 *
 * @return int|null The page ID of the 'About' page if it exists, null otherwise.
 */
function wpcom_launchpad_get_site_about_page_id() {
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
	$about_page_id = wpcom_launchpad_find_site_about_page_id();

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
function wpcom_launchpad_find_site_about_page_id() {
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
			if ( isset( $page['post_type'] ) && 'page' !== $page['post_type'] ) {
				return false;
			}

			if ( isset( $page['post_name'] ) && 'about' === $page['post_name'] ) {
				return true;
			}
			if ( isset( $page['post_title'] ) && str_contains( $page['post_title'], 'About' ) ) {
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
	if ( is_string( $current_locale ) && str_starts_with( $current_locale, 'en' ) ) {
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
	return ! wpcom_launchpad_is_update_about_page_task_visible() && registered_meta_key_exists( 'post', '_wpcom_template_layout_category', 'page' );
}

/**
 * Determine `front_page_updated` task visibility.
 *
 * @return bool True if we should show the task, false otherwise.
 */
function wpcom_launchpad_is_front_page_updated_visible() {
	$show_on_front = get_option( 'show_on_front' );
	$blog_on_front = $show_on_front === 'posts' || ( $show_on_front === 'page' && get_option( 'page_on_front' ) === '0' );

	if ( $blog_on_front && ! wp_is_block_theme() ) {
		return false;
	}

	return true;
}

/**
 * Determine `site_title` task visibility. The task is not visible if the name was already set.
 *
 * @return bool True if we should show the task, false otherwise.
 */
function wpcom_launchpad_is_site_title_task_visible() {
	// Hide the task if it's already completed on write intent
	if ( get_option( 'site_intent' ) === 'write' && wpcom_launchpad_is_task_option_completed( array( 'id' => 'site_title' ) ) ) {
		return false;
	}
	return true;
}
/**
 * Completion hook for the `add_about_page` task.
 *
 * @param int     $post_id The post ID.
 * @param ?object $post    The post object.
 */
function wpcom_launchpad_add_about_page_check( $post_id, $post = null ) {
	// There are cases when plugins trigger insert hooks without arguments, we just return in this case.
	if ( null === $post ) {
		return;
	}

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
	if ( wpcom_launchpad_is_task_option_completed( array( 'id' => 'add_about_page' ) ) ) {
		return;
	}

	// If the page is the previously located About page, ignore it.
	$about_page_id = wpcom_launchpad_get_site_about_page_id();
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
 * Completion hook for the `front_page_updated` task.
 *
 * @param int     $post_id The post ID.
 * @param ?object $post    The post object.
 * @return void
 */
function wpcom_launchpad_front_page_updated_check( $post_id, $post = null ) {
	// There are cases when plugins trigger insert hooks without arguments, we just return in this case.
	if ( null === $post ) {
		return;
	}

	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return;
	}

	// We only care about pages, ignore other post types.
	if ( $post->post_type !== 'page' ) {
		return;
	}

	// Don't do anything if the task is already complete.
	if ( wpcom_launchpad_is_task_option_completed( array( 'id' => 'front_page_updated' ) ) ) {
		return;
	}

	// We only complete the task if the page is the front page.
	$front_page_id = (int) get_option( 'page_on_front' );
	if ( $post_id !== $front_page_id ) {
		return;
	}

	wpcom_mark_launchpad_task_complete( 'front_page_updated' );
}
add_action( 'wp_insert_post', 'wpcom_launchpad_front_page_updated_check', 10, 3 );

/**
 * We also need to complete the `front_page_updated` task when the front page option is updated.
 *
 * @return void
 */
function wpcom_launchpad_front_page_updated_option_check() {
	if ( defined( 'HEADSTART' ) && HEADSTART ) {
		return;
	}

	// Don't do anything if the task is already complete.
	if ( wpcom_launchpad_is_task_option_completed( array( 'id' => 'front_page_updated' ) ) ) {
		return;
	}

	wpcom_mark_launchpad_task_complete( 'front_page_updated' );
}
add_action( 'update_option_page_on_front', 'wpcom_launchpad_front_page_updated_option_check', 10, 3 );
add_action( 'add_option_page_on_front', 'wpcom_launchpad_front_page_updated_option_check', 10, 3 );

/**
 * Determine `update_about_page` task visibility. The task is visible if there is an 'About' page on the site.
 *
 * @return bool True if we should show the task, false otherwise.
 */
function wpcom_launchpad_is_update_about_page_task_visible() {
	// The task isn't visible if the task title hasn't been translated into the current locale.
	if ( ! wpcom_launchpad_has_translation( 'Update your About page', 'jetpack-mu-wpcom' ) ) {
		return false;
	}

	return wpcom_launchpad_get_site_about_page_id() !== null;
}

/**
 * When a page is updated, check to see if it's the About page and mark the task complete accordingly.
 *
 * @param int     $post_id The ID of the post being updated.
 * @param WP_Post $post The post object.
 */
function wpcom_launchpad_update_about_page_check( $post_id, $post ) {
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
	if ( wpcom_launchpad_is_task_option_completed( array( 'id' => 'update_about_page' ) ) ) {
		return;
	}

	// If the page is not the previously located About page, ignore it.
	$about_page_id = wpcom_launchpad_get_site_about_page_id();
	if ( null === $about_page_id || $post->ID !== $about_page_id ) {
		return;
	}

	wpcom_mark_launchpad_task_complete( 'update_about_page' );
}
add_action( 'post_updated', 'wpcom_launchpad_update_about_page_check', 10, 3 );

/**
 * Determine `edit_page` task visibility. The task is visible if there is at least one page and the add_new_page task is complete.
 *
 * @return bool True if we should show the task, false otherwise.
 */
function wpcom_launchpad_is_edit_page_task_visible() {
	// Don't show the task if the update_about_page task is visible.
	if ( wpcom_launchpad_is_update_about_page_task_visible() ) {
		return false;
	}

	// Otherwise, don't show the task until after a page has been added.
	if ( ! wpcom_launchpad_is_task_option_completed( array( 'id' => 'add_new_page' ) ) ) {
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
 * @param mixed $old_value The old value of the welcome message.
 * @param mixed $value The new value of the welcome message.
 *
 * @return void
 */
function wpcom_launchpad_mark_customize_welcome_message_complete_on_update( $old_value, $value ) {
	$new_invitation = is_array( $value ) && isset( $value['invitation'] ) ? $value['invitation'] : '';
	$old_invitation = is_array( $old_value ) && isset( $old_value['invitation'] ) ? $old_value['invitation'] : '';
	if ( $new_invitation !== $old_invitation ) {
		wpcom_mark_launchpad_task_complete( 'customize_welcome_message' );
	}
}
add_action( 'update_option_subscription_options', 'wpcom_launchpad_mark_customize_welcome_message_complete_on_update', 10, 2 );

/**
 * Mark the customize_welcome_message task complete
 * if the subscription_options['invitation'] value
 * for the welcome message has been added.
 *
 * @param mixed $value The value of the welcome message.
 *
 * @return void
 */
function wpcom_launchpad_mark_customize_welcome_message_complete_on_add( $value ) {
	if ( is_array( $value ) && $value['invitation'] ) {
		wpcom_mark_launchpad_task_complete( 'customize_welcome_message' );
	}
}
add_action( 'add_option_subscription_options', 'wpcom_launchpad_mark_customize_welcome_message_complete_on_add', 10, 1 );

/**
 * Mark the WooCommerce setup task as complete the setup task list is in
 * the completed list or in the hidden list.
 *
 * @param string $old_value The old value of the option.
 * @param string $value The new value of the option.
 *
 * @return void
 */
function wpcom_launchpad_mark_woocommerce_setup_complete( $old_value, $value ) {
	if ( ! in_array( 'setup', $value, true ) ) {
		return;
	}

	wpcom_mark_launchpad_task_complete( 'woocommerce_setup' );
}
add_action( 'update_option_woocommerce_task_list_completed_lists', 'wpcom_launchpad_mark_woocommerce_setup_complete', 10, 3 );
add_action( 'add_option_woocommerce_task_list_completed_lists', 'wpcom_launchpad_mark_woocommerce_setup_complete', 10, 3 );
add_action( 'update_option_woocommerce_task_list_hidden_lists', 'wpcom_launchpad_mark_woocommerce_setup_complete', 10, 3 );
add_action( 'add_option_woocommerce_task_list_hidden_lists', 'wpcom_launchpad_mark_woocommerce_setup_complete', 10, 3 );

/**
 * When a page is updated, check to see if we've already completed the `add_new_page` task and mark the `edit_page` task complete accordingly.
 *
 * @param int     $post_id The ID of the post being updated.
 * @param WP_Post $post The post object.
 */
function wpcom_launchpad_edit_page_check( $post_id, $post ) {
	// Don't do anything if the task is already complete.
	if ( wpcom_launchpad_is_task_option_completed( array( 'id' => 'edit_page' ) ) ) {
		return;
	}

	// Don't do anything if the add_new_page task is incomplete.
	if ( ! wpcom_launchpad_is_task_option_completed( array( 'id' => 'add_new_page' ) ) ) {
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
add_action( 'post_updated', 'wpcom_launchpad_edit_page_check', 10, 3 );

/**
 * Determine `add_subscribe_block` task visibility. The task is visible if using a FSE theme.
 *
 * @return bool True if we should show the task, false otherwise.
 */
function wpcom_launchpad_is_add_subscribe_block_visible() {
	return \Automattic\Jetpack\Blocks::is_fse_theme();
}

/**
 * When a template or template part is saved, check if the subscribe block is in the content.
 *
 * @param int     $post_id The ID of the post being updated.
 * @param WP_Post $post The post object.
 *
 * @return bool True if the task is completed, false otherwise.
 */
function wpcom_launchpad_add_subscribe_block_check( $post_id, $post ) {
	// If this is just a revision, don't proceed.
	if ( wp_is_post_revision( $post_id ) ) {
		return;
	}

	// Check if it's a published template or template part.
	if ( $post->post_status !== 'publish' || ( $post->post_type !== 'wp_template' && $post->post_type !== 'wp_template_part' ) ) {
		return;
	}

	// Check if our subscribe block is in the template or template part content.
	if ( has_block( 'jetpack/subscriptions', $post->post_content ) ) {
		// Run your specific function if the subscribe block is found.
		wpcom_mark_launchpad_task_complete( 'add_subscribe_block' );
	}
}

// Hook the function to the save_post action for all post types.
add_action( 'save_post', 'wpcom_launchpad_add_subscribe_block_check', 10, 2 );

/**
 * Returns if the site has domain or bundle purchases.
 *
 * @return array Array of booleans, first value is if the site has a bundle, second is if the site has a domain.
 */
function wpcom_launchpad_domain_customize_check_purchases() {
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
 * @param Task  $task    The Task object.
 * @param mixed $default The default value.
 * @return bool True if domain customize task is complete.
 */
function wpcom_launchpad_is_domain_customize_completed( $task, $default ) {
	$result = wpcom_launchpad_domain_customize_check_purchases();

	if ( false === $result ) {
		return false;
	}

	$has_domain = $result[1];

	// For users with a custom domain, show the task as complete.
	if ( $has_domain ) {
		return true;
	}

	// For everyone else, show the task as incomplete.
	return $default;
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
function wpcom_launchpad_mark_domain_tasks_complete( $blog_id, $user_id, $product_id ) {
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
add_action( 'activate_product', 'wpcom_launchpad_mark_domain_tasks_complete', 10, 6 );

/**
 * Mark `plan_selected`, and `plan_completed` tasks complete when a plan product is purchased.
 *
 * @param int $blog_id The blog ID.
 *
 * @return void
 */
function wpcom_launchpad_mark_plan_tasks_complete( $blog_id ) {
	require_once WP_CONTENT_DIR . '/admin-plugins/wpcom-billing.php';
	$current_plan = WPCOM_Store_API::get_current_plan( $blog_id );
	if ( $current_plan['is_free'] ) {
		return;
	}

	wpcom_mark_launchpad_task_complete( 'plan_selected' );
	wpcom_mark_launchpad_task_complete( 'plan_completed' );
}
add_action( 'activate_product', 'wpcom_launchpad_mark_plan_tasks_complete', 10, 6 );

/**
 * Re-trigger email campaigns for blog onboarding after user edit one of the fields in the launchpad.
 *
 * Also included bin/tests/isolated/suites/Guides/observer-modules/OnboardingUseCaseBlogTest.php#601
 *
 * @return void
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

/**
 * Mark task complete when plugin is installed.
 */
function wpcom_launchpad_mark_plugin_installed_complete() {
	if ( wpcom_launchpad_is_task_option_completed( array( 'id' => 'install_custom_plugin' ) ) ) {
		return;
	}
	wpcom_mark_launchpad_task_complete( 'install_custom_plugin' );
}
add_action( 'jetpack_plugin_installed', 'wpcom_launchpad_mark_plugin_installed_complete', 10 );

/**
 * Mark task complete when theme is selected.
 *
 * @param array $new_theme    The new theme object.
 * @param array $old_theme The old theme object.
 */
function wpcom_launchpad_mark_theme_selected_complete( $new_theme, $old_theme ) {
	// This hook runs when site just gets setup, lets prevent checklist item from being complete
	// when the theme is the same.
	$is_same_theme = $new_theme['name'] === $old_theme['name'];
	if ( wpcom_launchpad_is_task_option_completed( array( 'id' => 'site_theme_selected' ) ) || $is_same_theme ) {
		return;
	}
	wpcom_mark_launchpad_task_complete( 'site_theme_selected' );
}
add_action( 'jetpack_sync_current_theme_support', 'wpcom_launchpad_mark_theme_selected_complete', 10, 2 );

/**
 * Returns the latest draft post ID, otherwise false.
 * Similar to wp_get_recent_posts, except we only need the ID.
 *
 * The response is cached for the lifetime of the current request.
 *
 * @return int | boolean
 */
function wpcom_launchpad_get_latest_draft_id() {
	// The result is cached for the current request
	static $cached_blog_id  = null;
	static $cached_draft_id = null;

	if ( $cached_blog_id === get_current_blog_id() && $cached_draft_id !== null ) {
		return $cached_draft_id;
	}

	// Query for the latest draft post
	$args = array(
		'posts_per_page' => 1,
		'post_status'    => 'draft',
		'post_type'      => 'post',
		'orderby'        => 'date',
		'order'          => 'DESC',
		'fields'         => 'ids',
	);

	$latest_draft_id = get_posts( $args );

	$cached_blog_id  = get_current_blog_id();
	$cached_draft_id = reset( $latest_draft_id );

	return $cached_draft_id;
}

/**
 * Will return true if the primary domain is not a WPCOM domain.
 *
 * @return bool
 */
function wpcom_launchpad_is_ssl_task_visible() {
	return ! wpcom_launchpad_is_primary_domain_wpcom();
}

/**
 * Checks if the current site primary domain is a WPCOM domain.
 *
 * @return bool Will return true if the primary domain is a WPCOM domain.
 */
function wpcom_launchpad_is_primary_domain_wpcom() {
	if ( ! ( new Automattic\Jetpack\Status\Host() )->is_wpcom_platform() ) {
		return false;
	}

	$url  = home_url();
	$host = wp_parse_url( $url, PHP_URL_HOST );

	// If site_slug ends with .wpcomstaging.com return true
	return str_ends_with( $host, '.wpcomstaging.com' );
}
