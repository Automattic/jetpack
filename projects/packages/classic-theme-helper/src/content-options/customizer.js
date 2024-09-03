/* global blogDisplay, postDetails, wp */

/**
 * customizer.js
 *
 * Theme Customizer enhancements for a better user experience.
 *
 * Contains handlers to make Theme Customizer preview reload changes asynchronously.
 */

// Blog Display
wp.customize( 'jetpack_content_blog_display', function ( value ) {
	/**
	 * Updates the blog display based on the selected option.
	 * @param {string} to - Content display option.
	 */
	function updateBlogDisplay( to ) {
		const contentElements = document.querySelectorAll(
			'.jetpack-blog-display.jetpack-the-content'
		);
		const excerptElements = document.querySelectorAll(
			'.jetpack-blog-display.jetpack-the-excerpt'
		);

		if ( to === 'content' ) {
			excerptElements.forEach( el => {
				el.style.clip = 'rect(1px, 1px, 1px, 1px)';
				el.style.position = 'absolute';
			} );
			contentElements.forEach( el => {
				el.style.clip = 'auto';
				el.style.position = 'relative';
			} );
		} else if ( to === 'excerpt' ) {
			contentElements.forEach( el => {
				el.style.clip = 'rect(1px, 1px, 1px, 1px)';
				el.style.position = 'absolute';
			} );
			excerptElements.forEach( el => {
				el.style.clip = 'auto';
				el.style.position = 'relative';
			} );
		} else if ( to === 'mixed' ) {
			document
				.querySelectorAll( '.jetpack-blog-display.jetpack-the-content.output-the-content' )
				.forEach( el => {
					el.style.clip = 'auto';
					el.style.position = 'relative';
				} );
			document
				.querySelectorAll(
					'.jetpack-blog-display.jetpack-the-excerpt.output-the-content, .jetpack-blog-display.jetpack-the-content.output-the-excerpt'
				)
				.forEach( el => {
					el.style.clip = 'rect(1px, 1px, 1px, 1px)';
					el.style.position = 'absolute';
				} );
			document
				.querySelectorAll( '.jetpack-blog-display.jetpack-the-excerpt.output-the-excerpt' )
				.forEach( el => {
					el.style.clip = 'auto';
					el.style.position = 'relative';
				} );
		}

		if ( blogDisplay.masonry ) {
			const masonryElement = document.querySelector( blogDisplay.masonry );
			if ( masonryElement ) {
				masonryElement.masonry();
			}
		}
	}

	updateBlogDisplay( blogDisplay.display );
	value.bind( updateBlogDisplay );
} );

// Post Details: Date
wp.customize( 'jetpack_content_post_details_date', function ( value ) {
	value.bind( function ( to ) {
		const dateElement = document.querySelector( postDetails.date );
		if ( to === false ) {
			dateElement.style.clip = 'rect(1px, 1px, 1px, 1px)';
			dateElement.style.height = '1px';
			dateElement.style.overflow = 'hidden';
			dateElement.style.position = 'absolute';
			dateElement.style.width = '1px';
			document.body.classList.add( 'date-hidden' );
		} else {
			dateElement.style.clip = 'auto';
			dateElement.style.height = 'auto';
			dateElement.style.overflow = 'auto';
			dateElement.style.position = 'relative';
			dateElement.style.width = 'auto';
			document.body.classList.remove( 'date-hidden' );
		}
	} );
} );

// Post Details: Categories
wp.customize( 'jetpack_content_post_details_categories', function ( value ) {
	value.bind( function ( to ) {
		const categoriesElement = document.querySelector( postDetails.categories );
		if ( to === false ) {
			categoriesElement.style.clip = 'rect(1px, 1px, 1px, 1px)';
			categoriesElement.style.height = '1px';
			categoriesElement.style.overflow = 'hidden';
			categoriesElement.style.position = 'absolute';
			categoriesElement.style.width = '1px';
			document.body.classList.add( 'categories-hidden' );
		} else {
			categoriesElement.style.clip = 'auto';
			categoriesElement.style.height = 'auto';
			categoriesElement.style.overflow = 'auto';
			categoriesElement.style.position = 'relative';
			categoriesElement.style.width = 'auto';
			document.body.classList.remove( 'categories-hidden' );
		}
	} );
} );

// Post Details: Tags
wp.customize( 'jetpack_content_post_details_tags', function ( value ) {
	value.bind( function ( to ) {
		const tagsElement = document.querySelector( postDetails.tags );
		if ( to === false ) {
			tagsElement.style.clip = 'rect(1px, 1px, 1px, 1px)';
			tagsElement.style.height = '1px';
			tagsElement.style.overflow = 'hidden';
			tagsElement.style.position = 'absolute';
			tagsElement.style.width = '1px';
			document.body.classList.add( 'tags-hidden' );
		} else {
			tagsElement.style.clip = 'auto';
			tagsElement.style.height = 'auto';
			tagsElement.style.overflow = 'auto';
			tagsElement.style.position = 'relative';
			tagsElement.style.width = 'auto';
			document.body.classList.remove( 'tags-hidden' );
		}
	} );
} );

// Post Details: Author
wp.customize( 'jetpack_content_post_details_author', function ( value ) {
	value.bind( function ( to ) {
		const authorElement = document.querySelector( postDetails.author );
		if ( to === false ) {
			authorElement.style.clip = 'rect(1px, 1px, 1px, 1px)';
			authorElement.style.height = '1px';
			authorElement.style.overflow = 'hidden';
			authorElement.style.position = 'absolute';
			authorElement.style.width = '1px';
			document.body.classList.add( 'author-hidden' );
		} else {
			authorElement.style.clip = 'auto';
			authorElement.style.height = 'auto';
			authorElement.style.overflow = 'auto';
			authorElement.style.position = 'relative';
			authorElement.style.width = 'auto';
			document.body.classList.remove( 'author-hidden' );
		}
	} );
} );

// Post Details: Comment link
wp.customize( 'jetpack_content_post_details_comment', function ( value ) {
	value.bind( function ( to ) {
		const commentElement = document.querySelector( postDetails.comment );
		if ( to === false ) {
			commentElement.style.clip = 'rect(1px, 1px, 1px, 1px)';
			commentElement.style.height = '1px';
			commentElement.style.overflow = 'hidden';
			commentElement.style.position = 'absolute';
			commentElement.style.width = '1px';
			document.body.classList.add( 'comment-hidden' );
		} else {
			commentElement.style.clip = 'auto';
			commentElement.style.height = 'auto';
			commentElement.style.overflow = 'auto';
			commentElement.style.position = 'relative';
			commentElement.style.width = 'auto';
			document.body.classList.remove( 'comment-hidden' );
		}
	} );
} );
