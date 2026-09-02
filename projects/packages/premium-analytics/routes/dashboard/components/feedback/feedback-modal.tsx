/**
 * WordPress dependencies
 */
import { Button, Fieldset, Stack } from '@jetpack-premium-analytics/externals';
import { Modal, TextareaControl } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';

const RATINGS = [ 1, 2, 3, 4, 5 ] as const;

// Tracks drops an event whose properties are oversized, so a pasted essay would
// cost us the rating too.
const COMMENT_MAX_LENGTH = 1000;

type RatingButtonProps = {
	value: number;
	isSelected: boolean;
	onSelect: ( value: number ) => void;
};

/**
 * One point on the ease-of-use scale.
 *
 * @param {RatingButtonProps} props            - Component props.
 * @param {number}            props.value      - The score this button records.
 * @param {boolean}           props.isSelected - Whether it is the current answer.
 * @param {Function}          props.onSelect   - Called with `value` when pressed.
 * @return The button.
 */
function RatingButton( { value, isSelected, onSelect }: RatingButtonProps ) {
	const select = useCallback( () => onSelect( value ), [ onSelect, value ] );

	return (
		<Button
			variant={ isSelected ? 'solid' : 'outline' }
			size="compact"
			aria-pressed={ isSelected }
			onClick={ select }
		>
			{ value }
		</Button>
	);
}

type FeedbackModalProps = {
	onClose: () => void;
};

/**
 * Ease-of-use rating with an optional comment, recorded as a single Tracks event.
 *
 * @param {FeedbackModalProps} props         - Component props.
 * @param {Function}           props.onClose - Called once the reader submits or dismisses.
 * @return The modal.
 */
export function FeedbackModal( { onClose }: FeedbackModalProps ) {
	const trackEvent = useTrackEvent();
	const [ rating, setRating ] = useState< number | null >( null );
	const [ comment, setComment ] = useState( '' );

	const submit = useCallback( () => {
		trackEvent( 'jetpack_premium_analytics_feedback_submit', {
			rating,
			comment: comment.trim().slice( 0, COMMENT_MAX_LENGTH ),
		} );

		onClose();
	}, [ comment, onClose, rating, trackEvent ] );

	return (
		<Modal
			title={ __( 'Share your feedback', 'jetpack-premium-analytics-pkg' ) }
			onRequestClose={ onClose }
			size="medium"
		>
			<Stack direction="column" gap="lg">
				<Fieldset.Root>
					<Fieldset.Legend>
						{ __( 'How easy is the new Stats to use?', 'jetpack-premium-analytics-pkg' ) }
					</Fieldset.Legend>
					<Fieldset.Description>
						{ __( '1 is very hard, 5 is very easy.', 'jetpack-premium-analytics-pkg' ) }
					</Fieldset.Description>

					<Stack direction="row" gap="sm">
						{ RATINGS.map( value => (
							<RatingButton
								key={ value }
								value={ value }
								isSelected={ rating === value }
								onSelect={ setRating }
							/>
						) ) }
					</Stack>
				</Fieldset.Root>

				<TextareaControl
					label={ __( 'What would you change?', 'jetpack-premium-analytics-pkg' ) }
					value={ comment }
					maxLength={ COMMENT_MAX_LENGTH }
					onChange={ setComment }
				/>

				<Stack direction="row" gap="sm" align="end" justify="end">
					<Button variant="minimal" size="compact" onClick={ onClose }>
						{ __( 'Cancel', 'jetpack-premium-analytics-pkg' ) }
					</Button>
					<Button variant="solid" size="compact" disabled={ rating === null } onClick={ submit }>
						{ __( 'Send feedback', 'jetpack-premium-analytics-pkg' ) }
					</Button>
				</Stack>
			</Stack>
		</Modal>
	);
}
