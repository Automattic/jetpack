/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';

export default function useSubmitFeedback( blogType, blogId ) {
	const [ isSubmittingFeedback, setIsSubmittingFeedback ] = useState( false );
	const [ feedbackError, setFeedbackError ] = useState( false );
	const submitFeedback = async ( feedbackData, cacheKey ) => {
		let path = `/wpcom/v2/jetpack-search/ai/rank?cache_key=${ cacheKey }`;
		if ( blogType === 'wpcom' ) {
			path = `/wpcom/v2/sites/${ blogId }/jetpack-search/ai/rank?cache_key=${ cacheKey }`;
		}

		setIsSubmittingFeedback( true );
		await apiFetch( {
			path,
			method: 'POST',
			data: {
				rank: feedbackData.rank,
				comment: feedbackData.comment,
			},
		} )
			.then( () => {
				setFeedbackError( false );
			} )
			.catch( err => {
				setFeedbackError( err );
			} )
			.finally( () => {
				setIsSubmittingFeedback( false );
			} );
	};

	return {
		isSubmittingFeedback,
		submitFeedback,
		feedbackError,
		setFeedbackError,
	};
}
