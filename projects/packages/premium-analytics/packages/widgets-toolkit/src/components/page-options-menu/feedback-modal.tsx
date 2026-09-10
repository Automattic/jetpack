/**
 * WordPress dependencies
 */
import { submitStatsUserFeedback } from '@jetpack-premium-analytics/data';
import { Button, Dialog, Notice, Stack } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { ReadinessFields, readinessSummary, type StatsFeedbackReadiness } from './feedback-fields';

// Reaches Happiness as the subject line of the feedback email ("Feedback received
// from …"), so it has to name the surface without any further context.
const PRODUCT_NAME = 'Jetpack Stats v2';

type FeedbackModalProps = {
	onClose: () => void;
};

/**
 * Readiness answer with an optional comment. Both reach Tracks as one event; a non-empty
 * comment also goes to the Stats feedback endpoint.
 *
 * @param {FeedbackModalProps} props         - Component props.
 * @param {Function}           props.onClose - Called once the reader dismisses the modal.
 * @return The modal.
 */
export function FeedbackModal( { onClose }: FeedbackModalProps ) {
	const trackEvent = useTrackEvent();
	const [ readiness, setReadiness ] = useState< StatsFeedbackReadiness >();
	const [ comment, setComment ] = useState( '' );
	const [ hasSubmitted, setHasSubmitted ] = useState( false );

	const handleOpenChange = useCallback(
		( isOpen: boolean ) => {
			if ( ! isOpen ) {
				onClose();
			}
		},
		[ onClose ]
	);

	const submit = useCallback( () => {
		if ( readiness === undefined ) {
			return;
		}

		const message = comment.trim();

		trackEvent( 'jetpack_premium_analytics_feedback_submit', { readiness, comment: message } );

		// Second channel, deliberately not awaited: Tracks is a pixel and ad blockers drop it
		// silently, so the message also goes to Happiness where delivery is not the reader's
		// browser's decision. An answer alone would only open an empty ticket.
		if ( message ) {
			// The endpoint has no readiness field, so the answer rides along in the message.
			submitStatsUserFeedback( {
				comment: `${ readinessSummary( readiness ) } ${ message }`,
				productName: PRODUCT_NAME,
			} ).catch( () => {
				// The reader has already been thanked and Tracks may well have the submission;
				// a second, contradictory message would cost more than the lost email.
			} );
		}

		setHasSubmitted( true );
	}, [ comment, readiness, trackEvent ] );

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup size="medium">
				<Dialog.Header>
					<Dialog.Title>
						{ __( 'Share your feedback', 'jetpack-premium-analytics-pkg' ) }
					</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>

				{ hasSubmitted ? (
					<>
						<Dialog.Content>
							<Notice.Root intent="success">
								<Notice.Title>
									{ __(
										'Thanks, your feedback has gone to the team.',
										'jetpack-premium-analytics-pkg'
									) }
								</Notice.Title>
								<Notice.Description>
									{ __(
										"It'll help us decide what to fix before the new Traffic tab replaces the old one. You can send more any time from the same menu.",
										'jetpack-premium-analytics-pkg'
									) }
								</Notice.Description>
							</Notice.Root>
						</Dialog.Content>

						<Dialog.Footer>
							<Dialog.Action variant="solid" size="compact">
								{ __( 'Done', 'jetpack-premium-analytics-pkg' ) }
							</Dialog.Action>
						</Dialog.Footer>
					</>
				) : (
					<>
						<Dialog.Content>
							<Stack direction="column" gap="xl">
								<ReadinessFields
									readiness={ readiness }
									onReadinessChange={ setReadiness }
									comment={ comment }
									onCommentChange={ setComment }
								/>
							</Stack>
						</Dialog.Content>

						<Dialog.Footer>
							<Dialog.Action variant="minimal" size="compact">
								{ __( 'Cancel', 'jetpack-premium-analytics-pkg' ) }
							</Dialog.Action>
							<Button
								variant="solid"
								size="compact"
								disabled={ readiness === undefined }
								onClick={ submit }
							>
								{ __( 'Send feedback', 'jetpack-premium-analytics-pkg' ) }
							</Button>
						</Dialog.Footer>
					</>
				) }
			</Dialog.Popup>
		</Dialog.Root>
	);
}
