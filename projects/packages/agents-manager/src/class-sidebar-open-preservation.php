<?php
/**
 * Sidebar Open Preservation file.
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

/**
 * Preserves the Agents Manager sidebar-open body classes across full wp-admin
 * navigations so the next page load can pre-apply them server-side (avoiding a
 * flicker before the React app boots).
 *
 * The open state comes from Open_State_Store's cache, and the pre-render only
 * runs when the Agents Manager app is actually loading on this request — so the
 * pre-rendered shell is always reconciled by the app that mounts to manage it,
 * never left orphaned.
 *
 * The server can know the persisted "open && docked" preference, but not the
 * live viewport — and the docked layout only fits above a width breakpoint and
 * when the admin menu fits vertically. Width is handled in CSS (a static media
 * query). Height cannot be: the threshold is the *measured* #adminmenu height,
 * which varies per page. So a tiny synchronous viewport-height gate is printed on
 * `in_admin_header` (which fires after #adminmenu is in the DOM, before the
 * content paints) to re-evaluate the real dock gate and strip the pre-rendered
 * classes when the chat will actually float — pre-paint, so there is no flash.
 */
class Sidebar_Open_Preservation {
	/**
	 * Class instance.
	 *
	 * @var Sidebar_Open_Preservation
	 */
	private static $instance;

	/**
	 * Body class marking the docked sidebar shell.
	 *
	 * @var string
	 */
	private const SIDEBAR_CONTAINER_CLASS = 'agents-manager-sidebar-container';

	/**
	 * Body class marking the sidebar as open.
	 *
	 * @var string
	 */
	private const SIDEBAR_OPEN_CLASS = 'agents-manager-sidebar-container--sidebar-open';

	/**
	 * Creates instance.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
	}

	/**
	 * Sidebar_Open_Preservation constructor.
	 */
	public function __construct() {
		// Run last so our class sits at the end of the `admin_body_class` list. Otherwise
		// a later filter could append its class without a leading space and glue it onto
		// ours, breaking the CSS selector that pre-opens the sidebar.
		add_filter( 'admin_body_class', array( $this, 'add_preopen_body_classes' ), PHP_INT_MAX );

		// Reconcile the pre-rendered shell against the live viewport before the
		// page content paints. `in_admin_header` fires after #adminmenu is in the
		// DOM, so the script can measure it the same way the React app does.
		add_action( 'in_admin_header', array( $this, 'print_sidebar_docking_viewport_height_gate_script' ) );
	}

	/**
	 * Inject pre-open assistant classes in initial admin body markup.
	 *
	 * @param string $classes Existing admin body classes.
	 * @return string
	 */
	public function add_preopen_body_classes( string $classes ): string {
		if ( ! $this->should_pre_render_docked_shell() ) {
			return $classes;
		}

		$body_classes_with_sidebar_classes = implode(
			' ',
			array_filter(
				array(
					$classes,
					self::SIDEBAR_CONTAINER_CLASS,
					self::SIDEBAR_OPEN_CLASS,
				)
			)
		);

		return ' ' . $body_classes_with_sidebar_classes . ' ';
	}

	/**
	 * Print the synchronous minimum-height-for-docking reconciliation script.
	 *
	 * Only emitted when the docked shell was pre-rendered. The one dock gate that
	 * needs a live measurement is height: the docked layout pins the admin menu to
	 * the viewport, and a menu taller than the room below the admin bar would be
	 * clipped, so the chat floats instead. That threshold is dynamic, so it can't
	 * be a CSS media query. The script measures it before the content paints and
	 * publishes the verdict as the body class
	 * `agents-manager--viewport-height-too-short-for-docking`, which both the
	 * reshape CSS and the React hook read. Width and fullscreen gating are
	 * declarative (CSS) / owned by the hook, so they are not duplicated here.
	 *
	 * The script lives in src/js/sidebar-docking-viewport-height-gate.js and is inlined (not
	 * referenced via `src`) on purpose: it must run render-blocking before paint,
	 * and a same- or cross-origin fetch would add latency to that blocking window.
	 * Reading the bundled file and printing it inline keeps it a real, lintable JS
	 * file with zero request cost.
	 *
	 * X-REF: that body class is consumed by the Calypso package's reshape selectors
	 * as the `$dock-too-short-class` SCSS variable in
	 * packages/agents-manager/src/styles/variables.scss. If you rename it, rename it
	 * there too — the two are coupled by string and won't fail loudly on drift.
	 *
	 * @return void
	 */
	public function print_sidebar_docking_viewport_height_gate_script() {
		if ( ! $this->should_pre_render_docked_shell() ) {
			return;
		}

		global $wp_filesystem;

		if ( empty( $wp_filesystem ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
			WP_Filesystem();
		}

		$script_path = __DIR__ . '/../build/sidebar-docking-viewport-height-gate.js';

		if ( empty( $wp_filesystem ) || ! $wp_filesystem->exists( $script_path ) ) {
			return;
		}

		$script = $wp_filesystem->get_contents( $script_path );
		if ( ! is_string( $script ) || '' === $script ) {
			return;
		}

		wp_print_inline_script_tag( $script );
	}

	/**
	 * Whether the docked-open shell should be pre-rendered on this request.
	 *
	 * True only when the app is loading (so the shell will be reconciled by the
	 * app that mounts to manage it) and the cached state is both open and docked
	 * — the only state that reshapes the admin layout. A cold session (no cache),
	 * a closed sidebar, or a floating (undocked) chat all pre-render nothing.
	 *
	 * @return bool
	 */
	private function should_pre_render_docked_shell(): bool {
		if ( ! $this->should_preserve_sidebar_open_state() ) {
			return false;
		}

		// On Gutenberg editor screens the chat only docks in fullscreen mode.
		// Unlike width/height (handled in CSS / by the viewport-height gate against
		// the live viewport), the body's `is-fullscreen-mode` class can't be trusted at
		// paint: core adds it unconditionally and Gutenberg only removes it after
		// boot. So read the real persisted preference and skip the pre-render when
		// fullscreen is off, avoiding a docked-shell flash before the editor JS
		// corrects the class.
		if ( $this->is_non_fullscreen_editor() ) {
			return false;
		}

		$state = Open_State_Store::get_cached();

		return $state && true === $state['agents_manager_open'] && true === $state['agents_manager_docked'];
	}

	/**
	 * Whether the current request is a Gutenberg editor screen with fullscreen
	 * mode turned off — the case where the chat floats rather than docks.
	 *
	 * Mirrors the front-end's fullscreen-gated screens (post / site editor). The
	 * `fullscreenMode` preference lives in the per-user `persisted_preferences`
	 * meta written by the block editor; it defaults to on, so only an explicit
	 * `false` counts as off.
	 *
	 * @return bool
	 */
	private function is_non_fullscreen_editor(): bool {
		global $wpdb, $pagenow;

		// Map each fullscreen-gated editor screen to its preference scope.
		$scope = null;
		if ( 'post.php' === $pagenow || 'post-new.php' === $pagenow ) {
			$scope = 'core/edit-post';
		} elseif ( 'site-editor.php' === $pagenow ) {
			$scope = 'core/edit-site';
		}

		if ( null === $scope ) {
			return false;
		}

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return false;
		}

		$preferences = get_user_meta( $user_id, $wpdb->get_blog_prefix() . 'persisted_preferences', true );

		return is_array( $preferences ) && isset( $preferences[ $scope ]['fullscreenMode'] )
			&& ! ( (bool) $preferences[ $scope ]['fullscreenMode'] );
	}

	/**
	 * Whether sidebar open preservation should run for this request.
	 *
	 * Gated on the same decision that loads the app (its active variant), so the
	 * pre-rendered shell only appears where the app will mount to reconcile it.
	 *
	 * @return bool
	 */
	private function should_preserve_sidebar_open_state(): bool {
		return null !== Agents_Manager::get_active_variant();
	}
}
