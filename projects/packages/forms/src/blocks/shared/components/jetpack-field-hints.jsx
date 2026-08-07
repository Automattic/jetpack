import { getDateFormatHint } from '../util/constants.js';

/**
 * Renders a field's advisory text below its input: the author's help text
 * first, then the date format instruction.
 *
 * This mirrors Contact_Form_Field::get_field_descriptions() in
 * class-contact-form-field.php — keep the class names and ordering in sync.
 *
 * @param {object}  props             - Component props.
 * @param {object}  props.attributes  - The field block's attributes.
 * @param {boolean} props.isDateField - Whether to render the date format hint.
 * @return {Element|null} The hints, or null when there are none.
 */
const JetpackFieldHints = ( { attributes, isDateField = false } ) => {
	const helpText = attributes?.helpText?.trim() || null;
	const formatHint = isDateField ? getDateFormatHint( attributes?.dateFormat ) : null;

	if ( ! helpText && ! formatHint ) {
		return null;
	}

	return (
		<>
			{ helpText && <p className="contact-form__field-help">{ helpText }</p> }
			{ formatHint && <p className="contact-form__field-format">{ formatHint }</p> }
		</>
	);
};

export default JetpackFieldHints;
