/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';
import { createRoot } from 'react-dom/client';
import { getCommentLikeStatus } from './shared-data';

type WpcomCommentLikesProps = {
	commentId: string;
};

/**
 * WpcomCommentLike Component.
 *
 * Renders the final markup as:
 * <a href="#"><span>{ feedback }</span></a>
 *
 * Uses the global wpcomCommentLikesData object (localized via PHP)
 * to obtain siteId, likeFeedback, likedFeedback, and loadingFeedback values.
 *
 * @param {WpcomCommentLikesProps} props - Component properties.
 * @return {React.JSX.Element | null} Rendered component.
 */
const WpcomCommentLike = ( { commentId }: WpcomCommentLikesProps ): React.JSX.Element | null => {
	// These values come from wp_localize_script in PHP.
	const { siteId, likeFeedback, likedFeedback, loadingFeedback } = window.wpcomCommentLikesData;
	const [ feedback, setFeedback ] = useState< string | null >( loadingFeedback );
	const [ loading, setLoading ] = useState( false );

	// Update the feedback once the comments data is loaded.
	useEffect( () => {
		getCommentLikeStatus( commentId ).then( isLiked => {
			setFeedback( isLiked ? likedFeedback : likeFeedback );
		} );
	}, [ commentId, likeFeedback, likedFeedback ] );

	/**
	 * Handle click event to toggle the like status.
	 */
	const handleClick = () => {
		if ( loading ) {
			return;
		}

		setLoading( true );
		const isLiked = feedback === likeFeedback;
		const currentFeedback = feedback;
		const nextFeedback = isLiked ? likedFeedback : likeFeedback;

		// Build the endpoint URL based on the current action.
		const options = {
			url: isLiked
				? `https://public-api.wordpress.com/rest/v1.1/sites/${ siteId }/comments/${ commentId }/likes/new`
				: `https://public-api.wordpress.com/rest/v1.1/sites/${ siteId }/comments/${ commentId }/likes/mine/delete`,
			method: 'POST',
		};

		// Optimistically update the UI.
		setFeedback( nextFeedback );
		apiFetch( options )
			.catch( () => {
				// Restore the current feedback on error.
				setFeedback( currentFeedback );
			} )
			.finally( () => {
				setLoading( false );
			} );
	};

	// Do not render until feedback is set.
	if ( feedback === null ) {
		return null;
	}

	return (
		<a href="#" onClick={ handleClick }>
			{ feedback }
		</a>
	);
};

// Mount the WpcomCommentLike component on each container with the class "wpcom-comment-like".
const likeElements: NodeListOf< HTMLElement > = document.querySelectorAll( '.wpcom-comment-like' );

likeElements.forEach( element => {
	const commentId = element.dataset.commentId || '';

	const root = createRoot( element );
	root.render( <WpcomCommentLike commentId={ commentId } /> );
} );
