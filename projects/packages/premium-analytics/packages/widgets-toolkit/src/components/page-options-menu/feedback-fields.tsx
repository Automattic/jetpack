/**
 * WordPress dependencies
 */
import { Stack, Text, TextareaControl } from '@jetpack-premium-analytics/externals';
import { RadioControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';

/** How ready the reader thinks the new tab is. The value is what reaches Tracks. */
export type StatsFeedbackReadiness = 'ready' | 'almost' | 'not_yet';

// Tracks drops an event whose properties are oversized, so a pasted essay would
// cost us the answer too.
const COMMENT_MAX_LENGTH = 1000;

/**
 * The readiness answers, readiest first. `value` is what reaches Tracks.
 *
 * @return The options, in the order they are offered.
 */
function readinessOptions(): { value: StatsFeedbackReadiness; label: string }[] {
	return [
		{
			value: 'ready',
			label: __( "Yes, I'd be happy to switch now", 'jetpack-premium-analytics-pkg' ),
		},
		{
			value: 'almost',
			label: __( 'Almost — there are a few things missing', 'jetpack-premium-analytics-pkg' ),
		},
		{ value: 'not_yet', label: __( 'Not yet', 'jetpack-premium-analytics-pkg' ) },
	];
}

/**
 * The reader's readiness answer as Happiness reads it in the ticket body.
 *
 * Untranslated on purpose: this is triage copy, like the product name, not reader copy.
 *
 * Bracketed, not newline separated: the endpoint runs the message through
 * `sanitize_text_field`, which collapses every run of whitespace to one space.
 *
 * @param readiness - The answer the reader picked.
 * @return The question and its answer as one line.
 */
export function readinessSummary( readiness: StatsFeedbackReadiness ) {
	const answers: Record< StatsFeedbackReadiness, string > = {
		ready: 'Yes, ready to switch now',
		almost: 'Almost, a few things missing',
		not_yet: 'Not yet',
	};

	return `[Ready to replace the old Traffic tab? ${ answers[ readiness ] }]`;
}

/**
 * The question above a control whose own label is hidden.
 *
 * Kept out of the accessibility tree so the control's accessible name is not read twice; the
 * label slot itself is an 11px uppercase caption, which a sentence-long question reads badly as.
 *
 * @param {object} props          - Component props.
 * @param {string} props.children - The question.
 * @return The question.
 */
function Question( { children }: { children: string } ) {
	return <Text aria-hidden="true">{ children }</Text>;
}

type CommentFieldProps = {
	question: string;
	comment: string;
	onCommentChange: ( comment: string ) => void;
};

/**
 * The open question every feedback surface ends on.
 *
 * @param {CommentFieldProps} props                 - Component props.
 * @param {string}            props.question        - The question above the box.
 * @param {string}            props.comment         - The comment as typed.
 * @param {Function}          props.onCommentChange - Called with the comment as typed.
 * @return The field.
 */
function CommentField( { question, comment, onCommentChange }: CommentFieldProps ) {
	return (
		<Stack direction="column" gap="sm">
			<Question>{ question }</Question>
			<TextareaControl
				hideLabelFromVision
				label={ question }
				value={ comment }
				maxLength={ COMMENT_MAX_LENGTH }
				onValueChange={ onCommentChange }
			/>
		</Stack>
	);
}

type ReadinessFieldsProps = {
	readiness: StatsFeedbackReadiness | undefined;
	onReadinessChange: ( readiness: StatsFeedbackReadiness ) => void;
	comment: string;
	onCommentChange: ( comment: string ) => void;
	question?: string;
};

/**
 * The readiness question and the open question that follows it.
 *
 * @param {ReadinessFieldsProps} props                   - Component props.
 * @param {string|undefined}     props.readiness         - The answer picked, if any.
 * @param {Function}             props.onReadinessChange - Called with the answer picked.
 * @param {string}               props.comment           - The comment as typed.
 * @param {Function}             props.onCommentChange   - Called with the comment as typed.
 * @param {string}               props.question          - The readiness question, if the surface words it its own way.
 * @return The two fields.
 */
export function ReadinessFields( {
	readiness,
	onReadinessChange,
	comment,
	onCommentChange,
	question,
}: ReadinessFieldsProps ) {
	const readinessQuestion =
		question ??
		__( 'Is the new Traffic tab ready to replace the old one?', 'jetpack-premium-analytics-pkg' );

	// "What's missing?" reads oddly after "Yes", where nothing is missing by definition.
	const commentQuestion =
		readiness === 'ready'
			? __( "Any other feedback you'd like to share?", 'jetpack-premium-analytics-pkg' )
			: __( "What's missing?", 'jetpack-premium-analytics-pkg' );

	const selectReadiness = useCallback(
		( value: string ) => onReadinessChange( value as StatsFeedbackReadiness ),
		[ onReadinessChange ]
	);

	return (
		<>
			<Stack direction="column" gap="sm">
				<Question>{ readinessQuestion }</Question>
				<RadioControl
					hideLabelFromVision
					label={ readinessQuestion }
					options={ readinessOptions() }
					selected={ readiness }
					onChange={ selectReadiness }
				/>
			</Stack>

			<CommentField
				question={ commentQuestion }
				comment={ comment }
				onCommentChange={ onCommentChange }
			/>
		</>
	);
}
