/* eslint-disable jsx-a11y/click-events-have-key-events */

/**
 * WordPress dependencies
 */
import { Button, TextControl, Icon } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ThumbsDown, ThumbsUp } from '../../lib/icons';
import useSubmitFeedback from '../../use-submit-feedback';
import DisplayError from '../display-error';

export default function Feedback( { blogType, blogId, cacheKey, feedbackSubmitted, addFeedback } ) {
	const { isSubmittingFeedback, submitFeedback, feedbackError, setFeedbackError } =
		useSubmitFeedback( blogType, blogId );

	useEffect( () => {
		// When the cache key changes, reset the feedback state as it signals a new question.
		if ( cacheKey.startsWith( 'jp-search-ai-' ) ) {
			setFeedback( { rank: '', comment: '' } );
			setShowCommentForm( false );
			setFeedbackError( false );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ cacheKey ] );

	const [ feedback, setFeedback ] = useState( { rank: '', comment: '' } );
	const [ showCommentForm, setShowCommentForm ] = useState( false );
	const feedbackSubmittedForThisQuestion = feedbackSubmitted.includes( cacheKey );

	const handleRankSubmit = rankValue => {
		setFeedback( { ...feedback, rank: rankValue } );
		setShowCommentForm( true );
	};

	const handleFeedbackSubmit = () => {
		submitFeedback( feedback, cacheKey );
		addFeedback( cacheKey );
		submitFeedback( feedback, cacheKey );
	};

	const showFeedbackForm = ! feedbackError && ! feedbackSubmittedForThisQuestion;

	return (
		<div className="jetpack-ai-chat-feedback-container">
			{ feedbackError && <DisplayError error={ feedbackError } /> }
			{ feedbackSubmittedForThisQuestion && (
				<div className="jetpack-ai-chat-feedback-submitted">
					{ __( 'Thanks for your feedback!', 'jetpack' ) }
				</div>
			) }
			{ showFeedbackForm && (
				<div className="jetpack-ai-chat-answer-feedback">
					<hr />
					<div className="jetpack-ai-chat-answer-feedback-buttons">
						{ __( 'Was this helpful?', 'jetpack' ) }
						<a
							role="button"
							className="thumbs-up"
							disabled={ isSubmittingFeedback || feedback.rank === 'thumbs-up' }
							label={ __( 'Thumbs up', 'jetpack' ) }
							onClick={ () => handleRankSubmit( 'thumbs-up' ) }
						>
							<Icon icon={ ThumbsUp } />
						</a>
						<a
							role="button"
							className="thumbs-down"
							disabled={ isSubmittingFeedback || feedback.rank === 'thumbs-down' }
							label={ __( 'Thumbs down', 'jetpack' ) }
							onClick={ () => handleRankSubmit( 'thumbs-down' ) }
						>
							<Icon icon={ ThumbsDown } />
						</a>
					</div>
					{ showCommentForm && (
						<div className="jetpack-ai-chat-feedback-form">
							<TextControl
								className="jetpack-ai-chat-feedback-input"
								placeholder={
									feedback.rank === 'thumbs-up'
										? __( 'What did you like about it?', 'jetpack' )
										: __( "What didn't you like about it? How could it be improved?", 'jetpack' )
								}
								size={ 50 }
								value={ feedback.comment }
								disabled={ isSubmittingFeedback || feedbackSubmittedForThisQuestion }
								onChange={ newComment => setFeedback( { ...feedback, comment: newComment } ) }
							/>
							<Button
								className="wp-block-button__link jetpack-ai-chat-feedback-submit"
								onClick={ handleFeedbackSubmit }
								disabled={ isSubmittingFeedback || feedbackSubmittedForThisQuestion }
							>
								{ __( 'Submit', 'jetpack' ) }
							</Button>
						</div>
					) }
				</div>
			) }
		</div>
	);
}
