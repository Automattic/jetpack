import { __, sprintf } from '@wordpress/i18n';
import { getFieldDisplayName } from './field-label.js';
import { operatorNeedsValue } from './field-types.ts';
import { getOperatorLabel } from './operator-labels.ts';
import { isRuleComplete } from './rule-validity.js';

/**
 * The line introducing a field's conditions in the inspector.
 *
 * Four separate strings rather than one assembled from fragments: "shown"/"hidden" and
 * "all"/"any" do not slot into every language the same way, and a sentence built by
 * concatenation cannot be reordered by a translator.
 *
 * @param {object} logic - A normalized logic object.
 * @param {object} group - The group being described.
 * @return {string} A sentence ending in a colon.
 */
export const getSummaryHeading = ( logic, group ) => {
	const matchesAll = 'all' === group.logicalOperator;

	// The trailing 0 on one branch of each pair is deliberate, and matches how this is handled
	// elsewhere in the package: two identically shaped __() calls in a ternary get folded by
	// the production minifier into __( cond ? 'a' : 'b', domain ), whose msgid is no longer a
	// literal and so cannot be extracted for translation. It is ignored at runtime.
	if ( 'hide' === logic.action ) {
		return matchesAll
			? __( 'This field is hidden only if:', 'jetpack-forms' )
			: __( 'This field is hidden if any of these are true:', 'jetpack-forms', 0 );
	}

	return matchesAll
		? __( 'This field is shown only if:', 'jetpack-forms' )
		: __( 'This field is shown if any of these are true:', 'jetpack-forms', 0 );
};

/**
 * One condition, in the words the rule builder uses for it.
 *
 * Reads as the sentence the author built — subject, comparison, value — so the inspector says
 * what the field actually does rather than how many rules it has.
 *
 * @param {object} rule    - The rule to describe.
 * @param {object} subject - The rule's subject field descriptor.
 * @return {string} A phrase such as `Phone is “iPhone”`.
 */
export const describeRule = ( rule, subject ) => {
	// Named the same way the subject dropdown names it, type in brackets and all: a label on
	// its own does not always identify a field, and reading one name in the summary and
	// another in the builder would make them look like different fields.
	const label = getFieldDisplayName( subject );
	const operator = getOperatorLabel( rule.operator );

	// `is empty`, `is checked` and friends compare against nothing, so there is nothing to
	// quote after them.
	if ( ! operatorNeedsValue( rule.operator ) ) {
		return sprintf(
			/* translators: 1: form field label, 2: comparison, e.g. "is not empty" */
			__( '%1$s %2$s', 'jetpack-forms' ),
			label,
			operator
		);
	}

	return sprintf(
		/* translators: 1: form field label, 2: comparison, e.g. "is", 3: the value compared against */
		__( '%1$s %2$s “%3$s”', 'jetpack-forms' ),
		label,
		operator,
		String( rule.value ?? '' )
	);
};

/**
 * The conditions worth listing: the ones that will actually be acted on.
 *
 * An incomplete rule is skipped by both evaluators, so listing it in the summary would
 * describe behaviour the field does not have.
 *
 * A condition naming an id that more than one field claims is skipped too. It has the shape of
 * a working rule -- the id does resolve, to whichever field the renderer reaches first -- but it
 * cannot say which field the author meant, and the rule builder says as much. Leaving it out
 * here keeps the summary and the builder telling the same story about the same condition.
 *
 * @param {object} group               - The group being described.
 * @param {Array}  fields              - Subject field descriptors, from useSubjectFields.
 * @param {Set}    [duplicateFieldIds] - Ids claimed by more than one field in the form.
 * @return {Array} Objects of `{ rule, subject }` for each condition that will be acted on.
 */
export const getActiveConditions = ( group, fields, duplicateFieldIds ) =>
	group.rules
		.map( rule => ( {
			rule,
			subject: fields.find( field => field.id && field.id === rule.field ),
		} ) )
		.filter(
			( { rule, subject } ) =>
				isRuleComplete( rule, subject ) && ! duplicateFieldIds?.has( rule.field )
		);

/**
 * The same summary on one line, for somewhere a list will not fit.
 *
 * The toolbar button's tooltip, specifically. It says the same thing the inspector does so the
 * two cannot drift, just without the markup.
 *
 * @param {object} logic               - A normalized logic object.
 * @param {object} group               - The group being described.
 * @param {Array}  fields              - Subject field descriptors, from useSubjectFields.
 * @param {Set}    [duplicateFieldIds] - Ids claimed by more than one field in the form.
 * @return {string} A single-line summary, or an empty string when nothing is active.
 */
export const getSummaryText = ( logic, group, fields, duplicateFieldIds ) => {
	const active = getActiveConditions( group, fields, duplicateFieldIds );

	if ( ! active.length ) {
		return '';
	}

	return sprintf(
		/* translators: 1: heading ending in a colon, 2: the conditions, separated by semicolons */
		__( '%1$s %2$s', 'jetpack-forms' ),
		getSummaryHeading( logic, group ),
		active.map( ( { rule, subject } ) => describeRule( rule, subject ) ).join( '; ' )
	);
};
