<?php
/**
 * AI Launchpad companion prototypes (DSGCOM-760): keep Site Setup reachable across surfaces.
 *
 * Five explorations of "back and forth between tasks", selectable per site through the
 * `wpcom_ai_launchpad_companion_variant` option:
 *
 *   1. Floating tasklist: a collapsible progress card in the block editor (fullscreen mode kept on).
 *   2. Admin bar item: "Site Setup (n/6)" with a mini progress bar and a hover popover, on every screen.
 *   3. Sidebar-top module: a Wix-style progress module above the admin menu, with a next-step flyout
 *      and a completion toast (fullscreen mode kept off so the chrome stays during editing).
 *   4. Sidebar-bottom widget: a Chatbase-style progress widget pinned under the admin menu, replacing
 *      the Site Setup menu item (fullscreen mode kept off).
 *   5. Completion snackbar: the stock editor snackbar on publish, with a "Continue setup" action.
 *
 * Demo plumbing, cap-gated to `manage_options` (mirrors AI_Launchpad_Dev_Enable's no-nonce approach):
 *   ?ai-launchpad-variant=N     Switch the active variant (0 turns the companion off).
 *   ?ai-launchpad-demo-reset=1  Trash the demo first post and clear its task status so the flow replays.
 *
 * Prototype code: not meant to ship as-is.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Registers the companion surfaces for the active prototype variant.
 */
class AI_Launchpad_Companion {

	/**
	 * The per-site variant option: 0 (off) to 5. The option existing at all marks a demo site,
	 * which is what makes the variant switcher render.
	 */
	const OPTION_VARIANT = 'wpcom_ai_launchpad_companion_variant';

	const VARIANT_FLOATING_CARD  = 1;
	const VARIANT_ADMIN_BAR      = 2;
	const VARIANT_SIDEBAR_TOP    = 3;
	const VARIANT_SIDEBAR_BOTTOM = 4;
	const VARIANT_SNACKBAR       = 5;

	/**
	 * Register the companion hooks.
	 *
	 * @return void
	 */
	public static function register() {
		// Before AI_Launchpad_Dev_Enable's own admin_menu handler so both can act on one URL.
		add_action( 'admin_menu', array( __CLASS__, 'maybe_handle_request' ), 9 );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_assets' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_assets' ) );
		add_action( 'admin_bar_menu', array( __CLASS__, 'add_admin_bar_item' ), 500 );
		add_filter( 'admin_body_class', array( __CLASS__, 'filter_admin_body_class' ) );
		// The admin bar variant renders on the front end too; it only needs the stylesheet there.
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_front_assets' ) );
		// After the catalog's own publish listener, as a demo-reliability net (see the method docblock).
		add_action( 'publish_post', array( __CLASS__, 'ensure_first_post_completion' ), 20 );
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_route' ) );
	}

	/**
	 * A companion-owned completion route the editor bundle calls after a publish when the
	 * first-post task still reads incomplete (second half of the demo-reliability net; on one
	 * test site the publish-time listeners never landed the status write in the save request).
	 *
	 * @return void
	 */
	public static function register_rest_route() {
		register_rest_route(
			'wpcom/v2',
			'/ai-launchpad-companion/complete-first-post',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_complete_first_post' ),
				'permission_callback' => static function () {
					return current_user_can( 'manage_options' ) && false !== get_option( self::OPTION_VARIANT, false );
				},
			)
		);
	}

	/**
	 * Marks the first-post task complete when a published AI-created first post (marker meta)
	 * exists, mirroring what the catalog's publish listener would have written.
	 *
	 * @return array{completed: bool}
	 */
	public static function handle_complete_first_post() {
		$published_marker_posts = get_posts(
			array(
				'post_type'        => 'post',
				'post_status'      => 'publish',
				'posts_per_page'   => 1,
				'fields'           => 'ids',
				'no_found_rows'    => true,
				'suppress_filters' => false,
				'meta_key'         => AI_Launchpad_First_Post_Listener::META_KEY, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- demo-only route, cap-gated.
			)
		);

		if ( empty( $published_marker_posts ) ) {
			return array( 'completed' => false );
		}

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		if ( empty( $statuses['first_post_published'] ) ) {
			$statuses['first_post_published'] = true;
			update_option( 'launchpad_checklist_tasks_statuses', $statuses );
		}

		return array( 'completed' => true );
	}

	/**
	 * Demo-reliability net for the write-post round trip: when an AI-created first post (marker
	 * meta) is published on a demo site and the catalog's own publish listener did not record the
	 * completion (observed on a site with prior launchpad state; the same build completes fine on
	 * a fresh site), write the status so the demo flow always advances. No-op when the catalog
	 * listener already did its job.
	 *
	 * @param int $post_id The published post ID.
	 * @return void
	 */
	public static function ensure_first_post_completion( $post_id ) {
		if ( ! self::is_active() ) {
			return;
		}

		if ( ! get_post_meta( $post_id, AI_Launchpad_First_Post_Listener::META_KEY, true ) ) {
			return;
		}

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		if ( ! empty( $statuses['first_post_published'] ) ) {
			return;
		}

		// Prefer the catalog's own write path so tracking and id mapping still apply.
		if ( function_exists( 'wpcom_mark_launchpad_task_complete' ) ) {
			wpcom_mark_launchpad_task_complete( 'first_post_published' );
		}

		// Last resort: the direct option write the option-based completion check reads.
		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		if ( empty( $statuses['first_post_published'] ) ) {
			$statuses['first_post_published'] = true;
			update_option( 'launchpad_checklist_tasks_statuses', $statuses );
		}
	}

	/**
	 * The active variant number, 0 (off) to 5.
	 *
	 * @return int
	 */
	public static function get_variant() {
		$variant = (int) get_option( self::OPTION_VARIANT, 0 );

		return ( $variant >= 1 && $variant <= 5 ) ? $variant : 0;
	}

	/**
	 * Whether this site is a companion demo site: the variant option exists (any value)
	 * and the current user is an admin. Gates the switcher and all asset loading.
	 *
	 * @return bool
	 */
	private static function is_demo_site() {
		return false !== get_option( self::OPTION_VARIANT, false ) && current_user_can( 'manage_options' );
	}

	/**
	 * Whether the companion widgets should render: a variant is on, the AI Launchpad is
	 * eligible and not yet completed, and there is a tailored task list to summarize.
	 *
	 * @return bool
	 */
	private static function is_active() {
		if ( self::get_variant() < 1 || ! self::is_demo_site() ) {
			return false;
		}

		if ( ! class_exists( 'Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad' )
			|| ! \Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad::is_eligible() ) {
			return false;
		}

		if ( get_option( AI_Launchpad_REST::OPTION_COMPLETED ) ) {
			return false;
		}

		$summary = self::get_tasks_summary();

		return ! empty( $summary['tasks'] );
	}

	/**
	 * Acts on the variant / demo-reset query params, then redirects to the launchpad page
	 * so a refresh does not re-fire the action. Mirrors AI_Launchpad_Dev_Enable::handle().
	 *
	 * @return void
	 */
	public static function maybe_handle_request() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Intentional no-nonce demo toggle, cap-gated below; mirrors AI_Launchpad_Dev_Enable.
		$has_variant = isset( $_GET['ai-launchpad-variant'] );
		$has_reset   = isset( $_GET['ai-launchpad-demo-reset'] );

		if ( ! $has_variant && ! $has_reset ) {
			return;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( $has_variant ) {
			$variant = (int) sanitize_text_field( wp_unslash( $_GET['ai-launchpad-variant'] ) );
			if ( $variant >= 0 && $variant <= 5 ) {
				update_option( self::OPTION_VARIANT, $variant );
			}
		}

		if ( $has_reset ) {
			self::reset_demo_flow();
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		wp_safe_redirect( self::get_launchpad_url() );
		exit;
	}

	/**
	 * Rewinds the demo flow: trashes every post carrying the first-post marker meta (draft or
	 * published) and clears the first-post task status, so "Write your first post" is to-do again.
	 * Also clears the completed latch. Skips are left alone on purpose: they are part of the
	 * seeded demo state (the tasks "done" before the flow starts).
	 *
	 * @return void
	 */
	private static function reset_demo_flow() {
		$ids = get_posts(
			array(
				'post_type'        => 'post',
				'post_status'      => 'any',
				'posts_per_page'   => -1,
				'fields'           => 'ids',
				'no_found_rows'    => true,
				'suppress_filters' => false,
				'meta_key'         => AI_Launchpad_First_Post_Listener::META_KEY, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- demo-only reset, cap-gated.
			)
		);

		foreach ( $ids as $id ) {
			wp_trash_post( $id );
		}

		$statuses = (array) get_option( 'launchpad_checklist_tasks_statuses', array() );
		unset( $statuses['first_post_published'], $statuses['first_post_published_newsletter'] );
		update_option( 'launchpad_checklist_tasks_statuses', $statuses );

		delete_option( AI_Launchpad_REST::OPTION_COMPLETED );
	}

	/**
	 * The AI Launchpad page URL.
	 *
	 * @return string
	 */
	private static function get_launchpad_url() {
		return admin_url( 'admin.php?page=' . \Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad::MENU_SLUG );
	}

	/**
	 * The tailored task list reduced to what the widgets render, memoized per request
	 * (get_current_tasks rebuilds the catalog on every call).
	 *
	 * @return array{tasks: array, done: int, total: int, next: array|null}
	 */
	private static function get_tasks_summary() {
		static $summary = null;

		if ( null !== $summary ) {
			return $summary;
		}

		$summary = array(
			'tasks' => array(),
			'done'  => 0,
			'total' => 0,
			'next'  => null,
		);

		if ( ! class_exists( 'AI_Launchpad_REST' ) ) {
			return $summary;
		}

		$rest  = new AI_Launchpad_REST();
		$tasks = $rest->get_current_tasks();

		foreach ( $tasks as $task ) {
			$light = array(
				'id'         => $task['id'],
				'title'      => $task['title'],
				'completed'  => (bool) $task['completed'],
				'inProgress' => (bool) $task['in_progress'],
				'disabled'   => (bool) $task['disabled'],
			);

			$summary['tasks'][] = $light;
			++$summary['total'];

			if ( $task['completed'] ) {
				++$summary['done'];
			} elseif ( null === $summary['next'] && ! $task['disabled'] ) {
				$summary['next'] = array(
					'id'       => $task['id'],
					'title'    => $task['title'],
					'subtitle' => $task['subtitle'],
					'ctaLabel' => self::get_cta_label( $task['id'], (bool) $task['in_progress'] ),
					'ctaUrl'   => self::to_navigable_url( $task['calypso_path'] ),
				);
			}
		}

		return $summary;
	}

	/**
	 * The next-task CTA label, mirroring getCtaLabel() in tailored-list/task-card.tsx
	 * for the ids the widgets are likely to surface.
	 *
	 * @param string $task_id     The catalog task id.
	 * @param bool   $in_progress Whether the task has a saved-but-unpublished draft.
	 * @return string
	 */
	private static function get_cta_label( $task_id, $in_progress ) {
		if ( $in_progress ) {
			return __( 'Continue', 'jetpack-mu-wpcom' );
		}

		switch ( $task_id ) {
			case 'first_post_published':
			case 'first_post_published_newsletter':
				return __( 'Write post', 'jetpack-mu-wpcom' );
			case 'site_theme_selected':
				return __( 'Browse themes', 'jetpack-mu-wpcom' );
			case 'connect_social_media':
				return __( 'Connect socials', 'jetpack-mu-wpcom' );
			case 'add_about_page':
			case 'add_gallery_page':
			case 'add_new_page':
				return __( 'Add page', 'jetpack-mu-wpcom' );
			case 'site_launched':
			case 'blog_launched':
			case 'link_in_bio_launched':
			case 'videopress_launched':
				return __( 'Launch site', 'jetpack-mu-wpcom' );
			default:
				return __( 'Get started', 'jetpack-mu-wpcom' );
		}
	}

	/**
	 * Make a catalog CTA path navigable from wp-admin, mirroring toNavigableUrl() in
	 * tailored-list/model.ts: wp-admin paths resolve against this site, Calypso router
	 * paths pin to wordpress.com, absolute URLs pass through. Null paths return ''.
	 *
	 * @param string|null $path The catalog calypso_path.
	 * @return string
	 */
	private static function to_navigable_url( $path ) {
		if ( ! is_string( $path ) || '' === $path ) {
			return '';
		}

		if ( preg_match( '#^/wp-admin(/|\?|\#|$)#', $path ) ) {
			return site_url( $path );
		}

		if ( '/' === $path[0] ) {
			return 'https://wordpress.com' . $path;
		}

		return $path;
	}

	/**
	 * The launchpad heading for the wizard goal, mirroring headingForGoal() in
	 * tailored-list/layout.tsx (same strings, same textdomain).
	 *
	 * @return string
	 */
	private static function get_heading() {
		$wizard = get_option( AI_Launchpad_REST::OPTION_WIZARD );
		$goal   = is_array( $wizard ) && isset( $wizard['goal'] ) && is_string( $wizard['goal'] ) ? $wizard['goal'] : '';

		if ( '' === $goal ) {
			$ai_output = get_option( AI_Launchpad_REST::OPTION_AI_OUTPUT );
			if ( is_array( $ai_output ) && isset( $ai_output['payload']['inferred']['goal'] ) && is_string( $ai_output['payload']['inferred']['goal'] ) ) {
				$goal = $ai_output['payload']['inferred']['goal'];
			}
		}

		switch ( $goal ) {
			case 'write':
				return __( "Let's get your blog ready to launch", 'jetpack-mu-wpcom' );
			case 'sell':
				return __( "Let's get your store ready to launch", 'jetpack-mu-wpcom' );
			case 'newsletter':
				return __( "Let's get your newsletter ready to launch", 'jetpack-mu-wpcom' );
			case 'portfolio':
				return __( "Let's get your portfolio ready to launch", 'jetpack-mu-wpcom' );
			default:
				return __( "Let's get your site ready to launch", 'jetpack-mu-wpcom' );
		}
	}

	/**
	 * The initial-state payload both companion bundles read from `window.aiLaunchpadCompanion`.
	 *
	 * @return array
	 */
	private static function get_js_data() {
		$summary = self::get_tasks_summary();

		return array(
			'variant'      => self::get_variant(),
			'active'       => self::is_active(),
			'heading'      => self::get_heading(),
			'tasks'        => $summary['tasks'],
			'done'         => $summary['done'],
			'total'        => $summary['total'],
			'next'         => $summary['next'],
			'urls'         => array(
				'launchpad' => self::get_launchpad_url(),
				'reset'     => add_query_arg( 'ai-launchpad-demo-reset', '1', self::get_launchpad_url() ),
				'variant'   => add_query_arg( 'ai-launchpad-variant', '%d', self::get_launchpad_url() ),
			),
			'showSwitcher' => self::is_demo_site(),
		);
	}

	/**
	 * Prepend the shared initial-state global to a companion script handle.
	 *
	 * @param string $handle The registered script handle.
	 * @return void
	 */
	private static function add_initial_state( $handle ) {
		wp_add_inline_script(
			$handle,
			'window.aiLaunchpadCompanion = ' . wp_json_encode( self::get_js_data(), JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ';',
			'before'
		);
	}

	/**
	 * Enqueue the admin-chrome bundle (switcher + sidebar widgets + admin bar styling)
	 * on every wp-admin screen of a demo site.
	 *
	 * @return void
	 */
	public static function enqueue_admin_assets() {
		if ( ! self::is_demo_site() ) {
			return;
		}

		jetpack_mu_wpcom_enqueue_assets( 'ai-launchpad-companion-admin', array( 'js', 'css' ) );
		self::add_initial_state( 'jetpack-mu-wpcom-ai-launchpad-companion-admin' );
	}

	/**
	 * Enqueue the editor bundle (floating card, snackbar, publish detection, fullscreen
	 * preference) in the post editor only.
	 *
	 * @return void
	 */
	public static function enqueue_editor_assets() {
		if ( ! self::is_active() ) {
			return;
		}

		// Post editor only: the site editor and widget editor have no task flow to return from.
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( $screen && 'post' !== $screen->base ) {
			return;
		}

		jetpack_mu_wpcom_enqueue_assets( 'ai-launchpad-companion-editor', array( 'js', 'css' ) );
		self::add_initial_state( 'jetpack-mu-wpcom-ai-launchpad-companion-editor' );
	}

	/**
	 * Enqueue the admin-chrome stylesheet on the front end when the admin bar variant
	 * is active and the bar is showing (the item itself is server-rendered).
	 *
	 * @return void
	 */
	public static function enqueue_front_assets() {
		if ( self::VARIANT_ADMIN_BAR !== self::get_variant() || ! is_admin_bar_showing() || ! self::is_active() ) {
			return;
		}

		jetpack_mu_wpcom_enqueue_assets( 'ai-launchpad-companion-admin', array( 'css' ) );
	}

	/**
	 * Variant 2: the "Site Setup (n/6)" admin bar item with a mini progress bar, and a
	 * hover popover (a child node, so the admin bar's own hover handling shows it).
	 *
	 * @param WP_Admin_Bar $wp_admin_bar The admin bar instance.
	 * @return void
	 */
	public static function add_admin_bar_item( $wp_admin_bar ) {
		if ( self::VARIANT_ADMIN_BAR !== self::get_variant() || ! self::is_active() ) {
			return;
		}

		$data = self::get_js_data();

		$wp_admin_bar->add_node(
			array(
				'id'     => 'ai-launchpad-companion',
				'parent' => 'top-secondary',
				'title'  => self::render_admin_bar_title( $data ),
				'href'   => $data['urls']['launchpad'],
				'meta'   => array( 'class' => 'ai-lpc-ab' ),
			)
		);

		$wp_admin_bar->add_node(
			array(
				'id'     => 'ai-launchpad-companion-popover',
				'parent' => 'ai-launchpad-companion',
				'title'  => self::render_popover_html( $data ),
				'meta'   => array( 'class' => 'ai-lpc-ab-popover-item' ),
			)
		);
	}

	/**
	 * The admin bar item's inner HTML: mini progress bar + "Site Setup (n/6)" label.
	 *
	 * @param array $data The initial-state payload.
	 * @return string
	 */
	private static function render_admin_bar_title( $data ) {
		$pct   = $data['total'] > 0 ? round( $data['done'] / $data['total'] * 100 ) : 0;
		$label = sprintf(
			/* translators: 1: number of completed tasks, 2: total number of tasks. */
			__( 'Site Setup (%1$d/%2$d)', 'jetpack-mu-wpcom' ),
			$data['done'],
			$data['total']
		);

		return '<span class="ai-lpc-ab-progress"><span class="ai-lpc-ab-progress-fill" style="width:' . (int) $pct . '%"></span></span>'
			. '<span class="ai-lpc-ab-label">' . esc_html( $label ) . '</span>';
	}

	/**
	 * The hover popover: heading, progress bar, mini task list, "Continue setup" CTA.
	 *
	 * @param array $data The initial-state payload.
	 * @return string
	 */
	private static function render_popover_html( $data ) {
		$pct        = $data['total'] > 0 ? round( $data['done'] / $data['total'] * 100 ) : 0;
		$count_line = sprintf(
			/* translators: 1: number of completed tasks, 2: total number of tasks. */
			__( '%1$d of %2$d completed', 'jetpack-mu-wpcom' ),
			$data['done'],
			$data['total']
		);

		// The same glyphs the tailored list uses: "published" for done, "border" for to-do (@wordpress/icons).
		$check  = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm-1.4 12.9-3.1-3.2 1-1 2.1 2.1 4.9-4.9 1 1-5.9 6z"></path></svg>';
		$circle = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="m6.6 15.6-1.2.8c.6.9 1.3 1.6 2.2 2.2l.8-1.2c-.7-.5-1.3-1.1-1.8-1.8zM5.5 12c0-.4 0-.9.1-1.3l-1.5-.3c0 .5-.1 1.1-.1 1.6s.1 1.1.2 1.6l1.5-.3c-.2-.4-.2-.9-.2-1.3zm11.9-3.6 1.2-.8c-.6-.9-1.3-1.6-2.2-2.2l-.8 1.2c.7.5 1.3 1.1 1.8 1.8zM5.3 7.6l1.2.8c.5-.7 1.1-1.3 1.8-1.8l-.7-1.3c-.9.6-1.7 1.4-2.3 2.3zm14.5 2.8-1.5.3c.1.4.1.8.1 1.3s0 .9-.1 1.3l1.5.3c.1-.5.2-1 .2-1.6s-.1-1.1-.2-1.6zM12 18.5c-.4 0-.9 0-1.3-.1l-.3 1.5c.5.1 1 .2 1.6.2s1.1-.1 1.6-.2l-.3-1.5c-.4.1-.9.1-1.3.1zm3.6-1.1.8 1.2c.9-.6 1.6-1.3 2.2-2.2l-1.2-.8c-.5.7-1.1 1.3-1.8 1.8zM10.4 4.2l.3 1.5c.4-.1.8-.1 1.3-.1s.9 0 1.3.1l.3-1.5c-.5-.1-1.1-.2-1.6-.2s-1.1.1-1.6.2z"></path></svg>';

		$next_id = isset( $data['next']['id'] ) ? $data['next']['id'] : '';
		$rows    = '';
		foreach ( $data['tasks'] as $task ) {
			$classes = 'ai-lpc-mini-task';
			if ( $task['completed'] ) {
				$classes .= ' is-done';
			} elseif ( $task['id'] === $next_id ) {
				$classes .= ' is-next';
			}
			$rows .= '<span class="' . esc_attr( $classes ) . '">'
				. '<span class="ai-lpc-mini-icon">' . ( $task['completed'] ? $check : $circle ) . '</span>'
				. '<span class="ai-lpc-mini-label">' . esc_html( $task['title'] ) . '</span>'
				. '</span>';
		}

		return '<span class="ai-lpc-popover">'
			. '<span class="ai-lpc-popover-head">'
			. '<strong>' . esc_html( $data['heading'] ) . '</strong>'
			. '<span class="ai-lpc-popover-count">' . esc_html( $count_line ) . '</span>'
			. '</span>'
			. '<span class="ai-lpc-popover-bar"><span class="ai-lpc-popover-bar-fill" style="width:' . (int) $pct . '%"></span></span>'
			. '<span class="ai-lpc-mini-tasks">' . $rows . '</span>'
			. '<span class="ai-lpc-popover-footer">'
			. '<a class="ai-lpc-button" href="' . esc_url( $data['urls']['launchpad'] ) . '">' . esc_html__( 'Continue setup', 'jetpack-mu-wpcom' ) . '</a>'
			. '</span>'
			. '</span>';
	}

	/**
	 * Adds `ai-lpc-variant-N` to the admin body classes so variant-scoped CSS can hook in
	 * (variant 4 hides the Site Setup menu item; the widgets scope their own rules).
	 *
	 * @param string $classes Space-separated body classes.
	 * @return string
	 */
	public static function filter_admin_body_class( $classes ) {
		if ( self::is_active() ) {
			$classes .= ' ai-lpc-variant-' . self::get_variant();
		}

		return $classes;
	}
}

AI_Launchpad_Companion::register();
