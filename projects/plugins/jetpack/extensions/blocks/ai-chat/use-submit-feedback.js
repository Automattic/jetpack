/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';

export default function useSubmitQuestion() {
	const [ isSubmittingFeedback, setIsSubmittingFeedback ] = useState( false );
	const submitFeedback = async ( feedbackData, cacheKey ) => {
		setIsSubmittingFeedback( true );
		await apiFetch( {
			path: `/wpcom/v2/jetpack-search/ai/rank?cache_key=${ cacheKey }`,
			method: 'POST',
			data: {
				rank: feedbackData.rank,
				comment: feedbackData.comment,
			},
		} ).then( res => {
			if ( res ) {
				/* eslint-disable no-console */
				console.log( res );
			}
			setIsSubmittingFeedback( false );
		} );
	};

	return { isSubmittingFeedback, submitFeedback };
}
