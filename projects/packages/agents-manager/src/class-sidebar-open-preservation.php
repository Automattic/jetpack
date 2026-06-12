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
 * which varies per page. So a tiny synchronous reconciler is printed on
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
	 * Body class marking the sidebar mid close-transition.
	 *
	 * @var string
	 */
	private const SIDEBAR_CLOSING_CLASS = 'agents-manager-sidebar-container--closing';

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
		add_action( 'in_admin_header', array( $this, 'print_sidebar_open_sync_script' ) );
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
	 * Print the synchronous dock-reconciliation script.
	 *
	 * Only emitted when the docked shell was pre-rendered. Runs before the page
	 * content paints and mirrors the front-end `canDock` gate in
	 * `use-agent-layout-manager` (Calypso): desktop width, enough height for the
	 * admin menu, and — on Gutenberg editor screens — fullscreen mode. When the
	 * gate is closed the chat will float, so the pre-rendered docked classes are
	 * stripped here to avoid a stale shell. Keep this logic in sync with the
	 * hook; it is the source of truth for the breakpoints and gated screens.
	 *
	 * @return void
	 */
	public function print_sidebar_open_sync_script() {
		if ( ! $this->should_pre_render_docked_shell() ) {
			return;
		}

		$script = <<<'JS'
( function () {
	var body = document.body;
	if ( ! body || ! body.classList.contains( 'agents-manager-sidebar-container' ) ) {
		return;
	}

	// Desktop-width gate. Matches the hook's `isDesktop` media query.
	var isDesktop = window.matchMedia( '(min-width: 1200px)' ).matches;

	// Enough-height gate. Mirrors the hook's admin-menu-fit check: is there room
	// for the full menu below the admin bar? Offset by the admin bar's *height*
	// (class-independent) rather than the menu's `getBoundingClientRect().top` —
	// the docked classes are still applied here, so the menu is `position: fixed`
	// and its top is distorted, which would wrongly fail the gate. Keep this
	// formula identical to the hook so both agree when the classes are present.
	var hasEnoughHeight = true;
	var adminMenu = document.getElementById( 'adminmenu' );
	if ( adminMenu ) {
		var adminBar = document.getElementById( 'wpadminbar' );
		var adminBarHeight = adminBar ? adminBar.offsetHeight : 32;
		hasEnoughHeight = window.innerHeight >= adminMenu.offsetHeight + adminBarHeight + 20;
	}

	// Fullscreen gate. On editor screens, only dock in fullscreen mode.
	var fullscreenGatedScreens = [ 'post-php', 'post-new-php', 'site-editor-php' ];
	var isGatedScreen = fullscreenGatedScreens.some( function ( cls ) {
		return body.classList.contains( cls );
	} );
	var isFullscreenGateOpen = ! isGatedScreen || body.classList.contains( 'is-fullscreen-mode' );

	var canDock = isDesktop && hasEnoughHeight && isFullscreenGateOpen;
	if ( ! canDock ) {
		body.classList.remove(
			'agents-manager-sidebar-container',
			'agents-manager-sidebar-container--sidebar-open',
			'agents-manager-sidebar-container--closing'
		);
	}
} )();
JS;

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

		$state = Open_State_Store::get_cached();

		return $state && true === $state['agents_manager_open'] && true === $state['agents_manager_docked'];
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
