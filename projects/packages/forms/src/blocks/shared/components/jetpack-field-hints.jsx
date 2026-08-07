import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
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
 * The help text is editable in place. Formats are disabled so the stored value
 * stays a plain string: PHP renders it with esc_html(), and it doubles as the
 * field's aria-describedby text, neither of which should carry markup. The
 * format hint is derived from dateFormat and is deliberately not editable.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.attributes    - The field block's attributes.
 * @param {Function} props.setAttributes - Setter for the field block's attributes.
 * @param {boolean}  props.isActive      - Whether the field or an inner block is selected.
 * @param {boolean}  props.isDateField   - Whether to render the date format hint.
 * @return {Element|null} The hints, or null when there are none to show.
 */
const JetpackFieldHints = ( {
	attributes,
	setAttributes,
	isActive = false,
	isDateField = false,
} ) => {
	const helpText = attributes?.helpText ?? '';
	const hasHelpText = helpText.trim() !== '';
	const formatHint = isDateField ? getDateFormatHint( attributes?.dateFormat ) : null;

	// Keep unselected, unfilled fields out of the canvas entirely.
	if ( ! hasHelpText && ! formatHint && ! isActive ) {
		return null;
	}

	return (
		<div className="contact-form__field-hints">
			{ ( hasHelpText || isActive ) && (
				<RichText
					tagName="span"
					className="contact-form__field-help"
					value={ helpText }
					// Undefined rather than '' so a cleared value leaves no trace
					// in the saved block markup.
					onChange={ value => setAttributes( { helpText: value || undefined } ) }
					placeholder={ __( 'Add help text…', 'jetpack-forms' ) }
					__unstableDisableFormats
					disableLineBreaks
				/>
			) }
			{ formatHint && <span className="contact-form__field-format">{ formatHint }</span> }
		</div>
	);
};

export default JetpackFieldHints;
