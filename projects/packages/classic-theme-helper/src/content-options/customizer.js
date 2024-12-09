/* global blogDisplay, postDetails, wp */

/**
 * customizer.js
 *
 * Theme Customizer enhancements for a better user experience.
 *
 * Contains handlers to make Theme Customizer preview reload changes asynchronously.
 */

/**
 * Function to apply styles to elements based on the display type
 * @param {object} selectors - HTML selectors which styles will apply to.
 * @param {object} styles    - Styles to be applied to selectors.
 */
function applyStyles( selectors, styles ) {
	document.querySelectorAll( selectors ).forEach( el => {
		for ( const [ key, value ] of Object.entries( styles ) ) {
			el.style[ key ] = value;
		}
	} );
}

// Blog Display
wp.customize( 'jetpack_content_blog_display', function ( value ) {
	/**
	 * Updates the blog display based on the selected option.
	 * @param {string} to - Content display option.
	 */
	function updateBlogDisplay( to ) {
		const contentSelectors = '.jetpack-blog-display.jetpack-the-content';
		const excerptSelectors = '.jetpack-blog-display.jetpack-the-excerpt';
		const featuredContentSelectors = '.featured-content .jetpack-blog-display';

		if ( to === 'content' ) {
			applyStyles( `${ excerptSelectors }, ${ featuredContentSelectors }.jetpack-the-excerpt`, {
				clip: 'rect(1px, 1px, 1px, 1px)',
				position: 'absolute',
			} );
			applyStyles( `${ contentSelectors }, ${ featuredContentSelectors }.jetpack-the-content`, {
				clip: 'auto',
				position: 'relative',
			} );
		} else if ( to === 'excerpt' ) {
			applyStyles( `${ contentSelectors }, ${ featuredContentSelectors }.jetpack-the-content`, {
				clip: 'rect(1px, 1px, 1px, 1px)',
				position: 'absolute',
			} );
			applyStyles( `${ excerptSelectors }, ${ featuredContentSelectors }.jetpack-the-excerpt`, {
				clip: 'auto',
				position: 'relative',
			} );
		} else if ( to === 'mixed' ) {
			applyStyles(
				`${ contentSelectors }.output-the-content, ${ featuredContentSelectors }.jetpack-the-content.output-the-content`,
				{
					clip: 'auto',
					position: 'relative',
				}
			);
			applyStyles(
				`${ excerptSelectors }.output-the-content, ${ contentSelectors }.output-the-excerpt, ${ featuredContentSelectors }.jetpack-the-excerpt.output-the-content, ${ featuredContentSelectors }.jetpack-the-content.output-the-excerpt`,
				{
					clip: 'rect(1px, 1px, 1px, 1px)',
					position: 'absolute',
				}
			);
			applyStyles(
				`${ excerptSelectors }.output-the-excerpt, ${ featuredContentSelectors }.jetpack-the-excerpt.output-the-excerpt`,
				{
					clip: 'auto',
					position: 'relative',
				}
			);
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

/**
 * Function to update post details visibility
 * @param {object} selectors   - HTML selectors which styles will apply to.
 * @param {string} to          - Content display option.
 * @param {string} hiddenClass - Class to be added to the body when the post details are hidden.
 */
function updatePostDetails( selectors, to, hiddenClass ) {
	document.querySelectorAll( selectors ).forEach( element => {
		if ( to === false ) {
			element.style.clip = 'rect(1px, 1px, 1px, 1px)';
			element.style.height = '1px';
			element.style.overflow = 'hidden';
			element.style.position = 'absolute';
			element.style.width = '1px';
			document.body.classList.add( hiddenClass );
		} else {
			element.style.clip = 'auto';
			element.style.height = 'auto';
			element.style.overflow = 'visible';
			element.style.position = 'relative';
			element.style.width = 'auto';
			document.body.classList.remove( hiddenClass );
		}
	} );
}

// Post Details: Date
wp.customize( 'jetpack_content_post_details_date', function ( value ) {
	value.bind( function ( to ) {
		updatePostDetails( postDetails.date, to, 'date-hidden' );
	} );
} );

// Post Details: Categories
wp.customize( 'jetpack_content_post_details_categories', function ( value ) {
	value.bind( function ( to ) {
		updatePostDetails( postDetails.categories, to, 'categories-hidden' );
	} );
} );

// Post Details: Tags
wp.customize( 'jetpack_content_post_details_tags', function ( value ) {
	value.bind( function ( to ) {
		updatePostDetails( postDetails.tags, to, 'tags-hidden' );
	} );
} );

// Post Details: Author
wp.customize( 'jetpack_content_post_details_author', function ( value ) {
	value.bind( function ( to ) {
		updatePostDetails( postDetails.author, to, 'author-hidden' );
	} );
} );

// Post Details: Comment link
wp.customize( 'jetpack_content_post_details_comment', function ( value ) {
	value.bind( function ( to ) {
		updatePostDetails( postDetails.comment, to, 'comment-hidden' );
	} );
} );
