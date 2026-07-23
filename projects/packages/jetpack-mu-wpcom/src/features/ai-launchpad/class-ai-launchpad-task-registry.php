<?php
/**
 * Task definitions owned by the AI Launchpad rather than the shared launchpad catalog.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * The AI Launchpad's own task registry.
 *
 * Deliberately NOT merged into wpcom_launchpad_get_task_definitions(): that catalog is shared
 * with the legacy launchpad, and routing foreign definitions through
 * wpcom_launchpad_checklists() would depend on it accepting entries it never registered. These
 * tasks are built here instead, and available_task_ids() offers them to the model alongside the
 * catalog's, so an AI Launchpad task is selectable without the catalog knowing it exists.
 *
 * Each definition supplies the same fields build_tasks() resolves from the catalog. definitions()
 * is rebuilt on every call, including from has() and task_ids(), which is what decides the shape:
 *
 * - `is_complete`, `is_visible` and `draft_id` MUST stay callables. They inspect site state — an
 *   option, a WP_Query, an active plugin — so resolving them eagerly would put that work behind
 *   every id check.
 * - The string fields are callables only to match. Deferring __() keeps it off the has() path too,
 *   but a new entry that used plain translated strings there would be correct.
 */
class AI_Launchpad_Task_Registry {

	/**
	 * The registry.
	 *
	 * Keys are task ids. Each definition supports:
	 * - `title`             (callable) the card title.
	 * - `in_progress_title` (callable, optional) the title while a marker draft is unpublished.
	 * - `default_subtitle`  (callable) the subtitle used when the AI supplies none.
	 * - `is_complete`       (callable) whether the task is done.
	 * - `is_visible`        (callable, optional) whether this site can render the task at all; absent means
	 *                        always. This is the registry's equivalent of the catalog's visibility callback:
	 *                        a task whose precondition is missing must never be offered or rendered, since
	 *                        its CTA would lead nowhere. Omit it rather than returning a constant true, so a
	 *                        universally renderable task reads as one.
	 * - `calypso_path`      (callable, optional) the CTA destination, already resolved: an absolute admin URL,
	 *                        or the Calypso router path a Simple site needs for a screen wp-admin does not
	 *                        serve there. Omit it for a task whose CTA the client resolves itself, as the
	 *                        gallery does by creating its page.
	 * - `draft_id`          (callable, optional) the in-progress draft's post id, or null.
	 *
	 * @return array
	 */
	private static function definitions() {
		$definitions = array(

			/*
			 * The page is hand-authored markup — a heading, one AI-written line, and one empty core/gallery
			 * block — and no longer built from the WordPress.com pattern library. The library carries no
			 * topical tags at all, so the niche scoring that chose the pattern was dead: production logged
			 * `picked_score: 0, fallback: first_usable` on every event, and the pattern it always settled on
			 * shipped three photographs hotlinked from dotcompatterns.wordpress.com, with that site's own
			 * attachment ids on them. A gallery page whose whole purpose is the user's own work is the worst
			 * place on the menu to leave a stranger's photographs.
			 *
			 * No `is_visible`: core/gallery is a core block, so the task asks nothing of the site. No
			 * `calypso_path` either — the CTA creates the page client-side, as the other page tasks do.
			 */
			'add_gallery_page'    => array(
				'title'             => static function () {
					return __( 'Create your first gallery', 'jetpack-mu-wpcom' );
				},
				'in_progress_title' => static function () {
					return __( 'Continue working on your gallery', 'jetpack-mu-wpcom' );
				},
				'default_subtitle'  => static function () {
					return __( 'Show your work in a beautiful photo gallery.', 'jetpack-mu-wpcom' );
				},
				'is_complete'       => static function () {
					$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
					return ! empty( $statuses['add_gallery_page'] );
				},
				'draft_id'          => static function () {
					return AI_Launchpad_Gallery_Page_Listener::get_draft_id();
				},
			),

			/*
			 * The page is hand-authored markup — a heading, one AI-written line, and a Jetpack contact form —
			 * not a block pattern. The pattern library carries no topical tags, so niche scoring could never
			 * fire for a contact page, and the pattern it would settle on is map-only with a hardcoded address
			 * and phone number on it. A wrong address stated confidently on a real business's contact page is
			 * worse than none, so the form is the only channel the page offers.
			 *
			 * No `is_visible`: the form block ships with Jetpack, which is active on every site this feature
			 * runs on, so the task asks nothing of the site. No `calypso_path` either — the CTA creates the
			 * page client-side, as the gallery's does.
			 */
			'add_contact_page'    => array(
				'title'             => static function () {
					return __( 'Add a contact page', 'jetpack-mu-wpcom' );
				},
				'in_progress_title' => static function () {
					return __( 'Continue working on your contact page', 'jetpack-mu-wpcom' );
				},
				'default_subtitle'  => static function () {
					return __( 'Give visitors a simple way to reach you, with a contact form ready to go.', 'jetpack-mu-wpcom' );
				},
				'is_complete'       => static function () {
					$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
					return ! empty( $statuses['add_contact_page'] );
				},
				'draft_id'          => static function () {
					return AI_Launchpad_Contact_Page_Listener::get_draft_id();
				},
			),

			/*
			 * A scaffold, not a finished page: a heading, one AI-written line, and three blank event entries.
			 * There is no core or Jetpack events block to fill it with, and the pattern library's events
			 * patterns are fabricated tour listings whose every date falls in 2024-2025, so using one would
			 * publish a page of expired events on day one. Nobody but the user knows when their events are, so
			 * the page offers a visible blank instead of a plausible invention.
			 *
			 * No `is_visible`: the entries are core blocks, which every site has. No `calypso_path` either —
			 * the CTA creates the page client-side, as the contact page's does.
			 */
			'add_events_page'     => array(
				'title'             => static function () {
					return __( 'Add an events page', 'jetpack-mu-wpcom' );
				},
				'in_progress_title' => static function () {
					return __( 'Continue working on your events page', 'jetpack-mu-wpcom' );
				},
				'default_subtitle'  => static function () {
					return __( 'Give people one place to find out what is coming up and when.', 'jetpack-mu-wpcom' );
				},
				'is_complete'       => static function () {
					$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
					return ! empty( $statuses['add_events_page'] );
				},
				'draft_id'          => static function () {
					return AI_Launchpad_Events_Page_Listener::get_draft_id();
				},
			),

			/*
			 * A heading, one AI-written line, and a single empty core/video block. Deliberately core/video and
			 * not VideoPress: VideoPress is a plan-gated Jetpack module, so building the page on it would mean
			 * declaring `is_visible` and withholding the task from every site that has not bought the plan —
			 * and this is the only thing on the menu serving sites whose work is watched. core/video is on
			 * every site, needs no plugin or plan, and takes a URL as readily as an upload.
			 *
			 * Not a block pattern either, and here that is a rights problem rather than a taste one. The
			 * pattern library has no video category at all, and its only video-ish patterns each embed a
			 * specific real third-party YouTube video, which no rewrite pass would strip.
			 *
			 * No `calypso_path` — the CTA creates the page client-side, as the contact and events pages do.
			 */
			'add_video_page'      => array(
				'title'             => static function () {
					return __( 'Add a video page', 'jetpack-mu-wpcom' );
				},
				'in_progress_title' => static function () {
					return __( 'Continue working on your video page', 'jetpack-mu-wpcom' );
				},
				'default_subtitle'  => static function () {
					return __( 'Give your videos a home on your site, ready for you to upload the first one.', 'jetpack-mu-wpcom' );
				},
				'is_complete'       => static function () {
					$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
					return ! empty( $statuses['add_video_page'] );
				},
				'draft_id'          => static function () {
					return AI_Launchpad_Video_Page_Listener::get_draft_id();
				},
			),

			/*
			 * One project, written up on a page of its own: an empty image block for the work, and one blank
			 * line, prompted, for what it was, who it was for, and what the user did.
			 *
			 * Deliberately an ordinary page, and NOT Jetpack's `jetpack-portfolio` custom post type the proof
			 * of concept opened the editor on. That CPT is registered only where the `jetpack_portfolio`
			 * option is on or the theme declares support, and neither holds on a new site with a block theme —
			 * so gating this task on the CPT would hide it from precisely the sites it exists for, and not
			 * gating it would open an editor for a post type that does not exist. Turning the option on from
			 * the CTA was the third option and is worse than both: no route the client can reach writes it on
			 * Simple and Atomic alike, and it is a silent, site-wide structural change — a new admin menu, two
			 * taxonomies, an archive, a rewrite flush — bought by clicking a card that offered to add one page.
			 * A page needs none of that, and it is where the theme's own navigation puts it.
			 *
			 * No `default_subtitle` invention beyond the card: the page itself carries no AI-written copy at
			 * all, which is why this is the one page task with no `page_intros` key. The other five open with a
			 * line about the site; a project write-up is facts about one job only the user has.
			 *
			 * No `is_visible`: core/image and core/paragraph are on every site. No `calypso_path` either — the
			 * CTA creates the page client-side, as the other page tasks do.
			 */
			'add_portfolio_piece' => array(
				'title'             => static function () {
					return __( 'Add your first portfolio piece', 'jetpack-mu-wpcom' );
				},
				'in_progress_title' => static function () {
					return __( 'Continue working on your portfolio piece', 'jetpack-mu-wpcom' );
				},
				'default_subtitle'  => static function () {
					return __( 'Give one project a page of its own, with room for the work and the story behind it.', 'jetpack-mu-wpcom' );
				},
				'is_complete'       => static function () {
					$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
					return ! empty( $statuses['add_portfolio_piece'] );
				},
				'draft_id'          => static function () {
					return AI_Launchpad_Portfolio_Piece_Listener::get_draft_id();
				},
			),
			'add_site_icon'       => array(
				'title'            => static function () {
					return __( 'Add your logo or site icon', 'jetpack-mu-wpcom' );
				},
				'default_subtitle' => static function () {
					return __( 'Upload your logo so your site is recognizable in browser tabs and search results.', 'jetpack-mu-wpcom' );
				},
				// Read live from the option core writes, so no listener is needed and removing the icon
				// un-completes the task. Deliberately not has_site_icon(), which additionally resolves the
				// attachment's URL and so reports false for an icon whose attachment is not readable yet.
				'is_complete'      => static function () {
					return ! empty( get_option( 'site_icon' ) );
				},
				'calypso_path'     => static function () {
					return admin_url( 'options-general.php' );
				},
			),
			'pick_fonts_colors'   => array(
				'title'            => static function () {
					return __( 'Customize fonts and colors', 'jetpack-mu-wpcom' );
				},
				'default_subtitle' => static function () {
					return __( 'Try a style variation to set the mood of your whole site at once.', 'jetpack-mu-wpcom' );
				},
				// Applying a style variation fires nothing this context can watch, so the task is on the
				// complete-on-click allowlist and its completion arrives here through mark_complete().
				'is_complete'      => static function () {
					$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
					return ! empty( $statuses['pick_fonts_colors'] );
				},
				// The Styles screen belongs to the Site Editor, which only a block theme has; on a classic
				// theme the CTA would open an editor with no Styles route to land on.
				'is_visible'       => static function () {
					return wp_is_block_theme();
				},
				// `p` is the query arg the Site Editor mounts its router on (`path` is the pre-6.8 spelling
				// and now only survives as a redirect), and `section` is the Styles screen's own sub-route,
				// which is what opens the variations browser rather than the Styles root.
				'calypso_path'     => static function () {
					return admin_url( 'site-editor.php?p=/styles&section=/variations' );
				},
			),

			/*
			 * Plugin discovery: recommend a plugin only a particular kind of site wants, so that the pick is
			 * itself the personalization — the model reaching for Sensei is the model saying "this site
			 * teaches courses". A plugin every site would benefit from carries no such signal and would just
			 * spend one of six slots.
			 *
			 * Only Automattic's own plugins belong here. This is an official Automattic surface, so it does
			 * not send people to third-party products, however well those would fit a niche. That rules out
			 * the obvious SEO, page-builder and events candidates and is why Sensei is currently alone; a
			 * niche with no first-party plugin behind it wants a hand-authored task instead, the way
			 * `add_gallery_page` covers visual sites.
			 *
			 * No `is_visible`: an already-active plugin makes the task *complete*, not hidden. Completion is
			 * what lets the card tick when the user acts on the recommendation, and the completion diff on
			 * read is the only signal that says whether the recommendation landed. Withholding it from a site
			 * that already has the plugin comes free anyway — available_task_ids() drops every complete task
			 * from the actionable menu.
			 */
			'install_sensei_lms'  => array(
				'title'            => static function () {
					return __( 'Build your courses with Sensei LMS', 'jetpack-mu-wpcom' );
				},
				'default_subtitle' => static function () {
					return __( 'Install Sensei to turn what you teach into structured lessons, quizzes, and student progress.', 'jetpack-mu-wpcom' );
				},
				'is_complete'      => static function () {
					return self::plugin_active( 'sensei-lms/sensei-lms.php' );
				},
				'calypso_path'     => static function () {
					return self::plugin_install_path( 'sensei-lms' );
				},
			),
		);

		/**
		 * Filters the AI Launchpad's own task definitions.
		 *
		 * The registry is otherwise closed, and this is the only seam through which it can hold more than
		 * its shipped entries — which is what makes it testable with a second definition at all. Callbacks
		 * must be cheap: this map is rebuilt on every has() / task_ids() / is_complete() / is_visible() call.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $definitions Task definitions keyed by task id. See the docblock above for the shape.
		 */
		return apply_filters( 'wpcom_ai_launchpad_task_registry_definitions', $definitions );
	}

	/**
	 * Whether a plugin is active, from anywhere the registry's definitions are resolved.
	 *
	 * `is_plugin_active()` lives in an admin include that is not loaded during a REST request. Every REST
	 * caller of this registry already loads it before asking (get_current_tasks(), available_task_ids() and
	 * build_tasks() each require it), so this guard is for the callers that do not: the completion-check
	 * route, anything reached through the definitions filter, and the tests.
	 *
	 * @param string $plugin_file The plugin's `directory/file.php` entry.
	 * @return bool
	 */
	private static function plugin_active( $plugin_file ) {
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		return is_plugin_active( $plugin_file );
	}

	/**
	 * The CTA for installing a plugin from the WordPress.org directory.
	 *
	 * `tab=plugin-information` opens that one plugin's install screen directly, so the destination does not
	 * depend on how the directory's search happens to rank the slug that day.
	 *
	 * Run through the Simple rewrite here rather than in build_tasks(), which returns before the point where
	 * it rewrites catalog CTAs: Simple sites cannot reach either wp-admin plugins screen, and the slug the
	 * Calypso deep link needs is known here and nowhere else.
	 *
	 * @param string $plugin_slug The plugin's WordPress.org slug.
	 * @return string
	 */
	private static function plugin_install_path( $plugin_slug ) {
		return wpcom_ai_launchpad_to_simple_plugins_path(
			admin_url( 'plugin-install.php?tab=plugin-information&plugin=' . rawurlencode( $plugin_slug ) ),
			$plugin_slug
		);
	}

	/**
	 * The ids this registry defines.
	 *
	 * @return string[]
	 */
	public static function task_ids() {
		return array_keys( self::definitions() );
	}

	/**
	 * Whether this registry owns the given task id.
	 *
	 * @param string $task_id The task id.
	 * @return bool
	 */
	public static function has( $task_id ) {
		return isset( self::definitions()[ $task_id ] );
	}

	/**
	 * Whether a registry task is already complete. False for an unknown id.
	 *
	 * Separate from build() so a caller that only needs the flag — available_task_ids(), which runs on every
	 * wizard prewarm — pays for the completion check alone. build() additionally resolves the in-progress draft,
	 * a WP_Query whose result that caller would throw away.
	 *
	 * @param string $task_id The task id.
	 * @return bool
	 */
	public static function is_complete( $task_id ) {
		$definition = self::definitions()[ $task_id ] ?? null;
		return null !== $definition && (bool) $definition['is_complete']();
	}

	/**
	 * Marks a registry task complete. No-ops (and reports false) for an id the registry does not own.
	 *
	 * The shared status option is written directly because wpcom_mark_launchpad_task_complete() cannot do it:
	 * wpcom_launchpad_update_task_status() resolves the id against wpcom_launchpad_get_task_definitions() and
	 * silently skips anything absent from it — which is every registry id, by construction. Routing the
	 * complete-on-click endpoint through that helper would answer 200 and write nothing.
	 *
	 * Only reaches tasks whose `is_complete` reads that option. One computing completion from live site state
	 * (`add_site_icon`) ignores the write entirely, which is why a registry task on the complete-on-click
	 * allowlist has to define its completion against this option.
	 *
	 * @param string $task_id The task id.
	 * @return bool Whether the task was marked complete.
	 */
	public static function mark_complete( $task_id ) {
		if ( ! self::has( $task_id ) ) {
			return false;
		}

		$statuses             = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		$statuses[ $task_id ] = true;
		update_option( 'launchpad_checklist_tasks_statuses', $statuses );

		return true;
	}

	/**
	 * Whether this site can render a registry task at all. False for an unknown id.
	 *
	 * `is_visible` is optional, so a definition without one is visible everywhere — the shape the gallery
	 * relies on. Same rationale as is_complete() for living outside build(): available_task_ids() needs the
	 * flag alone, on every wizard prewarm.
	 *
	 * @param string $task_id The task id.
	 * @return bool
	 */
	public static function is_visible( $task_id ) {
		$definition = self::definitions()[ $task_id ] ?? null;
		if ( null === $definition ) {
			return false;
		}

		return ! isset( $definition['is_visible'] ) || (bool) $definition['is_visible']();
	}

	/**
	 * Builds a registry task into the card shape build_tasks() emits, or null for an unknown id.
	 *
	 * An unpublished marker draft puts the task in progress: the card reopens that draft and takes
	 * the in-progress title, matching how build_tasks() treats catalog site-editor tasks.
	 *
	 * Visibility is deliberately not checked here, mirroring the catalog: the gate belongs to the callers
	 * that decide whether a task surfaces, since build_tasks() has to be able to bypass it for the
	 * `?all_tasks=1` testing view.
	 *
	 * @param string $task_id  The task id.
	 * @param string $subtitle The AI-written subtitle; falls back to the registry default when empty.
	 * @return array|null
	 */
	public static function build( $task_id, $subtitle ) {
		$definition = self::definitions()[ $task_id ] ?? null;
		if ( null === $definition ) {
			return null;
		}

		// Via the accessor, not the callable, so the card and the availability menu can never disagree.
		$completed = self::is_complete( $task_id );

		// Resolved regardless of completion, matching build_tasks(): a done card still links to where it was
		// done, so the user can go back and change the icon or try another variation.
		$calypso_path = isset( $definition['calypso_path'] ) ? $definition['calypso_path']() : null;

		$in_progress = false;
		if ( ! $completed && isset( $definition['draft_id'] ) ) {
			$draft_id = $definition['draft_id']();
			if ( null !== $draft_id ) {
				$in_progress  = true;
				$calypso_path = admin_url( 'post.php?post=' . $draft_id . '&action=edit' );
			}
		}

		$title = $in_progress && isset( $definition['in_progress_title'] )
			? $definition['in_progress_title']()
			: $definition['title']();

		return array(
			'id'           => $task_id,
			'subtitle'     => '' !== $subtitle ? $subtitle : $definition['default_subtitle'](),
			'title'        => $title,
			'completed'    => $completed,
			'in_progress'  => $in_progress,
			'disabled'     => false,
			'calypso_path' => $calypso_path,
		);
	}
}
