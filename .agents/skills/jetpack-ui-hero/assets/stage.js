( function () {
	// Each scene is authored at its capture size and scaled to the width it gets.
	for ( const scene of document.querySelectorAll( '.scene' ) ) {
		const box = scene.parentElement;
		const fit = () => {
			scene.style.transform = 'scale(' + box.clientWidth / scene.offsetWidth + ')';
		};
		new ResizeObserver( fit ).observe( box );
		fit();
	}

	const replay = stage => {
		stage.classList.remove( 'is-idle' );
		stage.getAnimations( { subtree: true } ).forEach( a => {
			a.cancel();
			a.play();
		} );
	};
	const stages = [ ...document.querySelectorAll( '.stage' ) ];

	// Start the first time half of it is on screen; replay if it comes back after
	// leaving. A hero nobody sees the start of explains nothing.
	const seen = new WeakSet();
	const io = new IntersectionObserver(
		es =>
			es.forEach( e => {
				if ( e.intersectionRatio >= 0.5 ) {
					if ( seen.has( e.target ) ) replay( e.target );
					else {
						seen.add( e.target );
						e.target.classList.remove( 'is-idle' );
					}
				}
			} ),
		{ threshold: [ 0.5 ] }
	);
	stages.forEach( s => io.observe( s ) );

	document
		.querySelectorAll( '[data-replay]' )
		.forEach( b =>
			b.addEventListener( 'click', () => replay( document.getElementById( b.dataset.replay ) ) )
		);
	document.addEventListener( 'keydown', e => {
		if ( e.key.toLowerCase() !== 'r' || e.target.matches( 'input,textarea' ) ) return;
		const top = stages
			.map( s => ( { s, d: Math.abs( s.getBoundingClientRect().top ) } ) )
			.sort( ( a, b ) => a.d - b.d )[ 0 ];
		if ( top ) replay( top.s );
	} );
} )();
