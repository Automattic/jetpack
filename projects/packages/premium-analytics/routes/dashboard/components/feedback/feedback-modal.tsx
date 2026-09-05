/**
 * WordPress dependencies
 */
import { submitStatsUserFeedback, type StatsFeedbackRating } from '@jetpack-premium-analytics/data';
import { Button, Notice, Stack } from '@jetpack-premium-analytics/externals';
import { Modal } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { FeedbackFields } from './feedback-fields';

// Reaches Happiness as the subject line of the feedback email ("Feedback received
// from …"), so it has to name the surface without any further context.
const PRODUCT_NAME = 'Jetpack Stats v2';

type FeedbackModalProps = {
	onClose: () => void;
};

/**
 * Comparison rating with an optional comment. Both reach Tracks as one event; a non-empty
 * comment also goes to the Stats feedback endpoint.
 *
 * @param {FeedbackModalProps} props         - Component props.
 * @param {Function}           props.onClose - Called once the reader dismisses the modal.
 * @return The modal.
 */
export function FeedbackModal( { onClose }: FeedbackModalProps ) {
	const trackEvent = useTrackEvent();
	const [ rating, setRating ] = useState< StatsFeedbackRating | null >( null );
	const [ comment, setComment ] = useState( '' );
	const [ hasSubmitted, setHasSubmitted ] = useState( false );

	const blockerQuestion = __(
		"What's the one thing we'd need to fix before this replaces the old Stats?",
		'jetpack-premium-analytics-pkg'
	);

	const submit = useCallback( () => {
		if ( rating === null ) {
			return;
		}

		const message = comment.trim();

		trackEvent( 'jetpack_premium_analytics_feedback_submit', { rating, comment: message } );

		// Second channel, deliberately not awaited: Tracks is a pixel and ad blockers drop it
		// silently, so the message also goes to Happiness where delivery is not the reader's
		// browser's decision. A rating alone would only open an empty ticket.
		if ( message ) {
			submitStatsUserFeedback( { rating, comment: message, productName: PRODUCT_NAME } ).catch(
				() => {
					// The reader has already been thanked and Tracks may well have the submission;
					// a second, contradictory message would cost more than the lost email.
				}
			);
		}

		setHasSubmitted( true );
	}, [ comment, rating, trackEvent ] );

	return (
		<Modal
			title={ __( 'Share your feedback', 'jetpack-premium-analytics-pkg' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			{ hasSubmitted ? (
				<Stack direction="column" gap="lg">
					<Notice.Root intent="success">
						<Notice.Description>
							{ __( 'Thank you. This helps.', 'jetpack-premium-analytics-pkg' ) }
						</Notice.Description>
					</Notice.Root>

					<Stack direction="row" gap="sm" justify="end">
						<Button variant="solid" size="compact" onClick={ onClose }>
							{ __( 'Done', 'jetpack-premium-analytics-pkg' ) }
						</Button>
					</Stack>
				</Stack>
			) : (
				<Stack direction="column" gap="xl">
					<FeedbackFields
						rating={ rating }
						onRatingChange={ setRating }
						comment={ comment }
						onCommentChange={ setComment }
						commentQuestion={ blockerQuestion }
					/>

					<Stack direction="row" gap="sm" justify="end">
						<Button variant="minimal" size="compact" onClick={ onClose }>
							{ __( 'Cancel', 'jetpack-premium-analytics-pkg' ) }
						</Button>
						<Button variant="solid" size="compact" disabled={ rating === null } onClick={ submit }>
							{ __( 'Send feedback', 'jetpack-premium-analytics-pkg' ) }
						</Button>
					</Stack>
				</Stack>
			) }
		</Modal>
	);
}
