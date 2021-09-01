window.document.addEventListener( 'DOMContentLoaded', () => {
	// Data global containers.
	const posts = [ ...window.wpAdminPosts ];

	posts.forEach( post => {
		const postRow = document.getElementById( 'post-' + post.id );
		if ( ! postRow ) {
			return;
		}

		const postTitleElementWrapper = postRow.querySelector( '.column-title' );

		// Inject post-featured-image__container container just before post title.
		const postFeaturedImageElement = document.createElement( 'span' );
		postFeaturedImageElement.classList.add( 'post-featured-image__container' );
		postFeaturedImageElement.classList.add(
			post.featured_image.id ? 'has-featured-image' : 'no-featured-image'
		);

		postTitleElementWrapper.insertBefore(
			postFeaturedImageElement,
			postTitleElementWrapper.firstChild
		);

		if ( post.featured_image.url ) {
			const thumbnailImage = document.createElement( 'img' );
			thumbnailImage.setAttribute( 'src', post.featured_image.thumb );
			thumbnailImage.setAttribute( 'alt', post.featured_image.alt );
			thumbnailImage.setAttribute( 'width', 50 );
			thumbnailImage.setAttribute( 'height', 50 );

			thumbnailImage.classList.add( 'post-featured-image__image' );
			postFeaturedImageElement.appendChild( thumbnailImage );
		}
	} );
} );
