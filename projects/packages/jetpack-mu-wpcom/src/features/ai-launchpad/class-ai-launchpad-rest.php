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
	const OPTION_SKIPPED   = 'wpcom_ai_launchpad_skipped_tasks';
	// Latched "every task is done" flag, autoloaded so the menu gate reads it without rebuilding the task list.
	// Set once; cleared only by an explicit reset (re-tailor, dismiss, reset).
	const OPTION_COMPLETED = 'wpcom_ai_launchpad_completed';

	const MIN_VALID_TASKS = 4;

	// `woo_launch_site` stays a valid launch task so a stray AI emission passes PUT validation and is normalized to
	// `site_launched` on read (see build_tasks), rather than failing the whole list into the deterministic fallback.
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
	 * Task ids the AI Launchpad synthesizes itself (never present in the AI payload): the sell goal's store-setup
	 * lead tasks and the niche-gated gallery task. Skips must accept them alongside the AI-selected ids.
	 *
	 * Must list every id minted by build_store_tasks() / build_gallery_task() — a synthetic task missing here
	 * renders with a Skip button whose write is rejected.
	 */
	const SYNTHETIC_TASK_IDS = array(
		'install_woocommerce',
		'setup_woocommerce_store',
		'add_gallery_page',
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
	 * Commerce tasks whose catalog visibility gate requires WooCommerce to be active.
	 *
	 * On a fresh sell site these would be dropped, collapsing the list. Instead the sell branch keeps them as a
	 * disabled preview of the store roadmap until WooCommerce is active. See build_tasks()'s $disable_hidden_woo mode.
	 */
	const WOO_TASK_IDS = array(
		'woo_customize_store',
		'woo_products',
		'set_up_payments',
	);

	/**
	 * CTA destinations the AI Launchpad repoints to wp-admin, keyed by task id, each mapping to an `admin_url()` path.
	 *
	 * The catalog sends these to Calypso flows that are a poor fit for wp-admin. Overridden on read so the shared
	 * catalog (used by the legacy launchpad too) is left untouched.
	 */
	const CTA_OVERRIDES = array(
		'connect_social_media' => 'admin.php?page=jetpack-social',
	);

	/**
	 * Jetpack Social tasks, hidden on private sites where wpcom does not load Publicize (so their CTA page would 404).
	 */
	const SOCIAL_PAGE_TASK_IDS = array(
		'connect_social_media',
		'drive_traffic',
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
			$this->rest_base . '/skip-task',
			array(
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'skip_task' ),
					'permission_callback' => array( $this, 'can_write' ),
					'args'                => array(
						'task_id' => array(
							'description'       => 'The task to skip.',
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
			$tasks = $this->apply_skipped_tasks( $this->build_all_catalog_tasks() );
		} else {
			$tasks = $this->get_current_tasks();
		}

		// The membership tasks' completion is recomputed in build_tasks(), so overlay it to keep
		// checklist_statuses consistent with tasks[].completed for them.
		$checklist_statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		foreach ( $tasks as $task ) {
			if ( AI_Launchpad_Memberships::has_override( $task['id'] ) ) {
				$checklist_statuses[ $task['id'] ] = $task['completed'];
			}
		}

		$this->maybe_mark_completed();

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
	 * The site's tailored task list (AI-selected + synthetic store/gallery tasks, skip overlay applied) — the tasks
	 * GET renders, minus the ?all_tasks testing view. Shared by GET and the completion check.
	 *
	 * @return array
	 */
	public function get_current_tasks() {
		$ai_output = get_option( self::OPTION_AI_OUTPUT );

		// Guard the nested payload: partial/failed writes may leave the option without payload.tasks.
		$payload = is_array( $ai_output ) && isset( $ai_output['payload'] ) && is_array( $ai_output['payload'] )
			? $ai_output['payload']
			: array();
		// Validate `inferred` as an array before reading from it, since a partial write could leave it non-array.
		$inferred = isset( $payload['inferred'] ) && is_array( $payload['inferred'] ) ? $payload['inferred'] : array();
		$niche    = isset( $inferred['niche'] ) && is_string( $inferred['niche'] )
			? trim( $inferred['niche'] )
			: '';

		// The AI's dedicated theme-search word beats the first-word-of-niche heuristic; outputs
		// persisted before the field existed fall back to the niche.
		$theme_keyword = isset( $inferred['theme_keyword'] ) && is_string( $inferred['theme_keyword'] )
			? trim( $inferred['theme_keyword'] )
			: '';
		$theme_search  = '' !== $theme_keyword ? $theme_keyword : $niche;

		$goal = isset( $inferred['goal'] ) && is_string( $inferred['goal'] ) ? $inferred['goal'] : '';

		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$woo_active = is_plugin_active( 'woocommerce/woocommerce.php' );

		// On a sell site without WooCommerce, keep the gated commerce tasks as a disabled preview of the store
		// roadmap instead of dropping them (which would collapse the list to almost nothing).
		$disable_hidden_woo = 'sell' === $goal && ! $woo_active;

		$theme_cta = $this->get_themes_showcase_path( $goal, $theme_search );

		$ai_tasks = isset( $payload['tasks'] ) && is_array( $payload['tasks'] ) ? $payload['tasks'] : array();

		// A store needs a theme, so the sell list always offers "Choose a theme" — the AI is not required to pick
		// one. Add it when absent so build_tasks enriches it like any catalog task (get_ai_task_ids mirrors this).
		if ( 'sell' === $goal ) {
			$ai_tasks = $this->ensure_theme_task( $ai_tasks );
		}

		$tasks = empty( $ai_tasks ) ? array() : $this->build_tasks( $ai_tasks, false, $theme_cta, $disable_hidden_woo );

		// The sell goal leads with the store-setup task; every other goal may offer the gallery task. They are
		// mutually exclusive so a sell site with a visual niche doesn't also get an off-target gallery task.
		if ( 'sell' === $goal ) {
			// The store-setup tasks lead the sell list. Their synthetic ids never appear in the AI payload, so a
			// plain prepend is safe. The theme task then follows them: pick the store's look once the store exists.
			$tasks = array_merge( $this->build_store_tasks( $woo_active ), $tasks );
			$tasks = $this->move_task_after( $tasks, 'site_theme_selected', 'setup_woocommerce_store' );
		} else {
			$gallery = $this->build_gallery_task( $inferred );
			if ( null !== $gallery ) {
				$tasks = $this->insert_before_launch_task( $tasks, $gallery );
			}
		}

		return $this->apply_skipped_tasks( $tasks );
	}

	/**
	 * Latches OPTION_COMPLETED the first time the list is fully done. Called on every path that can finish the last
	 * task (read, skip, complete-on-click); the already-set check skips the rebuild once latched.
	 *
	 * @return void
	 */
	private function maybe_mark_completed() {
		if ( get_option( self::OPTION_COMPLETED ) ) {
			return;
		}

		if ( $this->compute_tasklist_complete() ) {
			update_option( self::OPTION_COMPLETED, true, true );
		}
	}

	/**
	 * Whether every task on the tailored list is completed or skipped. An empty/absent list is not "complete" — the
	 * wizard still needs to run.
	 *
	 * @return bool
	 */
	private function compute_tasklist_complete() {
		if ( ! get_option( self::OPTION_AI_OUTPUT ) ) {
			return false;
		}

		$tasks = $this->get_current_tasks();
		if ( empty( $tasks ) ) {
			return false;
		}

		foreach ( $tasks as $task ) {
			// A skip coerces `completed` true; a disabled preview task stays incomplete until its prerequisite is met.
			if ( empty( $task['completed'] ) ) {
				return false;
			}
		}

		return true;
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

		// A fresh list must not inherit the previous one's skips or "done" flag.
		delete_option( self::OPTION_SKIPPED );
		delete_option( self::OPTION_COMPLETED );

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

		// Latch now so completing the last task hides the menu on the next page load, not just on the next read.
		$this->maybe_mark_completed();

		return array(
			'completed' => true,
			'task_id'   => $task_id,
		);
	}

	/**
	 * Marks a task as skipped: it renders (and counts) as completed without its real completion signal ever firing.
	 *
	 * Restricted to tasks on the site's AI-selected list plus the synthetic ids the list adds itself. Persisted
	 * separately from `launchpad_checklist_tasks_statuses` because several catalog tasks recompute completion live
	 * (memberships, woo, domains) and would ignore a status write; the skip set is overlaid on read instead.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array|WP_Error
	 */
	public function skip_task( $request ) {
		$task_id = $request['task_id'];

		$skippable = array_merge( wpcom_ai_launchpad_get_ai_task_ids(), self::SYNTHETIC_TASK_IDS );
		if ( ! in_array( $task_id, $skippable, true ) ) {
			return new WP_Error(
				'ai_launchpad_task_not_skippable',
				__( 'This task is not on the tailored list.', 'jetpack-mu-wpcom' ),
				array( 'status' => 404 )
			);
		}

		$skipped = $this->get_skipped_task_ids();
		if ( ! in_array( $task_id, $skipped, true ) ) {
			$skipped[] = $task_id;
			update_option( self::OPTION_SKIPPED, $skipped, false );
		}

		// Latch now so skipping the last task hides the menu on the next page load, not just on the next read.
		$this->maybe_mark_completed();

		return array(
			'skipped' => true,
			'task_id' => $task_id,
		);
	}

	/**
	 * Deletes the AI output and marks the AI Launchpad as dismissed.
	 *
	 * @return array
	 */
	public function dismiss() {
		delete_option( self::OPTION_AI_OUTPUT );
		delete_option( self::OPTION_SKIPPED );
		delete_option( self::OPTION_COMPLETED );
		update_option( self::OPTION_DISMISSED, true, true );

		return array( 'dismissed' => true );
	}

	/**
	 * The persisted skipped task ids, always as a clean string array, remapped onto the
	 * ids the launchpad renders — a skip recorded under a task's raw id before that id
	 * was remapped must keep applying to the card it renders as now.
	 *
	 * @return string[]
	 */
	private function get_skipped_task_ids() {
		$skipped = get_option( self::OPTION_SKIPPED, array() );
		if ( ! is_array( $skipped ) ) {
			return array();
		}

		$skipped = array_map( 'wpcom_ai_launchpad_remap_task_id', array_filter( $skipped, 'is_string' ) );

		return array_values( array_unique( $skipped ) );
	}

	/**
	 * Overlays the persisted skips onto the enriched tasks: a skipped task carries `skipped: true` and is coerced to
	 * completed, so progress, auto-expand, and reloads all treat it as done (a skip must never pop back open).
	 *
	 * @param array $tasks The enriched task list.
	 * @return array
	 */
	private function apply_skipped_tasks( $tasks ) {
		$skipped = $this->get_skipped_task_ids();

		foreach ( $tasks as &$task ) {
			$task['skipped'] = in_array( $task['id'], $skipped, true );
			if ( $task['skipped'] ) {
				$task['completed'] = true;
			}
		}
		unset( $task );

		return $tasks;
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
		$built    = array();
		$seen_ids = array();
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
			} catch ( \Throwable $e ) {
				continue;
			}
			// build_tasks runs per id here, so its own dedup can't see this collision: the catalog holds both
			// `woo_launch_site` and `site_launched`, and the former is remapped onto the latter. Keep the first.
			$card = $one[0] ?? null;
			if ( null === $card || isset( $seen_ids[ $card['id'] ] ) ) {
				continue;
			}
			$seen_ids[ $card['id'] ] = true;
			$built[]                 = $card;
		}
		return $built;
	}

	/**
	 * Enriches the persisted tasks with title, completion state, and CTA path from the catalog.
	 *
	 * @param array       $tasks              The persisted `payload.tasks` array.
	 * @param bool        $bypass_visibility  Skip the catalog visibility gate (for the all-tasks testing view).
	 * @param string|null $theme_cta          The resolved themes-showcase path for the theme-picker tasks, or
	 *                                        null to keep their default CTAs.
	 * @param bool        $disable_hidden_woo Keep WOO_TASK_IDS that fail the visibility gate as disabled preview
	 *                                        cards instead of dropping them (sell goal while WooCommerce is inactive).
	 * @return array
	 */
	private function build_tasks( $tasks, $bypass_visibility = false, $theme_cta = null, $disable_hidden_woo = false ) {
		$definitions = wpcom_launchpad_get_task_definitions();
		$built       = array();
		$seen_ids    = array();

		// Some catalog visibility callbacks call is_plugin_active(), which is not loaded during a REST request.
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$is_private_site = $this->is_private_site();

		foreach ( $tasks as $task ) {
			if ( ! is_array( $task ) || ! isset( $task['id'] ) || ! isset( $task['subtitle'] ) ) {
				continue;
			}

			// Broken/meaningless-in-context ids render as their working equivalent (see the helper for the why).
			$task['id'] = wpcom_ai_launchpad_remap_task_id( $task['id'] );

			if ( ! isset( $definitions[ $task['id'] ] ) ) {
				continue;
			}

			// One card per id — the client keys cards by id. The remap above can collide with the target id already
			// being present (notably the ?all_tasks=1 view, which enumerates every catalog id), so collapse any
			// repeat to the first occurrence.
			if ( isset( $seen_ids[ $task['id'] ] ) ) {
				continue;
			}

			// The Jetpack Social tasks point at an admin page wpcom doesn't load on a private site, so hide them there.
			if ( $is_private_site && in_array( $task['id'], self::SOCIAL_PAGE_TASK_IDS, true ) ) {
				continue;
			}

			$definition       = $definitions[ $task['id'] ];
			$definition['id'] = $task['id'];
			$disabled         = false;

			// Honor the catalog's own visibility gate: a task the catalog would hide here must not render, since its
			// CTA would 404 and it could never complete. Filtered on read so the deterministic fallback stays usable.
			if (
				! $bypass_visibility
				&& ! in_array( $task['id'], self::FORCE_VISIBLE_TASK_IDS, true )
				&& ! wpcom_launchpad_checklists()->is_visible( $definition )
			) {
				// On a sell site without WooCommerce, keep the commerce tasks as a disabled preview of the store
				// roadmap rather than dropping them and collapsing the list. Everything else stays hidden.
				if ( $disable_hidden_woo && in_array( $task['id'], self::WOO_TASK_IDS, true ) ) {
					$disabled = true;
				} else {
					continue;
				}
			}

			if ( $disabled ) {
				// A disabled preview always renders as the locked card: never resolve its completion (the woo
				// completion callback marks the task complete as a side effect, which must not fire on a read) and
				// never resolve a CTA path (it has no reachable action).
				$completed    = false;
				$calypso_path = null;
			} else {
				// The membership tasks' catalog callbacks are always false on Atomic; recompute from local signals.
				$completed = AI_Launchpad_Memberships::has_override( $task['id'] )
					? AI_Launchpad_Memberships::is_task_complete( $task['id'] )
					: wpcom_launchpad_checklists()->is_task_complete( $definition );

				// The theme-picker task points at the showcase pre-filtered for the site (Store category on sell,
				// the AI's theme keyword elsewhere) instead of plain themes.php. The legacy design_selected/
				// design_completed ids consolidate onto site_theme_selected via wpcom_ai_launchpad_remap_task_id().
				$theme_showcase_path = 'site_theme_selected' === $task['id'] ? $theme_cta : null;
				$cta_override        = $this->get_cta_override( $task['id'] );
				if ( null !== $theme_showcase_path ) {
					$calypso_path = $theme_showcase_path;
				} elseif ( null !== $cta_override ) {
					$calypso_path = $cta_override;
				} else {
					$calypso_path = wpcom_launchpad_checklists()->load_calypso_path( $definition );
				}

				// Simple sites have no reachable wp-admin plugins screen; route any plugin-screen CTA to Calypso.
				$calypso_path = $this->to_simple_plugins_path( $calypso_path );
			}

			$title       = isset( $definition['get_title'] ) ? $definition['get_title']() : '';
			$in_progress = false;

			// A saved-but-unpublished draft (found by marker meta) puts a site-editor task "in progress": reopen that
			// draft instead of creating a new one, and surface the drafts icon + a "Continue…" prompt in the card.
			if ( ! $completed && ! $disabled ) {
				$draft_url = $this->get_in_progress_draft_url( $task['id'] );
				if ( null !== $draft_url ) {
					$in_progress  = true;
					$calypso_path = $draft_url;
				}
			}

			// Title follows our precise in-progress signal so it, the icon, and the CTA agree.
			$title = $this->get_task_title( $task['id'], $in_progress, $title );

			$seen_ids[ $task['id'] ] = true;
			$built[]                 = array(
				'id'           => $task['id'],
				'subtitle'     => $task['subtitle'],
				'title'        => $title,
				'completed'    => $completed,
				'in_progress'  => $in_progress,
				'disabled'     => $disabled,
				'calypso_path' => $calypso_path,
			);
		}

		return $built;
	}

	/**
	 * The wp-admin CTA destination the AI Launchpad substitutes for a task's catalog path, or null to keep the catalog's.
	 *
	 * Static repoints live in CTA_OVERRIDES; `add_subscribe_block` is resolved here because its destination depends on
	 * the active theme: the Site Editor is where a block theme adds the Subscribe block to a template (the action its
	 * completion listener watches), and the block-based widget editor is the closest equivalent on a classic theme
	 * (normally unreachable — the task's catalog visibility is FSE-only — but the theme can change after tailoring).
	 *
	 * @param string $task_id The catalog task id.
	 * @return string|null
	 */
	private function get_cta_override( $task_id ) {
		if ( 'add_subscribe_block' === $task_id ) {
			return admin_url( wp_is_block_theme() ? 'site-editor.php' : 'widgets.php' );
		}

		if ( isset( self::CTA_OVERRIDES[ $task_id ] ) ) {
			return admin_url( self::CTA_OVERRIDES[ $task_id ] );
		}

		return null;
	}

	/**
	 * On Simple sites, rewrite a wp-admin plugins-screen CTA to its Calypso equivalent.
	 *
	 * Simple sites have no reachable wp-admin plugins UI, so any task whose CTA lands on `plugins.php` or
	 * `plugin-install.php` would dead-end. Those are mapped to the Calypso plugins page — a specific plugin
	 * when a slug is given, otherwise the site's plugins list. Non-plugin paths and Atomic sites pass through.
	 *
	 * @param string|null $path        The resolved CTA path.
	 * @param string      $plugin_slug Optional plugin slug to deep-link to on Calypso.
	 * @return string|null
	 */
	private function to_simple_plugins_path( $path, $plugin_slug = '' ) {
		if ( ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || ! is_string( $path ) ) {
			return $path;
		}

		if ( false === strpos( $path, 'plugins.php' ) && false === strpos( $path, 'plugin-install.php' ) ) {
			return $path;
		}

		$slug_segment = '' !== $plugin_slug ? rawurlencode( $plugin_slug ) . '/' : '';
		return '/plugins/' . $slug_segment . rawurlencode( wpcom_get_site_slug() );
	}

	/**
	 * The wordpress.com themes-showcase path the theme-picker tasks should point at.
	 *
	 * Sell sites always land on the showcase's Store category so shop-ready templates lead; other goals get the
	 * showcase pre-filtered by the AI's theme search term (as the free-text `?s=`), and null when nothing was
	 * inferred to search by, so the caller falls back to the task's default CTA. The client's `toNavigableUrl`
	 * resolves the relative path against wordpress.com.
	 *
	 * @param string $goal   The inferred goal.
	 * @param string $search The AI's theme_keyword, or the inferred niche as fallback.
	 * @return string|null
	 */
	private function get_themes_showcase_path( $goal, $search ) {
		if ( 'sell' === $goal ) {
			return '/themes/filter/store/' . rawurlencode( wpcom_get_site_slug() );
		}

		if ( '' === $search ) {
			return null;
		}

		return '/themes/all/' . rawurlencode( wpcom_get_site_slug() ) . '?s=' . rawurlencode( $this->niche_to_search_term( $search ) );
	}

	/**
	 * Ensures the persisted task list contains the theme-picker task, appending `site_theme_selected` when no
	 * task already resolves to it. A design task that remaps onto it (via wpcom_ai_launchpad_remap_task_id)
	 * counts as present, so a theme card is never duplicated.
	 *
	 * @param array $tasks The persisted `payload.tasks` array.
	 * @return array
	 */
	private function ensure_theme_task( $tasks ) {
		foreach ( $tasks as $task ) {
			if ( is_array( $task ) && isset( $task['id'] ) && is_string( $task['id'] )
				&& 'site_theme_selected' === wpcom_ai_launchpad_remap_task_id( $task['id'] ) ) {
				return $tasks;
			}
		}

		$tasks[] = array(
			'id'       => 'site_theme_selected',
			'subtitle' => __( 'Choose a theme that fits your store.', 'jetpack-mu-wpcom' ),
		);

		return $tasks;
	}

	/**
	 * Moves the task with the given id to immediately after another task. The list is returned unchanged
	 * unless both ids are present.
	 *
	 * @param array  $tasks    The built task list.
	 * @param string $move_id  The id of the task to move.
	 * @param string $after_id The id of the task to place it after.
	 * @return array
	 */
	private function move_task_after( $tasks, $move_id, $after_id ) {
		$ids  = array_column( $tasks, 'id' );
		$from = array_search( $move_id, $ids, true );
		if ( false === $from || false === array_search( $after_id, $ids, true ) ) {
			return $tasks;
		}

		$moved = array_splice( $tasks, $from, 1 );
		// Recompute the anchor: extracting an earlier element shifts it left by one.
		$to = array_search( $after_id, array_column( $tasks, 'id' ), true );
		array_splice( $tasks, $to + 1, 0, $moved );

		return $tasks;
	}

	/**
	 * Reduces a possibly multi-word niche to a single keyword for the themes-showcase search.
	 *
	 * The showcase ANDs its search terms, so a phrase like "ceramics and pottery" matches no theme even
	 * though "ceramics" and "pottery" each do. Connective/filler words are dropped and the first remaining
	 * keyword is kept. Falls back to the trimmed niche when nothing survives filtering.
	 *
	 * @param string $niche The AI-inferred niche.
	 * @return string
	 */
	private function niche_to_search_term( $niche ) {
		$stop_words = array( 'and', 'or', 'the', 'a', 'an', 'of', 'for', 'with', 'in', 'on', 'to', 'your', 'my' );
		$words      = preg_split( '/[\s,&]+/', strtolower( $niche ), -1, PREG_SPLIT_NO_EMPTY );

		foreach ( $words as $word ) {
			if ( ! in_array( $word, $stop_words, true ) ) {
				return $word;
			}
		}

		return trim( $niche );
	}

	/**
	 * Visual-work niche keywords that (along with the `portfolio` goal) surface the synthetic gallery task.
	 */
	const GALLERY_NICHE_KEYWORDS = array(
		'photography',
		'photo',
		'photos',
		'photographer',
		'portfolio',
		'gallery',
		'art',
		'artist',
		'illustration',
		'illustrator',
		'design',
		'designer',
		'visual',
		'painting',
		'drawing',
	);

	/**
	 * Whether the synthetic "Create your first gallery" task should be offered, based on the inferred goal/niche.
	 *
	 * @param array $inferred The AI output's `inferred` block.
	 * @return bool
	 */
	private function should_offer_gallery_task( $inferred ) {
		$goal = isset( $inferred['goal'] ) && is_string( $inferred['goal'] ) ? $inferred['goal'] : '';
		if ( 'portfolio' === $goal ) {
			return true;
		}

		$niche = isset( $inferred['niche'] ) && is_string( $inferred['niche'] ) ? strtolower( $inferred['niche'] ) : '';
		if ( '' === $niche ) {
			return false;
		}

		// Split on any non-alphanumeric run so hyphenated/compound niches ("wildlife-photography") tokenize like the client.
		$words = preg_split( '/[^a-z0-9]+/', $niche, -1, PREG_SPLIT_NO_EMPTY );
		return array() !== array_intersect( $words, self::GALLERY_NICHE_KEYWORDS );
	}

	/**
	 * Builds the synthetic gallery-task entry, or null when it should not be offered.
	 *
	 * Its id is listed in SYNTHETIC_TASK_IDS so the task stays skippable.
	 *
	 * Completion is read from the status option (written by AI_Launchpad_Gallery_Page_Listener on publish); an
	 * unpublished marker draft puts it in progress and reopens that draft.
	 *
	 * @param array $inferred The AI output's `inferred` block.
	 * @return array|null
	 */
	private function build_gallery_task( $inferred ) {
		if ( ! $this->should_offer_gallery_task( $inferred ) ) {
			return null;
		}

		$statuses  = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$completed = ! empty( $statuses['add_gallery_page'] );

		$in_progress  = false;
		$calypso_path = null;
		if ( ! $completed ) {
			$draft_url = $this->get_in_progress_draft_url( 'add_gallery_page' );
			if ( null !== $draft_url ) {
				$in_progress  = true;
				$calypso_path = $draft_url;
			}
		}

		return array(
			'id'           => 'add_gallery_page',
			'subtitle'     => __( 'Show your work in a beautiful photo gallery.', 'jetpack-mu-wpcom' ),
			'title'        => $this->get_task_title( 'add_gallery_page', $in_progress, __( 'Create your first gallery', 'jetpack-mu-wpcom' ) ),
			'completed'    => $completed,
			'in_progress'  => $in_progress,
			'disabled'     => false,
			'calypso_path' => $calypso_path,
		);
	}

	/**
	 * Builds the synthetic store-setup lead tasks for the sell goal: an "install WooCommerce" task and a "set up
	 * your store" task. Their ids are listed in SYNTHETIC_TASK_IDS so the tasks stay skippable.
	 *
	 * Both are read live (installed/active/profiler options), so no marker or listener is needed. While WooCommerce
	 * is inactive the setup task shows as a disabled preview, matching the disabled commerce tasks below it. Callers
	 * gate this on the sell goal.
	 *
	 * @param bool $active Whether WooCommerce is active.
	 * @return array The lead tasks in display order.
	 */
	private function build_store_tasks( $active ) {
		return array(
			$this->build_install_woocommerce_task( $active ),
			$this->build_setup_store_task( $active ),
		);
	}

	/**
	 * The "Install the WooCommerce plugin" lead task: to-do until the plugin exists, in-progress while it is
	 * installed-but-inactive, and complete once active.
	 *
	 * @param bool $active Whether WooCommerce is active.
	 * @return array
	 */
	private function build_install_woocommerce_task( $active ) {
		$in_progress = ! $active && array_key_exists( 'woocommerce/woocommerce.php', get_plugins() );

		$calypso_path = null;
		if ( ! $active ) {
			// Installed-but-inactive activates from the plugins list; not-installed installs from the plugin search.
			// On Simple both wp-admin screens are unreachable, so route through the Calypso WooCommerce plugin page.
			$wp_admin_path = $in_progress
				? admin_url( 'plugins.php?plugin_status=inactive' )
				: admin_url( 'plugin-install.php?s=woocommerce&tab=search&type=term' );
			$calypso_path  = $this->to_simple_plugins_path( $wp_admin_path, 'woocommerce' );
		}

		return array(
			'id'           => 'install_woocommerce',
			'subtitle'     => $in_progress
				? __( 'Activate the WooCommerce plugin to continue.', 'jetpack-mu-wpcom' )
				: __( 'Add the WooCommerce plugin to start selling.', 'jetpack-mu-wpcom' ),
			'title'        => __( 'Install the WooCommerce plugin', 'jetpack-mu-wpcom' ),
			'completed'    => $active,
			'in_progress'  => $in_progress,
			'disabled'     => false,
			'calypso_path' => $calypso_path,
		);
	}

	/**
	 * The "Set up your store" lead task: to-do until the WooCommerce setup wizard (core profiler) is completed or
	 * skipped, then complete. Shown as a disabled preview until WooCommerce is active, since the wizard needs it.
	 *
	 * @param bool $active Whether WooCommerce is active.
	 * @return array
	 */
	private function build_setup_store_task( $active ) {
		$profile   = (array) get_option( 'woocommerce_onboarding_profile', array() );
		$completed = $active && ( ! empty( $profile['completed'] ) || ! empty( $profile['skipped'] ) );

		return array(
			'id'           => 'setup_woocommerce_store',
			'subtitle'     => __( 'Complete or skip the WooCommerce setup wizard.', 'jetpack-mu-wpcom' ),
			'title'        => __( 'Set up your store', 'jetpack-mu-wpcom' ),
			'completed'    => $completed,
			'in_progress'  => false,
			'disabled'     => ! $active,
			'calypso_path' => $completed || ! $active ? null : admin_url( 'admin.php?page=wc-admin&path=%2Fsetup-wizard' ),
		);
	}

	/**
	 * Inserts a synthetic task immediately before the trailing launch task (or appends it), idempotently by id.
	 *
	 * @param array $tasks The enriched task list.
	 * @param array $task  The synthetic task entry.
	 * @return array
	 */
	private function insert_before_launch_task( $tasks, $task ) {
		foreach ( $tasks as $existing ) {
			if ( isset( $existing['id'] ) && $existing['id'] === $task['id'] ) {
				return $tasks;
			}
		}

		$insert_at = count( $tasks );
		foreach ( $tasks as $index => $existing ) {
			if ( isset( $existing['id'] ) && in_array( $existing['id'], self::LAUNCH_TASK_IDS, true ) ) {
				$insert_at = $index;
				break;
			}
		}

		array_splice( $tasks, $insert_at, 0, array( $task ) );
		return $tasks;
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
		} elseif ( 'add_gallery_page' === $task_id ) {
			$draft_id = AI_Launchpad_Gallery_Page_Listener::get_draft_id();
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
			case 'add_gallery_page':
				return $in_progress ? __( 'Continue working on your gallery', 'jetpack-mu-wpcom' ) : $default;
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
