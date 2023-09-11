/**
 * WordPress dependencies
 */
import { Button, TextControl, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import useSubmitFeedback from '../../use-submit-feedback';
import DisplayError from '../display-error';

export default function Feedback( { blogType, blogId, cacheKey } ) {
	const {
		isSubmittingFeedback,
		submitFeedback,
		feedbackSubmitted,
		setFeedbackSubmitted,
		feedbackError,
		setFeedbackError,
	} = useSubmitFeedback( blogType, blogId );

	useEffect( () => {
		if ( cacheKey.startsWith( 'jp-search-ai-' ) ) {
			reset();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ cacheKey ] );

	const [ feedback, setFeedback ] = useState( { rank: '', comment: '' } );
	const [ showCommentForm, setShowCommentForm ] = useState( false );

	const handleRankSubmit = rankValue => {
		setFeedback( { ...feedback, rank: rankValue } );
		setShowCommentForm( true );
	};

	// Reset feedback state.
	const reset = () => {
		setFeedback( { rank: '', comment: '' } );
		setFeedbackSubmitted( false );
		setShowCommentForm( false );
		setFeedbackError( false );
	};

	const handleFeedbackSubmit = () => {
		submitFeedback( feedback, cacheKey );
	};

	const showFeedbackForm = ! feedbackError && ! feedbackSubmitted;

	return (
		<div className="jetpack-ai-chat-feedback-container">
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
		</div>
	);
}
