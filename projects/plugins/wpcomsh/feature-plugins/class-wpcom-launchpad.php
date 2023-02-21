<?php
/**
 *
 * THIS FILE EXISTS IN WPCOM AND WPCOMSH. If you make changes,
 * you must manually update this file in both WPCOM and WPCOMSH.
 *
 * Description: This file provides backend support for the Launchpad
 * screen during onboarding. It replicates code from the Launchpad
 * plugin that exists on WordPress.com.
 * Author: Team Cylon
 * Version: 1.1
 * Author URI: http://automattic.com/
 *
 * @package WPCOM_Launchpad
 **/

/**
 * WPCOM_Launchpad Class.
 * Provides backend logic for Launchpad onboarding screen.
 */
class WPCOM_Launchpad {

	/**
	 * The unique instance of the plugin.
	 *
	 * @var WPCOM_Launchpad
	 */
	private static $instance;

	/**
	 * Singleton pattern. Create new instance of plugin
	 * if it does not exist, then return instance.
	 *
	 * @return object Launchpad instance
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Initialize the plugin. Add new hooks here.
	 *
	 * @return void
	 */
	public function init() {
		add_action( 'publish_post', array( $this, 'track_publish_first_post_task' ), 10 );
		add_action( 'load-site-editor.php', array( $this, 'track_edit_site_task' ), 10 );
		add_action( 'wpcom_site_launched', array( $this, 'track_site_launch_task' ), 10 );
		add_action( 'wp_head', array( $this, 'maybe_preview_with_no_interactions' ), PHP_INT_MAX );
		add_action( 'add_attachment', array( $this, 'track_video_uploaded_task' ), 10, 1 );
		// Atomic Only
		if ( ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
			add_action( 'update_option_blog_public', array( $this, 'maybe_track_site_launch' ), 10, 2 );
		}
	}

	/**
	 * Determine if site was started via Newsletter flow.
	 *
	 * @return bool
	 */
	public function is_newsletter_flow() {
		return get_option( 'site_intent' ) === 'newsletter';
	}

	/**
	 * Determine if site was started via Link in Bio flow.
	 *
	 * @return bool
	 */
	public function is_link_in_bio_flow() {
		return get_option( 'site_intent' ) === 'link-in-bio';
	}

	/**
	 * Determine if site was started via Newsletter flow.
	 *
	 * @return bool
	 */
	public function is_podcast_flow() {
		return get_option( 'site_intent' ) === 'podcast';
	}

	/**
	 * Determine if site was started via Videopress flow.
	 *
	 * @return bool
	 */
	public function is_videopress_flow() {
		return get_option( 'site_intent' ) === 'videopress';
	}

	/**
	 * Determine if site was started via Free flow.
	 *
	 * @return bool
	 */
	public function is_free_flow() {
		return get_option( 'site_intent' ) === 'free';
	}

	/**
	 * Determine if site was started via a general onbaording flow.
	 *
	 * @return bool
	 */
	public function is_general_flow() {
		$intent = get_option( 'site_intent' );
		return 'write' === $intent || 'build' === $intent;
	}

	/**
	 * Update a Launchpad task status.
	 * Note: We store all launchpad checklist task statuses in one option, 'launchpad_checklist_tasks_statuses'.
	 *
	 * @param string $task The name of the task being updated.
	 * @param string $value The new value.
	 * @return void
	 */
	public function update_checklist_task( $task, $value ) {
		$launchpad_checklist_tasks_statuses_option = get_option( 'launchpad_checklist_tasks_statuses' );
		if ( ! is_array( $launchpad_checklist_tasks_statuses_option ) ) {
			$launchpad_checklist_tasks_statuses_option = array( $task => $value );
		} else {
			$launchpad_checklist_tasks_statuses_option[ $task ] = $value;
		}
		update_option( 'launchpad_checklist_tasks_statuses', $launchpad_checklist_tasks_statuses_option );
	}

	/**
	 * Retrieve a launchpad checklist task from the 'launchpad_checklist_tasks_statuses' site option
	 *
	 * @param string $task The name of the task being fetched.
	 * @return string|boolean Returns task if found, else false.
	 */
	public function get_checklist_task( $task ) {
		$launchpad_checklist_tasks_statuses_option = get_option( 'launchpad_checklist_tasks_statuses' );
		if ( is_array( $launchpad_checklist_tasks_statuses_option ) && isset( $launchpad_checklist_tasks_statuses_option[ $task ] ) ) {
				return $launchpad_checklist_tasks_statuses_option[ $task ];
		}

		return false;
	}

	/**
	 * We should only update Launchpad tasks if launchpad has been enabled, and is not yet complete.
	 *
	 * @return bool
	 */
	public function should_update_tasks() {
		$has_launchpad_been_enabled   = in_array( get_option( 'launchpad_screen' ), array( 'off', 'minimized', 'full' ), true );
		$has_launchpad_been_completed = get_option( 'launchpad_screen' ) === 'off';

		return $has_launchpad_been_enabled && ! $has_launchpad_been_completed;
	}

	/**
	 * Update Launchpad's first_post_published task to true.
	 *
	 * @return void
	 */
	public function mark_publish_first_post_task_as_complete() {
		if ( ! $this->get_checklist_task( 'first_post_published' ) ) {
			$this->update_checklist_task( 'first_post_published', true );
		}
	}

	/**
	 * Only update first_post_pubished task under specific conditions.
	 * Also turn launchpad_screen optoin off when this task is completed for Newsletters.
	 *
	 * @return void
	 */
	public function track_publish_first_post_task() {
		// Ensure that Headstart posts don't mark this as complete
		if ( defined( 'HEADSTART' ) && HEADSTART ) {
			return;
		}
		if ( $this->is_newsletter_flow() && $this->should_update_tasks() ) {
			$this->mark_publish_first_post_task_as_complete();
			update_option( 'launchpad_screen', 'off' );
		}

		if ( $this->is_free_flow() && $this->should_update_tasks() ) {
			$this->mark_publish_first_post_task_as_complete();
		}

		if ( $this->is_general_flow() && $this->should_update_tasks() ) {
			$this->mark_publish_first_post_task_as_complete();
		}
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
	public function track_edit_site_task() {
		if ( $this->is_link_in_bio_flow() && $this->should_update_tasks() ) {
			if ( ! $this->get_checklist_task( 'links_edited' ) ) {
				$this->update_checklist_task( 'links_edited', true );
			}
		}

		if ( $this->is_free_flow() && $this->should_update_tasks() ) {
			if ( ! $this->get_checklist_task( 'site_edited' ) ) {
				$this->update_checklist_task( 'site_edited', true );
			}
		}

		if ( $this->is_general_flow() && $this->should_update_tasks() ) {
			if ( ! $this->get_checklist_task( 'site_edited' ) ) {
				$this->update_checklist_task( 'site_edited', true );
			}
		}
	}

	/**
	 * Action that fires when `blog_public` is updated.
	 *
	 * @param string $old_value The updated option value
	 * @param string $new_value The previous option value
	 * @return void
	 */
	public function maybe_track_site_launch( $old_value, $new_value ) {
		$blog_public = (int) $new_value;
		// 'blog_public' is set to '1' when a site is launched.
		if ( $blog_public === 1 ) {
			$this->track_site_launch_task();
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
	public function track_site_launch_task() {
		if ( ! $this->is_link_in_bio_flow() && ! $this->is_videopress_flow() && ! $this->is_free_flow() && ! $this->is_general_flow() ) {
			return;
		}

		if ( ! $this->should_update_tasks() ) {
			return;
		}

		$is_link_in_bio_flow_ready_to_launch = $this->is_link_in_bio_flow() && $this->get_checklist_task( 'links_edited' );
		$is_videopress_flow_ready_to_launch  = $this->is_videopress_flow() && $this->get_checklist_task( 'video_uploaded' );
		$is_free_flow_ready_to_launch        = $this->is_free_flow();
		$is_general_flow_ready_to_launch     = $this->is_general_flow();

		$is_site_ready_to_launch = $is_link_in_bio_flow_ready_to_launch || $is_videopress_flow_ready_to_launch || $is_free_flow_ready_to_launch || $is_general_flow_ready_to_launch;

		if ( $is_site_ready_to_launch ) {
			if ( ! $this->get_checklist_task( 'site_launched' ) ) {
				$this->update_checklist_task( 'site_launched', true );
			}

			update_option( 'launchpad_screen', 'off' );
		}
	}

	/**
	 * Add CSS that disallows interaction with the Launchpad preview.
	 *
	 * @return void|string
	 */
	public function maybe_preview_with_no_interactions() {
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
	 * Update Launchpad's video_uploaded task.
	 *
	 * Only updated for videopress flows currently.
	 *
	 * @param string $post_id The id of the post being udpated.
	 * @return void
	 */
	public function track_video_uploaded_task( $post_id ) {
		if ( ! $this->is_videopress_flow() ) {
			return;
		}

		// Not using `wp_attachment_is` because it requires the actual file
		// which is not the case for Atomic VideoPress.
		if ( 0 !== strpos( get_post_mime_type( $post_id ), 'video/' ) ) {
			return;
		}

		if ( $this->should_update_tasks() && ! $this->get_checklist_task( 'video_uploaded' ) ) {
			$this->update_checklist_task( 'video_uploaded', true );
		}
	}
}

add_action( 'plugins_loaded', array( WPCOM_Launchpad::get_instance(), 'init' ) );
