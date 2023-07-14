const { domReady } = wp;

domReady( function () {
	const modal = document.getElementsByClassName( 'jetpack-subscribe-modal' )[ 0 ];
	const close = document.getElementsByClassName( 'jetpack-subscribe-modal__close' )[ 0 ];

	if ( ! modal ) {
		return;
	}

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
} );
