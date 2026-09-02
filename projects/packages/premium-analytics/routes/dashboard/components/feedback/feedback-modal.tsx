/**
 * WordPress dependencies
 */
import { Button, Fieldset, Notice, Stack } from '@jetpack-premium-analytics/externals';
import { Modal, TextareaControl } from '@wordpress/components';
import { useCallback, useId, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
/**
 * Types
 */
import type { KeyboardEvent } from 'react';

const RATINGS = [ 1, 2, 3, 4, 5 ] as const;

type Rating = ( typeof RATINGS )[ number ];

// Tracks drops an event whose properties are oversized, so a pasted essay would
// cost us the rating too.
const COMMENT_MAX_LENGTH = 1000;

const ARROW_STEPS: Record< string, number | undefined > = {
	ArrowLeft: -1,
	ArrowUp: -1,
	ArrowRight: 1,
	ArrowDown: 1,
};

/**
 * Label for every point of the scale, so nobody has to guess what a number means.
 *
 * @return The labels, keyed by rating.
 */
function ratingLabels(): Record< Rating, string > {
	return {
		1: __( 'Much worse', 'jetpack-premium-analytics-pkg' ),
		2: __( 'A bit worse', 'jetpack-premium-analytics-pkg' ),
		3: __( 'About the same', 'jetpack-premium-analytics-pkg' ),
		4: __( 'A bit better', 'jetpack-premium-analytics-pkg' ),
		5: __( 'Much better', 'jetpack-premium-analytics-pkg' ),
	};
}

type RatingButtonProps = {
	value: Rating;
	label: string;
	isSelected: boolean;
	isTabStop: boolean;
	onSelect: ( value: Rating ) => void;
};

/**
 * One point on the comparison scale.
 *
 * @param {RatingButtonProps} props            - Component props.
 * @param {number}            props.value      - The score this button records.
 * @param {string}            props.label      - What the score means, as the reader reads it.
 * @param {boolean}           props.isSelected - Whether it is the current answer.
 * @param {boolean}           props.isTabStop  - Whether it carries the scale's single tab stop.
 * @param {Function}          props.onSelect   - Called with `value` when pressed.
 * @return The button.
 */
function RatingButton( { value, label, isSelected, isTabStop, onSelect }: RatingButtonProps ) {
	const select = useCallback( () => onSelect( value ), [ onSelect, value ] );

	return (
		<Button
			role="radio"
			aria-checked={ isSelected }
			tabIndex={ isTabStop ? 0 : -1 }
			variant={ isSelected ? 'solid' : 'outline' }
			size="compact"
			onClick={ select }
		>
			{ label }
		</Button>
	);
}

type RatingScaleProps = {
	labelId: string;
	value: Rating | null;
	onChange: ( value: Rating ) => void;
};

/**
 * The five-point scale, as a radio group rather than five toggle buttons.
 *
 * @param {RatingScaleProps} props          - Component props.
 * @param {string}           props.labelId  - Id of the element naming the group.
 * @param {number}           props.value    - The current answer, or null.
 * @param {Function}         props.onChange - Called with the newly selected score.
 * @return The scale.
 */
function RatingScale( { labelId, value, onChange }: RatingScaleProps ) {
	const labels = ratingLabels();

	// Arrow keys move selection and focus together, which is what a radio group owes its
	// keyboard users; the roving tabindex keeps the whole scale to one tab stop.
	const onKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			const step = ARROW_STEPS[ event.key ];

			if ( ! step ) {
				return;
			}

			event.preventDefault();

			const current = value === null ? 0 : RATINGS.indexOf( value );
			const nextIndex = ( current + step + RATINGS.length ) % RATINGS.length;

			onChange( RATINGS[ nextIndex ] );
			event.currentTarget
				.querySelectorAll< HTMLButtonElement >( '[role="radio"]' )
				[ nextIndex ]?.focus();
		},
		[ onChange, value ]
	);

	// Stacked rather than in a row: the labels are too long to sit side by side in the modal.
	return (
		<Stack
			direction="column"
			align="stretch"
			gap="sm"
			role="radiogroup"
			aria-labelledby={ labelId }
			aria-orientation="vertical"
			onKeyDown={ onKeyDown }
		>
			{ RATINGS.map( ( score, index ) => (
				<RatingButton
					key={ score }
					value={ score }
					label={ labels[ score ] }
					isSelected={ value === score }
					isTabStop={ value === null ? index === 0 : value === score }
					onSelect={ onChange }
				/>
			) ) }
		</Stack>
	);
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
	const legendId = useId();
	const [ rating, setRating ] = useState< Rating | null >( null );
	const [ comment, setComment ] = useState( '' );
	const [ hasSubmitted, setHasSubmitted ] = useState( false );

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
							{ __( 'Thanks — your feedback is on its way.', 'jetpack-premium-analytics-pkg' ) }
						</Notice.Description>
					</Notice.Root>

					<Stack direction="row" gap="sm" justify="end">
						<Button variant="solid" size="compact" onClick={ onClose }>
							{ __( 'Done', 'jetpack-premium-analytics-pkg' ) }
						</Button>
					</Stack>
				</Stack>
			) : (
				<Stack direction="column" gap="lg">
					<Fieldset.Root>
						<Fieldset.Legend id={ legendId }>
							{ __(
								'Compared with the existing Traffic tab in Stats, the new Traffic tab is:',
								'jetpack-premium-analytics-pkg'
							) }
						</Fieldset.Legend>

						<RatingScale labelId={ legendId } value={ rating } onChange={ setRating } />
					</Fieldset.Root>

					<TextareaControl
						label={ __(
							"What's the one thing we'd need to fix before this replaces the old Stats?",
							'jetpack-premium-analytics-pkg'
						) }
						value={ comment }
						maxLength={ COMMENT_MAX_LENGTH }
						onChange={ setComment }
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
