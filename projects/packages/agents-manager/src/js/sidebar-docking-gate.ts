/**
 * Agents Manager pre-paint sidebar-docking gate.
 *
 * The assistant floats instead of being docked in certain conditions. Because we're
 * optimistically injecting the sidebar classes, we need to remove them if the
 * such conditions are met.
 *
 * IMPORTANT: Keep this logic in sync with
 * `calypso/packages/agents-manager/src/hooks/use-agent-layout-manager/index.tsx`.
 */

const FULLSCREEN_GATED_BODY_CLASSES = [ 'post-php', 'post-new-php', 'site-editor-php' ];
const FULLSCREEN_BODY_CLASS = 'is-fullscreen-mode';

const DOCKED_SIDEBAR_BODY_CLASSES = [
	'agents-manager-sidebar-container',
	'agents-manager-sidebar-container--sidebar-open',
];

/**
 * Whether the fullscreen gate is open.
 *
 * @return {boolean} Whether the fullscreen gate is open.
 */
function isFullscreenGateOpen() {
	const { classList } = document.body;
	const isGated = FULLSCREEN_GATED_BODY_CLASSES.some( cls => classList.contains( cls ) );
	return ! isGated || classList.contains( FULLSCREEN_BODY_CLASS );
}

/**
 * Run the sidebar docking gate evaluation.
 *
 * @return {void}
 */
function runSidebarDockingGate() {
	const body = document.body;

	if ( ! body ) {
		return;
	}

	const adminMenu = document.getElementById( 'adminmenu' );
	if ( ! adminMenu ) {
		return;
	}

	// The docked layout pins the admin menu to the viewport; if the menu is taller
	// than the room below the admin bar it would be clipped, so the chat floats instead.
	const adminBar = document.getElementById( 'wpadminbar' );
	const adminBarHeight = adminBar ? adminBar.offsetHeight : 32;
	const tooShort = window.innerHeight < adminMenu.offsetHeight + adminBarHeight + 20;
	const tooNarrow = window.innerWidth < 1200;

	if ( tooShort || tooNarrow || ! isFullscreenGateOpen() ) {
		body.classList.remove( ...DOCKED_SIDEBAR_BODY_CLASSES );
	}
}

runSidebarDockingGate();
