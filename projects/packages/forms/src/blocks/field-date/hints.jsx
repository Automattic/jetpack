import { getDateFormatHint } from '../shared/util/constants.js';

/**
 * The date format, rendered below the field's input.
 *
 * Mirrors Contact_Form_Field::get_description_parts() in
 * class-contact-form-field.php — keep the class names in sync. Two things the
 * server does that the editor does not: it also emits a visually-hidden
 * instruction for reaching the picker, which has no meaning in the canvas, and
 * for inset-label styles it hoists this markup outside the field wrapper. The
 * editor gets the same visual result from the .jetpack-field__control wrapper.
 *
 * @param {object} props            - Component props.
 * @param {string} props.dateFormat - A DATE_FORMATS value, e.g. 'mm/dd/yy'.
 * @return {Element|null} The hint, or null for an unknown format.
 */
const DateFieldHints = ( { dateFormat } ) => {
	const formatHint = getDateFormatHint( dateFormat );

	if ( ! formatHint ) {
		return null;
	}

	return (
		<div className="contact-form__field-hints">
			<span className="contact-form__field-format">{ formatHint }</span>
		</div>
	);
};

export default DateFieldHints;
