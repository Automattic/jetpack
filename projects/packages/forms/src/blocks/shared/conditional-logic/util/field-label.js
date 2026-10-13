import { __, sprintf } from '@wordpress/i18n';

/**
 * How a subject field is named wherever a rule refers to it.
 *
 * The block type comes along in brackets — `Name (Name field)` — because a field's label is
 * not reliably distinguishing: most carry no explicit id, several may share a label, and one
 * with no label at all falls back to "Untitled field". The type is what tells them apart.
 *
 * Shared by the subject dropdown and the inspector summary so the same field cannot be named
 * two different ways in the same panel.
 *
 * @param {object} field - Subject field descriptor, from useSubjectFields.
 * @return {string} The field's label, with its block type when there is one.
 */
export const getFieldDisplayName = field => {
	const label = field?.label || '';

	if ( ! field?.typeLabel ) {
		return label;
	}

	return sprintf(
		/* translators: 1: form field label, 2: the field's type, e.g. "Dropdown field" */
		__( '%1$s (%2$s)', 'jetpack-forms' ),
		label,
		field.typeLabel
	);
};
