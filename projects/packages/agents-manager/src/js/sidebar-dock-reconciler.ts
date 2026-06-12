/**
 * Agents Manager pre-paint dock-height reconciler.
 *
 * Inlined synchronously by `Sidebar_Open_Preservation::print_sidebar_open_sync_script()`
 * on `in_admin_header` (after #adminmenu is in the DOM, before the content
 * paints), so it runs render-blocking and there is no docked-shell flicker.
 *
 * It measures the one dock gate that can't be expressed as a CSS media query —
 * whether the (dynamic-height) admin menu fits the viewport — and publishes the
 * verdict as a body class the reshape CSS reads. Width and fullscreen gating are
 * declarative (CSS) / owned by the React hook, so they are not duplicated here.
 * This runs once at mount only; in-session changes are the hook's job.
 *
 * X-REF: the body class toggled below is the `$dock-too-short-class` SCSS
 * variable in the Calypso package
 * (packages/agents-manager/src/styles/variables.scss). Keep the name in sync.
 */
( function () {
	const body = document.body;
	if ( ! body ) {
		return;
	}

	const adminMenu = document.getElementById( 'adminmenu' );
	if ( ! adminMenu ) {
		return;
	}

	// The docked layout pins the admin menu to the viewport; if the menu is taller
	// than the room below the admin bar it would be clipped, so the chat floats
	// instead. Offset by the admin bar's *height* (class-independent) rather than
	// the menu's getBoundingClientRect().top, which is distorted while the docked
	// classes are applied. Keep this formula identical to the hook's
	// adminMenuHeight read so both agree.
	const adminBar = document.getElementById( 'wpadminbar' );
	const adminBarHeight = adminBar ? adminBar.offsetHeight : 32;
	const tooShort = window.innerHeight < adminMenu.offsetHeight + adminBarHeight + 20;

	body.classList.toggle( 'agents-manager--viewport-height-too-short-for-docking', tooShort );
} )();
