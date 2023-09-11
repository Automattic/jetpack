import { Button, TextControl, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
import useSubmitFeedback from '../use-submit-feedback';
import DisplayError from './components/displayError';

export default function Feedback( { blogType, blogId, cacheKey } ) {
	const {
		isSubmittingFeedback,
		submitFeedback,
		feedbackSubmitted,
		feedbackError,
		setFeedbackError,
	} = useSubmitFeedback( blogType, blogId );

	const [ feedback, setFeedback ] = useState( { rank: '', comment: '' } );
	const [ showCommentForm, setShowCommentForm ] = useState( false );

	const handleRankSubmit = rankValue => {
		setFeedback( { ...feedback, rank: rankValue } );
		setShowCommentForm( true );
	};

	// Reset error state
	const reset = () => {
		setFeedbackError( false );
	};

	const handleFeedbackSubmit = () => {
		reset();
		submitFeedback( feedback, cacheKey );
	};

	const showFeedbackForm = ! feedbackError && ! feedbackSubmitted;

	return (
		<>
			{ feedbackError && <DisplayError error={ feedbackError } /> }
			{ feedbackSubmitted && (
				<div className="jetpack-ai-chat-feedback-submitted">
					{ __( 'Thanks for your feedback!', 'jetpack' ) }
				</div>
			) }
			{ showFeedbackForm && (
				<div className="jetpack-ai-chat-answer-feedback">
					<div className="jetpack-ai-chat-answer-feedback-buttons">
						{ __( 'Was this helpful?', 'jetpack' ) }
						<Button
							className="thumbs-up"
							disabled={ isSubmittingFeedback || feedback.rank === 'thumbs-up' }
							label={ __( 'Thumbs up', 'jetpack' ) }
							onClick={ () => handleRankSubmit( 'thumbs-up' ) }
						>
							<Icon icon="thumbs-up" />
						</Button>
						<Button
							className="thumbs-down"
							disabled={ isSubmittingFeedback || feedback.rank === 'thumbs-down' }
							label={ __( 'Thumbs down', 'jetpack' ) }
							onClick={ () => handleRankSubmit( 'thumbs-down' ) }
						>
							<Icon icon="thumbs-down" />
						</Button>
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
								disabled={ isSubmittingFeedback || feedbackSubmitted }
								onChange={ newComment => setFeedback( { ...feedback, comment: newComment } ) }
							/>
							<Button
								variant="primary"
								onClick={ handleFeedbackSubmit }
								disabled={ isSubmittingFeedback || feedbackSubmitted }
							>
								{ __( 'Submit', 'jetpack' ) }
							</Button>
						</div>
					) }
				</div>
			) }
		</>
	);
}
