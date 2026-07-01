<?php
/**
 * AI Launchpad REST endpoints.
 *
 * @package automattic/jetpack-mu-wpcom
 * @since $$next-version$$
 */

/**
 * REST endpoints for the AI Launchpad wizard and AI output options.
 */
class AI_Launchpad_REST extends WP_REST_Controller {

	const OPTION_WIZARD    = 'wpcom_ai_launchpad_wizard';
	const OPTION_AI_OUTPUT = 'wpcom_ai_launchpad_ai_output';
	const OPTION_DISMISSED = 'wpcom_ai_launchpad_dismissed';

	const MIN_VALID_TASKS = 4;

	const LAUNCH_TASK_IDS = array( 'site_launched', 'blog_launched', 'woo_launch_site', 'link_in_bio_launched', 'videopress_launched' );

	/**
	 * Tasks the AI Launchpad marks complete on CTA click, because their real signal is unreachable from wp-admin.
	 *
	 * Server-side allowlist so the complete-task route can only tick these ids. Mirrored client-side in model.ts.
	 */
	const COMPLETE_ON_CLICK_TASK_IDS = array(
		'complete_profile',
		'manage_subscribers',
		'manage_paid_newsletter_plan',
		'earn_money',
		'start_building_your_audience',
		'site_monitoring_page',
		'setup_ssh',
		'share_site',
	);

	/**
	 * Tasks whose catalog visibility gate encodes an `IS_WPCOM`-only assumption the AI Launchpad overrides.
	 *
	 * `add_10_email_subscribers` is gated off WordPress.com, but AI_Launchpad_Subscribers_Listener reads the count on
	 * Atomic, so the task must still render and its visibility gate is skipped here.
	 */
	const FORCE_VISIBLE_TASK_IDS = array(
		'add_10_email_subscribers',
	);

	/**
	 * CTA destinations the AI Launchpad repoints to wp-admin, keyed by task id, each mapping to an `admin_url()` path.
	 *
	 * The catalog sends these to Calypso flows that are a poor fit for wp-admin. Overridden on read so the shared
	 * catalog (used by the legacy launchpad too) is left untouched.
	 */
	const CTA_OVERRIDES = array(
		'connect_social_media' => 'admin.php?page=jetpack-social',
		'design_completed'     => 'themes.php',
		'design_selected'      => 'themes.php',
	);

	/**
	 * Jetpack Social tasks, hidden on private sites where wpcom does not load Publicize (so their CTA page would 404).
	 */
	const SOCIAL_PAGE_TASK_IDS = array(
		'connect_social_media',
		'drive_traffic',
		'post_sharing_enabled',
	);

	/**
	 * First-post tasks that can sit "in progress": the AI-created draft post exists but has not been published yet.
	 *
	 * Detected through the `_wpcom_ai_launchpad_first_post` marker meta (via AI_Launchpad_First_Post_Listener), so an
	 * unrelated pre-existing draft never counts. Paired with `add_about_page`, which has its own marker meta.
	 */
	const IN_PROGRESS_FIRST_POST_TASK_IDS = array(
		'first_post_published',
		'first_post_published_newsletter',
	);

	/**
	 * Whether the site's visibility is set to private (`blog_public = -1`).
	 *
	 * Read directly to avoid a hard dependency on the Status package in this read path.
	 *
	 * @return bool
	 */
	private function is_private_site() {
		return '-1' === (string) get_option( 'blog_public' );
	}

	/**
	 * Class constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'ai-launchpad';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register our routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_data' ),
					'permission_callback' => array( $this, 'can_read' ),
					'args'                => array(
						// Testing aid: render the full task catalog so every task can be exercised from one site.
						'all_tasks' => array(
							'description' => 'Return the full task catalog instead of the tailored list (testing aid).',
							'type'        => 'boolean',
							'default'     => false,
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'dismiss' ),
					'permission_callback' => array( $this, 'can_write' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/wizard',
			array(
				array(
					'methods'             => 'PUT',
					'callback'            => array( $this, 'update_wizard' ),
					'permission_callback' => array( $this, 'can_write' ),
					'args'                => array(
						'goal'        => array(
							'description' => 'The site goal picked in the wizard.',
							'type'        => 'string',
							'enum'        => array( 'write', 'build', 'sell', 'newsletter', 'educate', 'portfolio' ),
							'required'    => true,
						),
						'site_name'   => array(
							'description'       => 'The site name entered in the wizard.',
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_text_field',
						),
						'description' => array(
							'description'       => 'The free-text site description entered in the wizard.',
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_textarea_field',
						),
						'locale'      => array(
							'description'       => 'The user locale.',
							'type'              => 'string',
							'default'           => 'en',
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/complete-task',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'complete_task' ),
					'permission_callback' => array( $this, 'can_write' ),
					'args'                => array(
						'task_id' => array(
							'description'       => 'The acknowledgment task to mark complete.',
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_key',
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/tailored',
			array(
				array(
					'methods'             => 'PUT',
					'callback'            => array( $this, 'update_tailored' ),
					'permission_callback' => array( $this, 'can_write' ),
					'args'                => array(
						'source' => array(
							'description' => 'Whether the payload came from the AI or the deterministic fallback. Query parameter; the JSON body must match the agent output schema exactly.',
							'type'        => 'string',
							'enum'        => array( 'ai', 'fallback' ),
							'default'     => 'ai',
						),
					),
				),
			)
		);
	}

	/**
	 * Permission callback for reads.
	 *
	 * @return true|WP_Error|false
	 */
	public function can_read() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return false;
		}

		return $this->check_eligibility();
	}

	/**
	 * Permission callback for writes.
	 *
	 * @return true|WP_Error|false
	 */
	public function can_write() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		return $this->check_eligibility();
	}

	/**
	 * Returns a 404 error for ineligible sites, true otherwise.
	 *
	 * @return true|WP_Error
	 */
	private function check_eligibility() {
		// Fail closed: if the gate is unavailable, treat the site as not eligible.
		if ( ! function_exists( 'wpcom_ai_launchpad_is_eligible' ) || ! wpcom_ai_launchpad_is_eligible() ) {
			return new WP_Error(
				'ai_launchpad_not_eligible',
				__( 'This site is not eligible for the AI Launchpad.', 'jetpack-mu-wpcom' ),
				array( 'status' => 404 )
			);
		}

		return true;
	}

	/**
	 * Composite read: wizard payload, AI output, enriched tasks, statuses, and eligibility.
	 *
	 * @param WP_REST_Request|null $request Request object (for the `all_tasks` testing param).
	 * @return array
	 */
	public function get_data( $request = null ) {
		$wizard    = get_option( self::OPTION_WIZARD );
		$ai_output = get_option( self::OPTION_AI_OUTPUT );

		// Testing aid: ?all_tasks=1 renders the whole catalog, independent of the persisted tailored output.
		if ( $request instanceof WP_REST_Request && $request->get_param( 'all_tasks' ) ) {
			$tasks = $this->build_all_catalog_tasks();
		} else {
			// Guard the nested payload: partial/failed writes may leave the option without payload.tasks.
			$tasks = array();
			if ( is_array( $ai_output ) && isset( $ai_output['payload']['tasks'] ) && is_array( $ai_output['payload']['tasks'] ) ) {
				$tasks = $this->build_tasks( $ai_output['payload']['tasks'] );
			}
		}

		// The membership tasks' completion is recomputed in build_tasks(), so overlay it to keep
		// checklist_statuses consistent with tasks[].completed for them.
		$checklist_statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		foreach ( $tasks as $task ) {
			if ( AI_Launchpad_Memberships::has_override( $task['id'] ) ) {
				$checklist_statuses[ $task['id'] ] = $task['completed'];
			}
		}

		return array(
			'wizard'             => is_array( $wizard ) ? $wizard : null,
			'ai_output'          => is_array( $ai_output ) ? $ai_output : null,
			'tasks'              => $tasks,
			'checklist_statuses' => $checklist_statuses,
			'dismissed'          => (bool) get_option( self::OPTION_DISMISSED, false ),
			'is_eligible'        => true,
			// Site context the client needs for the launch-task CTA, the preview thumbnail/title, and wizard prefill.
			'site'               => array(
				'url'         => home_url(),
				'title'       => get_bloginfo( 'name' ),
				'description' => get_bloginfo( 'description' ),
				// Block themes open the Site Editor; classic themes fall back to the Customizer.
				'edit_url'    => wp_is_block_theme() ? admin_url( 'site-editor.php' ) : admin_url( 'customize.php' ),
			),
		);
	}

	/**
	 * Persists the wizard input and writes the entered Name and Brief description back to blogname / blogdescription.
	 *
	 * Empty values are skipped so the wizard never blanks an existing title or tagline.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array
	 */
	public function update_wizard( $request ) {
		$wizard = array(
			'version'      => 1,
			'goal'         => $request['goal'],
			'site_name'    => $request['site_name'],
			'description'  => $request['description'],
			'locale'       => $request['locale'],
			'generated_at' => time(),
		);

		update_option( self::OPTION_WIZARD, $wizard, false );

		if ( '' !== trim( (string) $request['site_name'] ) ) {
			update_option( 'blogname', $request['site_name'] );
		}
		if ( '' !== trim( (string) $request['description'] ) ) {
			// Collapse the textarea brief's newlines to keep the inline-rendered tagline single-line.
			update_option( 'blogdescription', sanitize_text_field( $request['description'] ) );
		}

		return array( 'wizard' => $wizard );
	}

	/**
	 * Validates the AI output payload against the agent output schema, wraps it, and persists it.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array|WP_Error
	 */
	public function update_tailored( $request ) {
		$payload = $request->get_json_params();

		$validation = rest_validate_value_from_schema( $payload, $this->get_output_schema(), 'payload' );
		if ( is_wp_error( $validation ) ) {
			return new WP_Error( 'ai_launchpad_invalid_payload', $validation->get_error_message(), array( 'status' => 422 ) );
		}

		$last_task = end( $payload['tasks'] );
		if ( ! in_array( $last_task['id'], self::LAUNCH_TASK_IDS, true ) ) {
			return new WP_Error(
				'ai_launchpad_missing_launch_task',
				__( 'The last task must be a launch task.', 'jetpack-mu-wpcom' ),
				array( 'status' => 422 )
			);
		}

		$definitions = wpcom_launchpad_get_task_definitions();
		$tasks       = array();

		foreach ( $payload['tasks'] as $task ) {
			if ( ! isset( $definitions[ $task['id'] ] ) ) {
				continue;
			}

			$subtitle = $this->sanitize_subtitle( $task['subtitle'] );
			if ( is_wp_error( $subtitle ) ) {
				return $subtitle;
			}

			$tasks[] = array(
				'id'       => $task['id'],
				'subtitle' => $subtitle,
			);
		}

		if ( count( $tasks ) < self::MIN_VALID_TASKS ) {
			return new WP_Error(
				'ai_launchpad_unknown_tasks',
				__( 'Too few tasks matched the task catalog.', 'jetpack-mu-wpcom' ),
				array( 'status' => 422 )
			);
		}

		$payload['tasks'] = $tasks;

		$ai_output = array(
			'version'      => 1,
			'source'       => $request['source'],
			'generated_at' => time(),
			'payload'      => $payload,
		);

		update_option( self::OPTION_AI_OUTPUT, $ai_output, false );

		return array( 'ai_output' => $ai_output );
	}

	/**
	 * Marks an acknowledgment task complete when the user clicks its CTA, since these tasks have no wp-admin signal.
	 *
	 * Restricted to the COMPLETE_ON_CLICK_TASK_IDS allowlist and to tasks on the site's AI-selected list.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array|WP_Error
	 */
	public function complete_task( $request ) {
		$task_id = $request['task_id'];

		if ( ! in_array( $task_id, self::COMPLETE_ON_CLICK_TASK_IDS, true ) ) {
			return new WP_Error(
				'ai_launchpad_task_not_completable',
				__( 'This task cannot be completed this way.', 'jetpack-mu-wpcom' ),
				array( 'status' => 400 )
			);
		}

		// Only tasks the AI put on this site's list may be completed.
		if ( ! in_array( $task_id, wpcom_ai_launchpad_get_ai_task_ids(), true ) ) {
			return new WP_Error(
				'ai_launchpad_task_not_selected',
				__( 'This task is not on the tailored list.', 'jetpack-mu-wpcom' ),
				array( 'status' => 404 )
			);
		}

		wpcom_mark_launchpad_task_complete( $task_id );

		return array(
			'completed' => true,
			'task_id'   => $task_id,
		);
	}

	/**
	 * Deletes the AI output and marks the AI Launchpad as dismissed.
	 *
	 * @return array
	 */
	public function dismiss() {
		delete_option( self::OPTION_AI_OUTPUT );
		update_option( self::OPTION_DISMISSED, true, true );

		return array( 'dismissed' => true );
	}

	/**
	 * Strips HTML from a subtitle and rejects URLs and template syntax.
	 *
	 * @param string $subtitle The raw subtitle.
	 * @return string|WP_Error The sanitized subtitle, or an error.
	 */
	private function sanitize_subtitle( $subtitle ) {
		$subtitle = trim( wp_strip_all_tags( $subtitle, true ) );

		if ( '' === $subtitle ) {
			return new WP_Error(
				'ai_launchpad_invalid_subtitle',
				__( 'Task subtitles must contain text.', 'jetpack-mu-wpcom' ),
				array( 'status' => 422 )
			);
		}

		if ( preg_match( '#https?://#i', $subtitle ) ) {
			return new WP_Error(
				'ai_launchpad_subtitle_contains_url',
				__( 'Task subtitles must not contain URLs.', 'jetpack-mu-wpcom' ),
				array( 'status' => 422 )
			);
		}

		if ( str_contains( $subtitle, '{{' ) || str_contains( $subtitle, '[[' ) ) {
			return new WP_Error(
				'ai_launchpad_subtitle_contains_template',
				__( 'Task subtitles must not contain template syntax.', 'jetpack-mu-wpcom' ),
				array( 'status' => 422 )
			);
		}

		return mb_substr( $subtitle, 0, 200 );
	}

	/**
	 * Builds the enriched task list for every catalog task, bypassing the visibility gate (backs `?all_tasks=1`).
	 *
	 * Each task is enriched in isolation so one that can't be built is skipped rather than breaking the whole view.
	 *
	 * @return array
	 */
	private function build_all_catalog_tasks() {
		$built = array();
		foreach ( array_keys( wpcom_launchpad_get_task_definitions() ) as $task_id ) {
			try {
				$one = $this->build_tasks(
					array(
						array(
							'id'       => $task_id,
							'subtitle' => $task_id,
						),
					),
					true
				);
				if ( ! empty( $one ) ) {
					$built[] = $one[0];
				}
			} catch ( \Throwable $e ) {
				continue;
			}
		}
		return $built;
	}

	/**
	 * Enriches the persisted tasks with title, completion state, and CTA path from the catalog.
	 *
	 * @param array $tasks             The persisted `payload.tasks` array.
	 * @param bool  $bypass_visibility Skip the catalog visibility gate (for the all-tasks testing view).
	 * @return array
	 */
	private function build_tasks( $tasks, $bypass_visibility = false ) {
		$definitions = wpcom_launchpad_get_task_definitions();
		$built       = array();

		// Some catalog visibility callbacks call is_plugin_active(), which is not loaded during a REST request.
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$is_private_site = $this->is_private_site();

		foreach ( $tasks as $task ) {
			if ( ! is_array( $task ) || ! isset( $task['id'] ) || ! isset( $task['subtitle'] ) ) {
				continue;
			}

			if ( ! isset( $definitions[ $task['id'] ] ) ) {
				continue;
			}

			// The Jetpack Social tasks point at an admin page wpcom doesn't load on a private site, so hide them there.
			if ( $is_private_site && in_array( $task['id'], self::SOCIAL_PAGE_TASK_IDS, true ) ) {
				continue;
			}

			$definition       = $definitions[ $task['id'] ];
			$definition['id'] = $task['id'];

			// Honor the catalog's own visibility gate: a task the catalog would hide here must not render, since its
			// CTA would 404 and it could never complete. Filtered on read so the deterministic fallback stays usable.
			if (
				! $bypass_visibility
				&& ! in_array( $task['id'], self::FORCE_VISIBLE_TASK_IDS, true )
				&& ! wpcom_launchpad_checklists()->is_visible( $definition )
			) {
				continue;
			}

			// The membership tasks' catalog callbacks are always false on Atomic; recompute from local signals instead.
			$completed = AI_Launchpad_Memberships::has_override( $task['id'] )
				? AI_Launchpad_Memberships::is_task_complete( $task['id'] )
				: wpcom_launchpad_checklists()->is_task_complete( $definition );

			$calypso_path = isset( self::CTA_OVERRIDES[ $task['id'] ] )
				? admin_url( self::CTA_OVERRIDES[ $task['id'] ] )
				: wpcom_launchpad_checklists()->load_calypso_path( $definition );

			$title       = isset( $definition['get_title'] ) ? $definition['get_title']() : '';
			$in_progress = false;

			// A saved-but-unpublished draft (found by marker meta) puts a site-editor task "in progress": reopen that
			// draft instead of creating a new one, and surface the drafts icon + a "Continue…" prompt in the card.
			if ( ! $completed ) {
				$draft_url = $this->get_in_progress_draft_url( $task['id'] );
				if ( null !== $draft_url ) {
					$in_progress  = true;
					$calypso_path = $draft_url;
				}
			}

			// Title follows our precise in-progress signal so it, the icon, and the CTA agree.
			$title = $this->get_task_title( $task['id'], $in_progress, $title );

			$built[] = array(
				'id'           => $task['id'],
				'subtitle'     => $task['subtitle'],
				'title'        => $title,
				'completed'    => $completed,
				'in_progress'  => $in_progress,
				'calypso_path' => $calypso_path,
			);
		}

		return $built;
	}

	/**
	 * Resolves the editor URL of a site-editor task's in-progress draft, or null when there is none.
	 *
	 * The About page is found by its marker meta; the first-post tasks by the latest draft post. Returned as an
	 * `admin_url()` so the client reopens the existing draft rather than creating a duplicate.
	 *
	 * @param string $task_id The catalog task id.
	 * @return string|null
	 */
	private function get_in_progress_draft_url( $task_id ) {
		$draft_id = null;

		if ( 'add_about_page' === $task_id ) {
			$draft_id = AI_Launchpad_About_Page_Listener::get_draft_id();
		} elseif ( in_array( $task_id, self::IN_PROGRESS_FIRST_POST_TASK_IDS, true ) ) {
			$draft_id = AI_Launchpad_First_Post_Listener::get_draft_id();
		}

		if ( null === $draft_id ) {
			return null;
		}

		return admin_url( 'post.php?post=' . $draft_id . '&action=edit' );
	}

	/**
	 * The card title for a site-editor task, chosen by our precise (marker-based) in-progress signal so the title,
	 * icon, and CTA stay in agreement.
	 *
	 * This overrides `first_post_published`'s catalog title in both states: the catalog swaps it to "Continue…"
	 * whenever ANY draft exists (a looser signal than our marker), so an unrelated draft would otherwise show a
	 * "Continue…" title beside the not-started icon. Tasks not listed keep their catalog title.
	 *
	 * @param string $task_id     The catalog task id.
	 * @param bool   $in_progress Whether our marker detected an in-progress draft.
	 * @param string $default     The catalog-provided title, kept when we don't override.
	 * @return string
	 */
	private function get_task_title( $task_id, $in_progress, $default ) {
		switch ( $task_id ) {
			case 'add_about_page':
				return $in_progress ? __( 'Continue working on the About page', 'jetpack-mu-wpcom' ) : $default;
			case 'first_post_published':
				return $in_progress
					? __( 'Continue to write your first post', 'jetpack-mu-wpcom' )
					: __( 'Write your first post', 'jetpack-mu-wpcom' );
			case 'first_post_published_newsletter':
				return $in_progress ? __( 'Continue writing your first post', 'jetpack-mu-wpcom' ) : $default;
			default:
				return $default;
		}
	}

	/**
	 * Loads the agent output schema used to validate `PUT /tailored` bodies.
	 *
	 * @return array
	 */
	private function get_output_schema() {
		static $schema = null;

		if ( null === $schema ) {
			$schema = json_decode( file_get_contents( __DIR__ . '/contracts/agent-output-schema.json' ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local package file.
		}

		return $schema;
	}
}

// @phan-suppress-next-line PhanNoopNew -- instantiated for the constructor's add_action side effect.
new AI_Launchpad_REST();
