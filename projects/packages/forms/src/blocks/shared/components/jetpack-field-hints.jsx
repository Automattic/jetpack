import { getDateFormatHint } from '../util/constants.js';

/**
 * Renders a field's advisory text on one line below its input: the author's
 * help text first, then the date format.
 *
 * This mirrors Contact_Form_Field::get_field_descriptions() in
 * class-contact-form-field.php — keep the class names and ordering in sync.
 * The one difference is placement: for inset-label form styles PHP hoists this
 * markup outside the field wrapper, which the editor achieves instead by
 * scoping the label's positioning context to .jetpack-field__control.
 *
 * Spans, not paragraphs — themes style <p> and we would have to override them.
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
		<div className="contact-form__field-hints">
			{ helpText && <span className="contact-form__field-help">{ helpText }</span> }
			{ formatHint && <span className="contact-form__field-format">{ formatHint }</span> }
		</div>
	);
};

export default JetpackFieldHints;
