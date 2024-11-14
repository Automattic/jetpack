const wpcomFixSidebarScrolling = () => {
	const observer = new MutationObserver( mutationList => {
		mutationList.forEach( mutation => {
			mutation.addedNodes.forEach( node => {
				// The domain upsell nudge is added.
				if ( node.id === 'toplevel_page_site-notices' ) {
					window.dispatchEvent( new Event( 'resize' ) );
				}
			} );
		} );
	} );
	observer.observe( document.querySelector( '#adminmenu' ), {
		childList: true,
	} );
};

document.addEventListener( 'DOMContentLoaded', wpcomFixSidebarScrolling );
