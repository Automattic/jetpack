/**
 * Pure helper functions for form submission data formatting.
 * Extracted to allow testing without Interactivity API dependencies.
 */
import { getRatingDisplayValue } from '../field-rating/helpers.js';

/**
 * Adds a colon to the end of a label if it doesn't already end with a question mark.
 *
 * @param {string} label - The label to format.
 * @return {string|null} The formatted label or null if empty.
 */
export const maybeAddColonToLabel = label => {
	const formattedLabel = label ? label : null;

	if ( ! formattedLabel ) {
		return null;
	}
	// Special case for the Terms consent field block which has a period at the end of the text.
	return formattedLabel.endsWith( '?' )
		? formattedLabel
		: formattedLabel.replace( /[.:]$/, '' ) + ':';
};

/**
 * Transforms a field value for display purposes.
 *
 * @param {*} value - The field value to transform.
 * @return {*} The transformed value.
 */
export const maybeTransformValue = value => {
	// For image select fields, we want to show the perceived values, as the choices can be shuffled.
	if ( value?.type === 'image-select' ) {
		return value.choices
			.map( choice => {
				let transformedValue = choice.perceived;

				if ( choice.showLabels && choice.label != null && choice.label !== '' ) {
					transformedValue += ' - ' + choice.label;
				}

				return transformedValue;
			} )
			.join( ', ' );
	}

	// For URL fields, extract the URL text value.
	if ( value?.type === 'url' && value?.url ) {
		return value.url;
	}

	// For rating fields, return the displayValue (e.g., "3/5") for text fallback.
	const ratingDisplayValue = getRatingDisplayValue( value );
	if ( ratingDisplayValue ) {
		return ratingDisplayValue;
	}

	// For file upload fields, we want to show the file name and size
	if ( value?.name && value?.size ) {
		return value.name + ' (' + value.size + ')';
	}

	return value;
};

/**
 * Extracts image data from an image-select field value.
 *
 * @param {*} value - The field value.
 * @return {Array|null} Array of image objects or null.
 */
export const getImages = value => {
	if ( value?.type === 'image-select' ) {
		return value.choices.map( choice => {
			const letterCode = choice.perceived ?? '';
			const label =
				choice.showLabels && choice.label != null && choice.label !== '' ? choice.label : '';

			return {
				src: choice.image?.src ?? '',
				letterCode,
				label,
			};
		} );
	}

	return null;
};

/**
 * Extracts and normalizes URL from a URL field value.
 *
 * @param {*} value - The field value.
 * @return {string|null} The normalized URL or null.
 */
export const getUrl = value => {
	if ( value?.type === 'url' && value?.url ) {
		let url = value.url;

		// Prepend https:// if no protocol is specified.
		if ( ! /^https?:\/\//i.test( url ) ) {
			url = 'https://' + url;
		}

		return url;
	}

	return null;
};

/**
 * Whether a submitted value means the respondent ticked the box.
 *
 * An unticked box submits an empty value, and some stored responses use an explicit "No". The
 * ticked value is a translated string ("Yes"), so this tests for emptiness and the "no"
 * sentinel rather than matching "yes".
 *
 * Must agree with `Feedback_Field::is_checked_value()` in PHP, which renders the server-side
 * icon and summary for the same submission.
 *
 * @param {*} value - The submitted value.
 * @return {boolean} True when the box was ticked.
 */
export const isCheckedValue = value => {
	if ( Array.isArray( value ) ) {
		return value.length > 0;
	}
	if ( value === null || value === undefined ) {
		return false;
	}
	const normalized = String( value ).trim().toLowerCase();
	return normalized !== '' && normalized !== '0' && normalized !== 'no';
};

/**
 * The value a submitted field shows in the confirmation summary.
 *
 * An unticked checkbox submits nothing, so its value arrives empty and the summary drew the
 * field's label over a blank line -- which reads as a field that failed to record rather than
 * as the answer "no". The email renderer has always said "No" here, so this says it too.
 *
 * Mirrors `Contact_Form::get_submission_display_value()`, which renders the same summary
 * server-side; the two must agree or the value changes as the Interactivity API hydrates it.
 * The label is translated in PHP and passed through the module config, since a script module
 * carries no i18n dependency.
 *
 * @param {*}      value          - The submitted value.
 * @param {string} type           - The field type.
 * @param {string} uncheckedLabel - The localized label for an unticked checkbox.
 * @return {*} The value to display.
 */
export const getSubmissionDisplayValue = ( value, type, uncheckedLabel ) => {
	if ( 'checkbox' === type && ! isCheckedValue( value ) ) {
		return uncheckedLabel;
	}

	return maybeTransformValue( value );
};
