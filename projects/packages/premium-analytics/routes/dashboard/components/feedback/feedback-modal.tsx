/**
 * WordPress dependencies
 */
import { Button, Notice, Stack, Text } from '@jetpack-premium-analytics/externals';
import { Modal, RadioControl, TextareaControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';

type Rating = 1 | 2 | 3 | 4 | 5;

// Tracks drops an event whose properties are oversized, so a pasted essay would
// cost us the rating too.
const COMMENT_MAX_LENGTH = 1000;

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
 * Comparison rating with an optional comment, recorded as a single Tracks event.
 *
 * @param {FeedbackModalProps} props         - Component props.
 * @param {Function}           props.onClose - Called once the reader dismisses the modal.
 * @return The modal.
 */
export function FeedbackModal( { onClose }: FeedbackModalProps ) {
	const trackEvent = useTrackEvent();
	const [ rating, setRating ] = useState< Rating | null >( null );
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
		( value: string ) => setRating( Number( value ) as Rating ),
		[]
	);

	const submit = useCallback( () => {
		if ( rating === null ) {
			return;
		}

		trackEvent( 'jetpack_premium_analytics_feedback_submit', {
			rating,
			comment: comment.trim(),
		} );

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
							onChange={ setComment }
						/>
					</Stack>

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
