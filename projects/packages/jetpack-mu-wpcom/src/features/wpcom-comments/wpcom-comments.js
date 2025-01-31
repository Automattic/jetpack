document.addEventListener( 'DOMContentLoaded', () => {
	const likeLinks = [ ...document.getElementsByClassName( 'comment-like-link' ) ];

	likeLinks.forEach( link => {
		link.addEventListener( 'click', event => {
			event.preventDefault();

			const span = link.querySelector( 'span' );
			const currentText = span.textContent.trim();
			const currentAction = currentText === 'Like' ? 'like_comment' : 'unlike_comment';

			// Prepare the data payload
			const postData = new URLSearchParams( {
				action: currentAction,
				_wpnonce: link.dataset.nonce,
				like_comment: link.dataset.comment,
				blog_id: link.dataset.blog,
			} );

			// Send the request
			fetch( '/wp-admin/admin-ajax.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: postData,
			} )
				.then( response => {
					if ( ! response.ok ) {
						throw new Error( 'Network response was not ok' );
					}
					return response.json();
				} )
				.then( data => {
					// Update the link's text with the display value from the response
					if ( data.display ) {
						span.textContent = data.display;
					}
				} )
				.catch( error => {
					// Bubble error
					throw error;
				} );
		} );
	} );
} );
