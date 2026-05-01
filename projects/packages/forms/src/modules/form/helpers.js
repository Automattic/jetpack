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
