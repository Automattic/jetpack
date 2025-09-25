/**
 * Find and initialize Code blocks.
 */
function initBlock() {
	for ( const btn of document.querySelectorAll< HTMLButtonElement >(
		'.a8c\\/code__btn-copy[hidden][data-copy-text]'
	) ) {
		btn.addEventListener(
			'click',
			function () {
				// TypeScript wants the […] accessor because of an index signature.
				// Eslint + Prettier want the dot notation.
				// Just pick one to satisfy tooling.
				// eslint-disable-next-line dot-notation
				navigator.clipboard.writeText( this.dataset[ 'copyText' ]! ).catch();
			},
			{ passive: true }
		);
		btn.hidden = false;
	}
}

if ( navigator.clipboard && ! document.body.classList.contains( 'wp-admin' ) ) {
	initBlock();

	const mutObserver = new MutationObserver( () => {
		initBlock();
	} );
	mutObserver.observe( document.body, {
		subtree: true,
		childList: true,
	} );
}
