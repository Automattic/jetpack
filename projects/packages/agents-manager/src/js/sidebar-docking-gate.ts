/**
 * Agents Manager pre-paint sidebar-docking gate.
 *
 * The assistant floats instead of being docked in certain conditions. Because we
 * optimistically inject the sidebar classes, we remove them when those conditions
 * are met.
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

// The Calypso hook adds this element when it mounts; its presence is our hand-off signal.
const CHAT_PORTAL_CLASS = 'agents-manager-chat';

// Minimum viewport width for docking, mirroring the hook's `desktopMediaQuery`
// default of `(min-width: 1200px)`.
const DESKTOP_MIN_WIDTH = 1200;

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
 * Whether the docked shell is currently on the body.
 *
 * @return {boolean} Whether the docked shell is present.
 */
function isDockedShellPresent() {
	return DOCKED_SIDEBAR_BODY_CLASSES.some( cls => document.body.classList.contains( cls ) );
}

/**
 * Remove the docked shell so the assistant floats.
 *
 * @return {void}
 */
function removeDockedShell() {
	document.body.classList.remove( ...DOCKED_SIDEBAR_BODY_CLASSES );
}

/**
 * Run the sidebar docking gate evaluation.
 *
 * @return {void}
 */
function runSidebarDockingGate() {
	if ( ! document.body ) {
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
	const tooNarrow = window.innerWidth < DESKTOP_MIN_WIDTH;

	if ( tooShort || tooNarrow || ! isFullscreenGateOpen() ) {
		removeDockedShell();
	}
}

runSidebarDockingGate();

// The gated screen classes (`post-php`, …) and `is-fullscreen-mode` can land on
// <body> after the first run, leaving a stale shell on a non-fullscreen editor. So
// re-check the fullscreen gate on class changes (cheap reads, no layout) and float
// the chat if it closed. Disconnect once the shell is gone (which also stops a
// re-trigger loop) or the app mounts and takes over docking.
if ( document.body ) {
	const observer = new MutationObserver( () => {
		if ( ! isDockedShellPresent() || document.querySelector( `.${ CHAT_PORTAL_CLASS }` ) ) {
			observer.disconnect();
			return;
		}
		if ( ! isFullscreenGateOpen() ) {
			removeDockedShell();
		}
	} );
	observer.observe( document.body, { attributes: true, attributeFilter: [ 'class' ] } );
}
