import { getDateFormatHint } from '../util/constants.js';

/**
 * Renders a field's advisory text below its input.
 *
 * This mirrors Contact_Form_Field::get_field_descriptions() in
 * class-contact-form-field.php — keep the class names in sync. The one
 * difference is placement: for inset-label form styles PHP hoists this markup
 * outside the field wrapper, which the editor achieves instead by scoping the
 * label's positioning context to .jetpack-field__control.
 *
 * @param {object}  props             - Component props.
 * @param {object}  props.attributes  - The field block's attributes.
 * @param {boolean} props.isDateField - Whether to render the date format hint.
 * @return {Element|null} The hints, or null when there are none to show.
 */
const JetpackFieldHints = ( { attributes, isDateField = false } ) => {
	const formatHint = isDateField ? getDateFormatHint( attributes.dateFormat ) : null;

	if ( ! formatHint ) {
		return null;
	}

	return (
		<div className="contact-form__field-hints">
			<span className="contact-form__field-format">{ formatHint }</span>
		</div>
	);
};

export default JetpackFieldHints;
