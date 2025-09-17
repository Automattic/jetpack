/**
 *
 */
function initBlock() {
	for ( const btn of document.querySelectorAll< HTMLButtonElement >(
		'.a8c\\/code__btn-copy[hidden][data-copy-text]'
	) ) {
		btn.addEventListener(
			'click',
			function () {
				navigator.clipboard
					.writeText( this.dataset.copyText! )
					.catch();
			},
			{ passive: true }
		);
		btn.hidden = false;
	}
}

if ( ! document.body.classList.contains( 'wp-admin' ) ) {
	initBlock();

	const mutObserver = new MutationObserver( () => {
		initBlock();
	} );
	mutObserver.observe( document.body, {
		subtree: true,
		childList: true,
	} );
}
