// Runs inside a keep-alive frame: hand link clicks to the parent shell so the frame never shows wp-admin chrome.

// A frame's history entries join the tab's, so Back would step through the hidden frame before the page.
history.pushState = history.replaceState.bind( history );

document.addEventListener(
	'click',
	event => {
		const a = event.target.closest?.( 'a[href]' );
		const shell = window.parent !== window && window.parent.jetpackAdminShell;
		if (
			! a ||
			! shell ||
			( a.target && a.target !== '_self' ) ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}
		const url = new URL( a.href, location.href );
		// Same-page anchors and in-frame hash routers (Stats) stay inside the frame.
		if ( url.pathname === location.pathname && url.search === location.search ) {
			return;
		}
		url.searchParams.delete( 'jetpack_shell_frame' );
		event.preventDefault();
		shell.navigate( url.href );
	},
	true
);
