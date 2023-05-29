window.onload = function () {
	const modal = document.getElementById( 'wpcom-subscribe-modal' );
	const close = document.getElementById( 'close' );
	let hasLoaded = false;
	let isScrolling;

	window.onscroll = function () {
		window.clearTimeout( isScrolling );

		isScrolling = setTimeout( function () {
			if ( ! hasLoaded ) {
				modal.classList.toggle( 'open' );
				hasLoaded = true;
			}
		}, 300 );
	};

	close.onclick = function () {
		modal.classList.toggle( 'open' );
	};

	window.onclick = function ( event ) {
		if ( event.target === modal ) {
			modal.style.display = 'none';
		}
	};
};
