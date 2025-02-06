/* global WP_Enqueue_Dynamic_Script VerbumComments */
window.addEventListener( 'DOMContentLoaded', function () {
	// Lazy load the comment form when clicking the comment field
	const commentForm = document.querySelector( '#commentform' );
	if ( commentForm ) {
		// only load Verbum if the comment field is visible or the browser doesn't support IntersectionObserver
		if ( window.IntersectionObserver ) {
			new IntersectionObserver( function ( entries ) {
				if ( entries.some( el => el.isIntersecting ) ) {
					const startedLoadingAt = Date.now();

					WP_Enqueue_Dynamic_Script.loadScript( 'verbum' ).then( () => {
						const finishedLoadingAt = Date.now();

						VerbumComments.fullyLoadedTime = finishedLoadingAt - startedLoadingAt;
					} );
					this.disconnect();
				}
			} ).observe( commentForm );
		} else {
			WP_Enqueue_Dynamic_Script.loadScript( 'verbum' );
		}
	}
} );
