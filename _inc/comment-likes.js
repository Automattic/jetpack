// Dynamically load the comment likes iframe for visible comments
function processCommentLikes() {
	var commentLikeButtons = document.getElementsByClassName( 'comment-likes' );

	for ( var i = 0; i < commentLikeButtons.length; i++ ) {
		var commentLikeButton = commentLikeButtons[ i ];
		if ( isScrolledIntoView( commentLikeButton ) ) {
			if ( ! commentLikeButton.innerHTML.startsWith( '<iframe' ) ) {
				commentLikeButton.innerHTML = '<iframe class="comment-likes-widget jetpack-comment-likes-widget" height="55px" width="100%" frameborder="0" src="//widgets.wp.com/notifications"></iframe>';
			}
		} else if ( ! commentLikeButton.innerHTML.startsWith( 'Loading' ) ) {
			commentLikeButton.innerHTML = 'Loading iframe...';
		}
	}
}

function isScrolledIntoView( el ) {
	var elemTop = el.getBoundingClientRect().top;
	var elemBottom = el.getBoundingClientRect().bottom;

	return ( elemTop >= 0 ) && ( elemBottom <= window.innerHeight );
}

var delayedExec = function( after, fn ) {
	var timer;
	return function() {
		timer && clearTimeout( timer );
		timer = setTimeout( fn, after );
	};
};

var onScrollStopped = delayedExec( 250, function() {
	processCommentLikes();
} );

window.addEventListener( 'scroll', onScrollStopped, true );
