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

	// `woo_launch_site`, `link_in_bio_launched`, and `videopress_launched` stay valid launch tasks so a stray AI
	// emission passes PUT validation rather than failing the whole list into the deterministic fallback. It is
	// normalized to `site_launched` as it is persisted (see update_tailored) and again on read (see build_tasks,
	// which is what covers lists persisted before the write-side remap existed).
	const LAUNCH_TASK_IDS = array( 'site_launched', 'blog_launched', 'woo_launch_site', 'link_in_bio_launched', 'videopress_launched' );

	/**
	 * Tasks the AI Launchpad marks complete on CTA click, because their real signal is unreachable from wp-admin.
	 *
	 * Server-side allowlist so the complete-task route can only tick these ids. Mirrored client-side in model.ts.
	 *
	 * A registry task may be listed here, but only if its `is_complete` reads `launchpad_checklist_tasks_statuses`:
	 * that is the option complete_task() writes for it, and a definition computing completion from live site state
	 * would ignore the write and render as to-do straight after being ticked.
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
		'pick_fonts_colors',
	);

	/**
	 * Task ids the AI Launchpad synthesizes itself (never present in the AI payload): the sell goal's store-setup
	 * lead tasks. Skips must accept them alongside the AI-selected ids.
	 *
	 * Must list every id minted by build_store_tasks() — a synthetic task missing here renders with a
	 * Skip button whose write is rejected.
	 */
	const SYNTHETIC_TASK_IDS = array(
		'install_woocommerce',
		'setup_woocommerce_store',
	);

	/**
	 * Tasks whose catalog visibility gate is a false negative in this read path, so the AI Launchpad overrides it.
	 *
	 * `add_10_email_subscribers` is gated off WordPress.com, but AI_Launchpad_Subscribers_Listener reads the count on
	 * Atomic, so the task must still render. `add_about_page` is gated on the `_wpcom_template_layout_category`
	 * page-meta key being registered, which does not happen during a REST request, so the task is wrongly hidden even
	 * though its "add a page" CTA works — force it visible so tailoring can offer this genuinely useful task.
	 */
	const FORCE_VISIBLE_TASK_IDS = array(
		'add_10_email_subscribers',
		'add_about_page',
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
	 * `drive_traffic` needs no entry: it remaps onto `connect_social_media` before this gate runs.
	 */
	const SOCIAL_PAGE_TASK_IDS = array(
		'connect_social_media',
	);

	/**
	 * Tasks the model may pick only when the site's goal is one of the listed goals.
	 *
	 * These were prose rules in the tailoring prompt ("Only include woo_* if the goal is sell OR the user
	 * explicitly mentions selling"). Prose is not enforcement: the model can ignore it, and when the
	 * available-tasks lookup fails the prompt falls back to the unfiltered menu. Enforced here instead, at
	 * both ends — the menu never offers them (available_task_ids) and PUT drops them (update_tailored).
	 *
	 * The free-text escape hatch is deliberately gone. The wizard goal is an explicit user choice, and the
	 * escape hatch was the non-determinism being removed.
	 *
	 * The two directions of disagreement with a task's `goals` annotation in js/lib/prompts.ts are not
	 * equivalent, and only one is acceptable:
	 *
	 * - Annotation BROADER than this map is fine. The annotation is soft affinity for the model, this is the
	 *   hard rule, and a task can be a tasteful fit for a goal it is not permitted on — the rule still blocks
	 *   it. The payment tasks are the live example: annotated for `newsletter` as well as `sell`, permitted
	 *   only on `sell`.
	 * - Annotation NARROWER than this map is a bug. It means a task the annotation itself calls goal-specific
	 *   can be selected and persisted on any goal, which is the inappropriate-task problem this whole change
	 *   exists to fix. `woo_tax`, `woo_marketing` and `woo_add_domain` were exactly that: annotated `sell`,
	 *   unrestricted here, and renderable on a blog — their catalog gate
	 *   (wpcom_launchpad_is_woocommerce_setup_visible) is goal-agnostic and passes on any WoA site with
	 *   WooCommerce active, which is every site this feature runs on.
	 *
	 * So: every id annotated with a single goal belongs here. No exceptions — `sensei_setup` is listed even
	 * though its catalog gate (WoA plus Sensei LMS active) already hides it almost everywhere, because a rule
	 * with one documented exception is a rule the next auditor has to re-derive. AI_Launchpad_Task_Menu_Test
	 * reads the annotations and fails if a single-goal one is missing here.
	 *
	 * The ids are matched after wpcom_ai_launchpad_remap_task_id(), so a twin of a restricted task is covered
	 * by the entry for the id it renders as and must not be listed separately.
	 */
	const GOAL_RESTRICTED_TASK_IDS = array(
		'woo_products'             => 'sell',
		'woo_customize_store'      => 'sell',
		'woo_woocommerce_payments' => 'sell',
		'woo_tax'                  => 'sell',
		'woo_marketing'            => 'sell',
		'woo_add_domain'           => 'sell',
		'set_up_payments'          => 'sell',
		'stripe_connected'         => 'sell',
		'add_10_email_subscribers' => 'newsletter',
		'import_subscribers'       => 'newsletter',
		'newsletter_plan_created'  => 'newsletter',
		'sensei_setup'             => 'educate',
	);

	/**
	 * Tasks excluded for one specific goal and allowed on every other — the inverse of GOAL_RESTRICTED_TASK_IDS.
	 *
	 * Split into its own map rather than folded in behind a `!sell` marker, so neither map needs a value whose
	 * meaning flips on a prefix and each docblock describes all of its own entries.
	 *
	 * `add_gallery_page` is excluded for sell so a store site cannot end up with both the store sequence and a
	 * gallery. get_current_tasks() used to enforce that structurally, through the if/else that injected the
	 * gallery only on the non-sell branch; now that the model picks the gallery from the menu, this entry is
	 * the only thing holding it — the menu never offers it on sell, and PUT drops it if the model picks it anyway.
	 *
	 * Both ends are write-side: build_tasks() applies no exclusion, so a payload that already holds an excluded id
	 * renders it. Reaching that needs a compound failure (the availability lookup fails, so the prompt falls back
	 * to the full menu, AND the wizard-goal option has not landed yet, so the goal comes from the model's echo).
	 * True of every entry in both maps, not just this one; read-side enforcement is the fix if it ever bites.
	 */
	const GOAL_EXCLUDED_TASK_IDS = array(
		'add_gallery_page' => 'sell',
	);

	/**
	 * First-post tasks that can sit "in progress": the AI-created draft post exists but has not been published yet.
	 *
	 * Detected through the `_wpcom_ai_launchpad_first_post` marker meta (via AI_Launchpad_First_Post_Listener), so an
	 * unrelated pre-existing draft never counts. Paired with `add_about_page`, which has its own marker meta.
	 * `first_post_published_newsletter` needs no entry: it remaps onto `first_post_published` before this runs.
	 */
	const IN_PROGRESS_FIRST_POST_TASK_IDS = array(
		'first_post_published',
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
			$this->rest_base . '/available-tasks',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_available_tasks' ),
					'permission_callback' => array( $this, 'can_read' ),
					'args'                => array(
						'goal' => array(
							'description'       => 'The selected goal; sell keeps commerce tasks as available previews.',
							'type'              => 'string',
							'default'           => '',
							'sanitize_callback' => 'sanitize_key',
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
						'source'      => array(
							'description' => 'Whether the payload came from the AI or the deterministic fallback. Query parameter; the JSON body must match the agent output schema exactly.',
							'type'        => 'string',
							'enum'        => array( 'ai', 'fallback' ),
							'default'     => 'ai',
						),
						'duration_ms' => array(
							'description' => 'Client-measured tailoring duration in milliseconds, for the tailored Logstash record.',
							'type'        => 'integer',
							'minimum'     => 0,
						),
						'attempts'    => array(
							'description' => 'How many jetpack-ai-query attempts the client made, for the tailored Logstash record.',
							'type'        => 'integer',
							'minimum'     => 0,
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
		if ( is_array( $ai_output ) ) {
			// Internal analytics bookkeeping (see report_task_completions), not part of the client contract.
			unset( $ai_output['tracked_completed'] );
		}

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
	 * The site's tailored task list (AI-selected + the synthetic store tasks, skip overlay applied) — the tasks
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
		$inferred       = isset( $payload['inferred'] ) && is_array( $payload['inferred'] ) ? $payload['inferred'] : array();
		$theme_category = isset( $inferred['theme_category'] ) && is_string( $inferred['theme_category'] )
			? $inferred['theme_category']
			: '';

		// The same authority update_tailored() enforces against: the user's own wizard goal, not the
		// model's echo of it. Anything else lets PUT strip a goal's tasks while GET injects them.
		$goal = wpcom_ai_launchpad_resolve_goal( $payload );

		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$woo_active = is_plugin_active( 'woocommerce/woocommerce.php' );

		// On a sell site without WooCommerce, keep the gated commerce tasks as a disabled preview of the store
		// roadmap instead of dropping them (which would collapse the list to almost nothing).
		$disable_hidden_woo = 'sell' === $goal && ! $woo_active;

		$theme_cta = $this->get_themes_showcase_path( $goal, $theme_category );

		$ai_tasks = isset( $payload['tasks'] ) && is_array( $payload['tasks'] ) ? $payload['tasks'] : array();

		// A store needs a theme, so the sell list always offers "Choose a theme" — the AI is not required to pick
		// one. Add it when absent so build_tasks enriches it like any catalog task (get_ai_task_ids mirrors this).
		if ( 'sell' === $goal ) {
			$ai_tasks = $this->ensure_theme_task( $ai_tasks );
		}

		$tasks = empty( $ai_tasks ) ? array() : $this->build_tasks( $ai_tasks, false, $theme_cta, $disable_hidden_woo );

		// The sell goal leads with the store-setup tasks; the theme task then follows them: pick the
		// store's look once the store exists. Other goals need no injection — the gallery task is now
		// on the menu, so the AI picks it when the site is visual.
		if ( 'sell' === $goal ) {
			$tasks = array_merge( $this->build_store_tasks( $woo_active ), $tasks );
			$tasks = $this->move_task_after( $tasks, 'site_theme_selected', 'setup_woocommerce_store' );
		}

		// Restore the list toward six after the visibility gate has dropped tasks (before skips, which are the
		// user's own removals). No-op on an empty list so the wizard still runs when there is no AI output.
		$tasks = $this->backfill_to_minimum( $tasks, $theme_cta, $disable_hidden_woo );

		return $this->apply_skipped_tasks( $tasks );
	}

	/**
	 * Tops a short rendered list back up toward the six tasks the AI is asked to return.
	 *
	 * The catalog visibility gate in build_tasks() drops any task it hides on this site (e.g. add_about_page needs a
	 * page-template meta key that is absent during a REST request) with no replacement, so a gate-heavy AI pick can
	 * collapse the list to two or three cards. This backfills from a small pool of broadly-useful tasks and keeps the
	 * launch task last. Candidates are built one at a time, stopping at the target, so the tail of the pool is only
	 * evaluated when the earlier fillers were not enough — mobile_app_installed's completion check does a remote
	 * lookup while incomplete, which the common short-by-one list never has to pay for. Backfilled cards are
	 * skippable (see skip_task); a fuller, AI-ranked overflow pool is the eventual replacement.
	 *
	 * @param array  $tasks              The rendered task list, already gated, launch task last.
	 * @param string $theme_cta          Pre-resolved themes-showcase CTA passed through to build_tasks().
	 * @param bool   $disable_hidden_woo Whether hidden commerce tasks render as a disabled preview.
	 * @return array
	 */
	private function backfill_to_minimum( $tasks, $theme_cta, $disable_hidden_woo ) {
		$target = 6;
		if ( count( $tasks ) >= $target || empty( $tasks ) ) {
			return $tasks;
		}

		foreach ( $this->backfill_pool() as $id => $subtitle ) {
			if ( count( $tasks ) >= $target ) {
				break;
			}
			$present = array_column( $tasks, 'id' );
			if ( in_array( $id, $present, true ) ) {
				continue;
			}

			// build_tasks() applies the same gating and remap the AI list gets, so a pool task the site
			// hides simply does not appear.
			$built = $this->build_tasks(
				array(
					array(
						'id'       => $id,
						'subtitle' => $subtitle,
					),
				),
				false,
				$theme_cta,
				$disable_hidden_woo
			);
			if ( empty( $built ) ) {
				continue;
			}
			$task = $built[0];
			// A filler card that is already complete offers nothing to do; better a shorter list. The remap
			// inside build_tasks() can also land the card on an id already present — skip that too.
			if ( ! empty( $task['completed'] ) || in_array( $task['id'], $present, true ) ) {
				continue;
			}
			$tasks = $this->insert_before_launch_task( $tasks, $task );
		}

		return $tasks;
	}

	/**
	 * The ordered id => subtitle pool the short-list backfill draws from: broadly-useful tasks that render on most
	 * sites and are skippable, most-broadly-applicable first. Each has a distinct card title, and none duplicate work
	 * the wizard already did (e.g. no site-title task — the wizard captured the name). Excludes tasks whose completion
	 * depends on the AI-task list (the theme/social listeners, the complete-on-click route), since a backfilled card is
	 * not on that list. skip_task() reads the ids here to keep every backfilled card skippable, so the set lives here.
	 *
	 * @return array<string, string>
	 */
	private function backfill_pool() {
		return array(
			'design_edited'        => __( 'Make the design your own.', 'jetpack-mu-wpcom' ),
			'add_new_page'         => __( 'Add a page your visitors will want, like About or Contact.', 'jetpack-mu-wpcom' ),
			'connect_social_media' => __( 'Connect your social accounts to reach more people.', 'jetpack-mu-wpcom' ),
			'mobile_app_installed' => __( 'Manage your site from anywhere with the Jetpack app.', 'jetpack-mu-wpcom' ),
		);
	}

	/**
	 * Runs the completion pass: reports newly-completed tasks to Tracks, then latches OPTION_COMPLETED (and records
	 * the all-tasks-completed event) the first time the list is fully done. Called on every path that can finish a
	 * task (read, skip, complete-on-click); the already-set check skips the rebuild once latched.
	 *
	 * @return void
	 */
	private function maybe_mark_completed() {
		if ( get_option( self::OPTION_COMPLETED ) ) {
			return;
		}

		// No AI output means the wizard hasn't produced a list yet: nothing to report or latch.
		if ( ! get_option( self::OPTION_AI_OUTPUT ) ) {
			return;
		}

		$tasks = $this->get_current_tasks();
		// An empty list is not "complete" — the wizard still needs to run.
		if ( empty( $tasks ) ) {
			return;
		}

		$this->report_task_completions( $tasks );

		foreach ( $tasks as $task ) {
			// A skip coerces `completed` true; a disabled preview task stays incomplete until its prerequisite is met.
			if ( empty( $task['completed'] ) ) {
				return;
			}
		}

		update_option( self::OPTION_COMPLETED, true, true );
		// After the per-task reports above, so any task_completed reports precede it (a list finished
		// purely by skips or born-completed tasks latches with none).
		wpcom_ai_launchpad_record_tracks_event(
			'jetpack_ai_launchpad_all_tasks_completed',
			array(),
			array_column( $tasks, 'id' )
		);
	}

	/**
	 * Records a `task_completed` Tracks event for every rendered task that newly reads as completed, whatever
	 * completed it (client click, PHP listener, or live recomputation à la Woo/domains/memberships) — the only
	 * uniform signal is the rendered list itself, so completions are diffed on read.
	 *
	 * The already-reported ids are embedded in the existing AI-output envelope (`tracked_completed`) rather than a
	 * new option; a re-tailor rewrites the envelope, which re-baselines the set at the same moment the skip/completed
	 * options reset. PUT /tailored seeds the key with the born-completed tasks, so a pass here only ever reports
	 * user-triggered completions; an envelope persisted before the key existed gets the same silent baseline on its
	 * first pass. Skipped tasks render as completed but already emit `task_skipped`, so they are excluded (and never
	 * reported later).
	 *
	 * @param array $tasks The current rendered tasks.
	 * @return void
	 */
	private function report_task_completions( $tasks ) {
		$ai_output = get_option( self::OPTION_AI_OUTPUT );
		if ( ! is_array( $ai_output ) ) {
			return;
		}

		$skipped   = $this->get_skipped_task_ids();
		$completed = array();
		foreach ( $tasks as $task ) {
			if ( ! empty( $task['completed'] ) && ! in_array( $task['id'], $skipped, true ) ) {
				$completed[] = $task['id'];
			}
		}

		// null = no key yet, i.e. the baseline pass right after tailoring. Remapped like the skip overlay: a
		// baseline recorded under a since-remapped id must keep covering the id its card renders as now, or the
		// same completion would be re-reported once under the new id.
		$reported = isset( $ai_output['tracked_completed'] ) && is_array( $ai_output['tracked_completed'] )
			? array_values( array_unique( array_map( 'wpcom_ai_launchpad_remap_task_id', $ai_output['tracked_completed'] ) ) )
			: null;
		$newly    = array_values( array_diff( $completed, $reported ?? array() ) );

		if ( null !== $reported ) {
			if ( empty( $newly ) ) {
				return;
			}
			$rendered_ids = array_column( $tasks, 'id' );
			foreach ( $newly as $task_id ) {
				wpcom_ai_launchpad_record_tracks_event(
					'jetpack_ai_launchpad_task_completed',
					array( 'task_id' => $task_id ),
					$rendered_ids
				);
			}
		}

		$ai_output['tracked_completed'] = array_merge( $reported ?? array(), $newly );
		update_option( self::OPTION_AI_OUTPUT, $ai_output, false );
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

		// The AI's raw picks, captured before the unknown-id filter below so hallucinated ids stay observable.
		$raw_task_ids = array_column( $payload['tasks'], 'id' );

		$definitions = wpcom_launchpad_get_task_definitions();
		$tasks       = array();

		// The exclusions key off the goal the user chose, resolved through the shared helper so this and the
		// read path cannot disagree about which goal the site has.
		$excluded = self::excluded_task_ids_for_goal( wpcom_ai_launchpad_resolve_goal( $payload ) );

		foreach ( $payload['tasks'] as $task ) {
			// Judge — and persist — the id this task will actually render as. build_tasks() remaps broken and
			// twinned ids on read, so checking the raw id would let a restricted task in under its other name:
			// `subscribers_added` is off the menu and unrestricted, yet renders as the newsletter-restricted
			// `import_subscribers`. The rule has to see the card, not the spelling.
			$task_id = wpcom_ai_launchpad_remap_task_id( $task['id'] );

			if ( ! isset( $definitions[ $task_id ] ) && ! AI_Launchpad_Task_Registry::has( $task_id ) ) {
				continue;
			}

			// Goal-restricted tasks are dropped even if the model picked them: the menu filter is advisory
			// (a failed availability lookup falls back to the full menu), this is not.
			if ( in_array( $task_id, $excluded, true ) ) {
				continue;
			}

			$subtitle = $this->sanitize_subtitle( $task['subtitle'] );
			if ( is_wp_error( $subtitle ) ) {
				return $subtitle;
			}

			$tasks[] = array(
				'id'       => $task_id,
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

		// Baseline the born-completed tasks now (needs the fresh options above), so completion
		// reporting only ever emits for completions the user actually triggers afterwards.
		$rendered_tasks = $this->get_current_tasks();
		$baseline       = array();
		foreach ( $rendered_tasks as $task ) {
			if ( ! empty( $task['completed'] ) ) {
				$baseline[] = $task['id'];
			}
		}
		$ai_output['tracked_completed'] = $baseline;
		update_option( self::OPTION_AI_OUTPUT, $ai_output, false );

		// After the writes, so the observed rendered list is the fresh one.
		$this->log_tailoring( $ai_output, $raw_task_ids, $request['duration_ms'], $request['attempts'], array_column( $rendered_tasks, 'id' ) );

		// The analytics bookkeeping stays out of responses, mirroring get_data().
		unset( $ai_output['tracked_completed'] );

		return array( 'ai_output' => $ai_output );
	}

	/**
	 * Emits the tailoring observation event to Logstash, keyed `feature: atomic_ai_launchpad`, `message: tailored`
	 * (the public-api logstash endpoint whitelists features by their `atomic_` prefix — a bare feature name is
	 * rejected with a 400 on the Atomic HTTP dispatch path). Best-effort: logging must never fail the tailoring write.
	 *
	 * @param array         $ai_output    The persisted AI output envelope.
	 * @param string[]      $raw_task_ids The AI's selected ids before the unknown-id filter.
	 * @param int|null      $duration_ms  Client-measured tailoring duration, or null when not sent.
	 * @param int|null      $attempts     Client-reported jetpack-ai-query attempt count, or null when not sent.
	 * @param string[]|null $rendered_ids The rendered task ids, when the caller already computed them.
	 * @return void
	 */
	private function log_tailoring( $ai_output, $raw_task_ids, $duration_ms = null, $attempts = null, $rendered_ids = null ) {
		try {
			/**
			 * Gates the tailoring observation event sent to Logstash. Checked before the event
			 * is built, so disabling it also skips the extra task-list rebuild the event needs.
			 *
			 * @param bool $enabled Whether to send the event. Default true.
			 */
			if ( ! apply_filters( 'wpcom_ai_launchpad_tailoring_log_enabled', true ) ) {
				return;
			}

			\Automattic\Jetpack\Jetpack_Mu_Wpcom::log2logstash(
				'atomic_ai_launchpad',
				'tailored',
				$this->tailoring_log_extra( $ai_output, $raw_task_ids, $duration_ms, $attempts, $rendered_ids )
			);
		} catch ( \Throwable $e ) {
			unset( $e );
		}
	}

	/**
	 * The tailoring observation event: how the AI's output relates to what the site will actually render.
	 *
	 * Carries the inferred details, the AI's raw selected ids (pre-filter, so hallucinated ids are observable), the
	 * rendered ids, and their delta — `dropped` is what the unknown-id filter and the visibility gate removed, `added`
	 * is what synthetics and the backfill floor put in. The delta is diffed post-remap so a selected id that renders
	 * under its working equivalent does not read as a drop plus an addition. The raw wizard title/description are
	 * never included, and the inferred fields that can echo the user's own words near-verbatim are stripped:
	 * `brand_name` restates the title and `tagline` is drafted from the description.
	 *
	 * @param array         $ai_output    The persisted AI output envelope.
	 * @param string[]      $raw_task_ids The AI's selected ids before the unknown-id filter.
	 * @param int|null      $duration_ms  Client-measured tailoring duration, or null when not sent.
	 * @param int|null      $attempts     Client-reported jetpack-ai-query attempt count, or null when not sent.
	 * @param string[]|null $rendered_ids The rendered task ids, when the caller already computed them.
	 * @return array
	 */
	private function tailoring_log_extra( $ai_output, $raw_task_ids, $duration_ms = null, $attempts = null, $rendered_ids = null ) {
		// Schema-validated on the write path, so `inferred` is always present here.
		$inferred = $ai_output['payload']['inferred'];
		unset( $inferred['brand_name'], $inferred['tagline'] );

		$rendered = $rendered_ids ?? array_column( $this->get_current_tasks(), 'id' );
		$remapped = array_unique( array_map( 'wpcom_ai_launchpad_remap_task_id', $raw_task_ids ) );

		$extra = array(
			'source'   => $ai_output['source'],
			'inferred' => $inferred,
			'selected' => $raw_task_ids,
			'rendered' => $rendered,
			'dropped'  => array_values( array_diff( $remapped, $rendered ) ),
			'added'    => array_values( array_diff( $rendered, $remapped ) ),
		);

		// Client-measured timing, replacing the retired ai_response_received Tracks event.
		if ( null !== $duration_ms ) {
			$extra['duration_ms'] = (int) $duration_ms;
		}
		if ( null !== $attempts ) {
			$extra['attempts'] = (int) $attempts;
		}

		return $extra;
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

		// The registry's ids are not in the shared catalog, and wpcom_mark_launchpad_task_complete() drops
		// what the catalog does not define, so those go through the registry's own write.
		if ( AI_Launchpad_Task_Registry::has( $task_id ) ) {
			AI_Launchpad_Task_Registry::mark_complete( $task_id );
		} else {
			wpcom_mark_launchpad_task_complete( $task_id );
		}

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
	 * Restricted to tasks on the site's AI-selected list, the synthetic ids the list adds itself, and the short-list
	 * backfill pool — so every rendered card (AI, synthetic, or filler) is skippable. Persisted separately from
	 * `launchpad_checklist_tasks_statuses` because several catalog tasks recompute completion live (memberships, woo,
	 * domains) and would ignore a status write; the skip set is overlaid on read instead.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array|WP_Error
	 */
	public function skip_task( $request ) {
		$task_id = $request['task_id'];

		$skippable = array_merge( wpcom_ai_launchpad_get_ai_task_ids(), self::SYNTHETIC_TASK_IDS, array_keys( $this->backfill_pool() ) );
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
	 * Read endpoint backing the client's availability-aware tailoring: the task ids that will render for the given
	 * goal. Fetched before the AI call (which the wizard prewarms), so the prompt offers only renderable tasks.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array
	 */
	public function get_available_tasks( $request ) {
		$ids = $this->available_task_ids( (string) $request['goal'] );
		return array(
			'available_task_ids'  => $ids['actionable'],
			'renderable_task_ids' => $ids['renderable'],
		);
	}

	/**
	 * The task ids that must not be offered to, or accepted from, the model for a given goal.
	 *
	 * The two maps read in opposite directions, and an unknown or empty goal matches neither: every
	 * GOAL_RESTRICTED_TASK_IDS entry is excluded (it never got the goal it requires), while every
	 * GOAL_EXCLUDED_TASK_IDS entry is allowed (it never hit the goal that excludes it).
	 *
	 * @param string $goal The selected goal.
	 * @return string[]
	 */
	public static function excluded_task_ids_for_goal( $goal ) {
		$excluded = array();

		foreach ( self::GOAL_RESTRICTED_TASK_IDS as $task_id => $required_goal ) {
			if ( $goal !== $required_goal ) {
				$excluded[] = $task_id;
			}
		}

		foreach ( self::GOAL_EXCLUDED_TASK_IDS as $task_id => $excluded_goal ) {
			if ( $goal === $excluded_goal ) {
				$excluded[] = $task_id;
			}
		}

		return $excluded;
	}

	/**
	 * The task ids that will actually render on this site for the given goal — the menu tailoring should choose from.
	 *
	 * Built by running the whole catalog through the real gate (visibility + force-visible overrides, and the sell
	 * goal's woo-preview mode), so a task the AI could pick but the site would drop is never offered. `actionable`
	 * additionally excludes tasks that are already complete — they leave nothing to do — except the launch tasks,
	 * which the output contract requires last even on a site that already launched. `renderable` keeps the completed
	 * ones: the client falls back to it when completion leaves too few actionable tasks to fill a valid list. The
	 * client intersects these with its own TASK_MENU. Computed once per wizard submit.
	 *
	 * The AI Launchpad's own tasks are appended separately, since they are not catalog entries and the catalog
	 * sweep cannot find them. They run their own gate on the way in: a registry definition may declare an
	 * `is_visible` callable, and one that fails it is withheld from both lists here exactly as a catalog task
	 * failing wpcom_launchpad_checklists()->is_visible() is. A definition without one is visible everywhere —
	 * the gallery's shape, since it asks nothing of the site.
	 *
	 * @param string $goal The inferred/selected goal.
	 * @return array{renderable: string[], actionable: string[]}
	 */
	private function available_task_ids( $goal ) {
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		// Sell keeps the commerce tasks as a disabled preview until WooCommerce is active, so they count as available.
		$disable_hidden_woo = 'sell' === $goal && ! is_plugin_active( 'woocommerce/woocommerce.php' );

		$tasks = $this->build_all_catalog_tasks( false, $disable_hidden_woo );

		$actionable = array_filter(
			$tasks,
			static function ( $task ) {
				return ! $task['completed'] || in_array( $task['id'], self::LAUNCH_TASK_IDS, true );
			}
		);

		$excluded = self::excluded_task_ids_for_goal( $goal );

		// The registry's tasks are not in the catalog, so the sweep above cannot see them. Offer every registry
		// task that this site can render and that is not already complete; a completed one still renders, so it
		// stays on the renderable list the client relaxes to.
		$registry_renderable = array_values(
			array_filter(
				AI_Launchpad_Task_Registry::task_ids(),
				static function ( $task_id ) {
					return AI_Launchpad_Task_Registry::is_visible( $task_id );
				}
			)
		);
		$registry_actionable = array_values(
			array_filter(
				$registry_renderable,
				static function ( $task_id ) {
					return ! AI_Launchpad_Task_Registry::is_complete( $task_id );
				}
			)
		);

		// array_unique guards a future registry id that shadows a catalog one: the endpoint would otherwise
		// advertise it twice.
		$renderable = array_unique( array_merge( array_column( $tasks, 'id' ), $registry_renderable ) );
		$actionable = array_unique( array_merge( array_column( $actionable, 'id' ), $registry_actionable ) );

		return array(
			'renderable' => array_values( array_diff( $renderable, $excluded ) ),
			'actionable' => array_values( array_diff( $actionable, $excluded ) ),
		);
	}

	/**
	 * Builds the enriched task list for every catalog task (backs `?all_tasks=1` when the gate is bypassed, and
	 * available_task_ids() when it is not).
	 *
	 * Each task is enriched in isolation so one that can't be built is skipped rather than breaking the whole view.
	 *
	 * @param bool $bypass_visibility  Whether to skip the catalog visibility gate (the testing view does).
	 * @param bool $disable_hidden_woo Whether hidden commerce tasks render as a disabled preview instead of dropping.
	 * @return array
	 */
	private function build_all_catalog_tasks( $bypass_visibility = true, $disable_hidden_woo = false ) {
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
					$bypass_visibility,
					null,
					$disable_hidden_woo
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

			// One card per id — the client keys cards by id. The remap above can collide with the target id already
			// being present (notably the ?all_tasks=1 view, which enumerates every catalog id), so collapse any
			// repeat to the first occurrence.
			if ( isset( $seen_ids[ $task['id'] ] ) ) {
				continue;
			}

			// Tasks the AI Launchpad owns are built from its own registry: the shared catalog does not
			// define them, and routing them through wpcom_launchpad_checklists() would mean relying on
			// the catalog accepting entries it never registered.
			if ( AI_Launchpad_Task_Registry::has( $task['id'] ) ) {
				// The registry's own visibility gate, filtered on read for the same reason as the catalog's
				// below: a persisted list outlives the site state it was tailored for, so a task whose
				// precondition has since gone must stop rendering rather than offer a CTA that leads nowhere.
				if ( ! $bypass_visibility && ! AI_Launchpad_Task_Registry::is_visible( $task['id'] ) ) {
					continue;
				}

				$card = AI_Launchpad_Task_Registry::build( $task['id'], (string) $task['subtitle'] );
				if ( null !== $card ) {
					$seen_ids[ $task['id'] ] = true;
					$built[]                 = $card;
				}
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
				// the AI's inferred category elsewhere) instead of plain themes.php. The legacy design_selected/
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
				$calypso_path = wpcom_ai_launchpad_to_simple_plugins_path( $calypso_path );
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
	 * The theme-showcase subject-category slugs (the `subject` taxonomy from /rest/v1.2/theme-filters).
	 * Every category carries free themes, unlike free-text search, which surfaces mostly paid results.
	 */
	const THEME_CATEGORIES = array(
		'blog',
		'portfolio',
		'business',
		'store',
		'art-design',
		'about',
		'real-estate',
		'health-wellness',
		'authors-writers',
		'newsletter',
		'education',
		'magazine',
		'music',
		'restaurant',
		'travel-lifestyle',
		'fashion-beauty',
		'community-non-profit',
		'podcast',
		'entertainment',
	);

	/**
	 * The wordpress.com themes-showcase path the theme-picker tasks should point at.
	 *
	 * Sell sites always land on the showcase's Store category so shop-ready templates lead; other goals get the
	 * showcase pre-filtered by the AI's inferred category, re-checked against the allowlist since the envelope is
	 * stored data. Without a valid category the plain showcase is returned (never null: the catalog CTA can resolve
	 * to wp-admin's themes.php, which skips the showcase). The client's `toNavigableUrl` resolves the relative path
	 * against wordpress.com.
	 *
	 * @param string $goal     The inferred goal.
	 * @param string $category The AI's inferred theme_category slug.
	 * @return string
	 */
	private function get_themes_showcase_path( $goal, $category ) {
		if ( 'sell' === $goal ) {
			$category = 'store';
		}

		if ( ! in_array( $category, self::THEME_CATEGORIES, true ) ) {
			return '/themes/' . rawurlencode( wpcom_get_site_slug() );
		}

		return '/themes/filter/' . $category . '/' . rawurlencode( wpcom_get_site_slug() );
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
			$calypso_path  = wpcom_ai_launchpad_to_simple_plugins_path( $wp_admin_path, 'woocommerce' );
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
	 * Inserts a task immediately before the trailing launch task (or appends it), idempotently by id.
	 *
	 * @param array $tasks The enriched task list.
	 * @param array $task  The task entry to insert.
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
