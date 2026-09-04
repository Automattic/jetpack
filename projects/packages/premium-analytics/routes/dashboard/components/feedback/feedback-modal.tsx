/**
 * WordPress dependencies
 */
import { submitStatsUserFeedback, type StatsFeedbackRating } from '@jetpack-premium-analytics/data';
import {
	Button,
	Dialog,
	Notice,
	Stack,
	Text,
	TextareaControl,
} from '@jetpack-premium-analytics/externals';
import { RadioControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';

// Tracks drops an event whose properties are oversized, so a pasted essay would
// cost us the rating too.
const COMMENT_MAX_LENGTH = 1000;

// Reaches Happiness as the subject line of the feedback email ("Feedback received
// from …"), so it has to name the surface without any further context.
const PRODUCT_NAME = 'Jetpack Stats v2';

/**
 * The comparison scale, worst to best. `value` is the score that reaches Tracks.
 *
 * @return The options, in scale order.
 */
function ratingOptions() {
	return [
		{ value: '1', label: __( 'Much worse', 'jetpack-premium-analytics-pkg' ) },
		{ value: '2', label: __( 'A bit worse', 'jetpack-premium-analytics-pkg' ) },
		{ value: '3', label: __( 'About the same', 'jetpack-premium-analytics-pkg' ) },
		{ value: '4', label: __( 'A bit better', 'jetpack-premium-analytics-pkg' ) },
		{ value: '5', label: __( 'Much better', 'jetpack-premium-analytics-pkg' ) },
	];
}

/**
 * The question above a control whose own label is hidden.
 *
 * The control keeps the question as its accessible name, so this copy is for the
 * eye only and stays out of the accessibility tree rather than being read twice.
 * The label slot itself is an 11px uppercase caption, which a sentence-long
 * question reads badly as.
 *
 * @param {object} props          - Component props.
 * @param {string} props.children - The question.
 * @return The question.
 */
function Question( { children }: { children: string } ) {
	return <Text aria-hidden="true">{ children }</Text>;
}

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

	const comparisonQuestion = __(
		'Compared with the existing Traffic tab in Stats, the new Traffic tab is:',
		'jetpack-premium-analytics-pkg'
	);
	const blockerQuestion = __(
		"What's the one thing we'd need to fix before this replaces the old Stats?",
		'jetpack-premium-analytics-pkg'
	);

	const selectRating = useCallback(
		( value: string ) => setRating( Number( value ) as StatsFeedbackRating ),
		[]
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
		<Dialog.Root open onOpenChange={ isOpen => ! isOpen && onClose() }>
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
								<Notice.Description>
									{ __( 'Thank you. This helps.', 'jetpack-premium-analytics-pkg' ) }
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
								<Stack direction="column" gap="sm">
									<Question>{ comparisonQuestion }</Question>
									<RadioControl
										hideLabelFromVision
										label={ comparisonQuestion }
										options={ ratingOptions() }
										selected={ rating === null ? undefined : String( rating ) }
										onChange={ selectRating }
									/>
								</Stack>

								<Stack direction="column" gap="sm">
									<Question>{ blockerQuestion }</Question>
									<TextareaControl
										hideLabelFromVision
										label={ blockerQuestion }
										value={ comment }
										maxLength={ COMMENT_MAX_LENGTH }
										onValueChange={ value => setComment( value ) }
									/>
								</Stack>
							</Stack>
						</Dialog.Content>

						<Dialog.Footer>
							<Dialog.Action variant="minimal" size="compact">
								{ __( 'Cancel', 'jetpack-premium-analytics-pkg' ) }
							</Dialog.Action>
							<Button
								variant="solid"
								size="compact"
								disabled={ rating === null }
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
