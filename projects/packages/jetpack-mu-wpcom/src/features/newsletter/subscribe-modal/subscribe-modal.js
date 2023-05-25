window.onload = function () {
	const modal = document.getElementById( 'wpcom-subscribe-modal' );
	const close = document.getElementById( 'close' );
	let hasLoaded = false;

	window.onscroll = function () {
		if ( ! hasLoaded ) {
			modal.style.display = 'block';
			hasLoaded = true;
		}
	};

	open.onclick = function () {
		modal.style.display = 'block';
	};

	close.onclick = function () {
		modal.style.display = 'none';
	};

	window.onclick = function ( event ) {
		if ( event.target === modal ) {
			modal.style.display = 'none';
		}
	};
};
