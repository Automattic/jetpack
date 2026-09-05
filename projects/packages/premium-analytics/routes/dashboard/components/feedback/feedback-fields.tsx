/**
 * WordPress dependencies
 */
import { type StatsFeedbackRating } from '@jetpack-premium-analytics/data';
import { Stack, Text } from '@jetpack-premium-analytics/externals';
import { RadioControl, TextareaControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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

type FeedbackFieldsProps = {
	rating: StatsFeedbackRating | null;
	onRatingChange: ( rating: StatsFeedbackRating ) => void;
	comment: string;
	onCommentChange: ( comment: string ) => void;
	commentQuestion: string;
};

/**
 * The comparison scale and the comment box every feedback surface shares; each
 * surface asks its own open question under the scale.
 *
 * @param {FeedbackFieldsProps} props                 - Component props.
 * @param {number|null}         props.rating          - The score picked, or null.
 * @param {Function}            props.onRatingChange  - Called with the score picked.
 * @param {string}              props.comment         - The comment as typed.
 * @param {Function}            props.onCommentChange - Called with the comment as typed.
 * @param {string}              props.commentQuestion - The question above the comment box.
 * @return The two fields.
 */
export function FeedbackFields( {
	rating,
	onRatingChange,
	comment,
	onCommentChange,
	commentQuestion,
}: FeedbackFieldsProps ) {
	const comparisonQuestion = __(
		'Compared with the existing Traffic tab in Stats, the new Traffic tab is:',
		'jetpack-premium-analytics-pkg'
	);

	const selectRating = useCallback(
		( value: string ) => onRatingChange( Number( value ) as StatsFeedbackRating ),
		[ onRatingChange ]
	);

	return (
		<>
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
				<Question>{ commentQuestion }</Question>
				<TextareaControl
					hideLabelFromVision
					label={ commentQuestion }
					value={ comment }
					maxLength={ COMMENT_MAX_LENGTH }
					onChange={ onCommentChange }
				/>
			</Stack>
		</>
	);
}
