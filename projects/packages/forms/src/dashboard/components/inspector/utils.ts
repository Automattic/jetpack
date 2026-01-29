/**
 * Internal dependencies
 */
import { decodeEntities } from '@wordpress/html-entities';
import type { FormResponse, ResponseField } from '../../../types/index.ts';

/**
 * Returns a display name for a form response author.
 *
 * @param response - The form response.
 * @return The decoded display name, or 'Anonymous' if none available.
 */
export const getDisplayName = ( response: FormResponse ): string => {
	const { author_name, author_email, author_url, ip } = response;
	return decodeEntities( author_name || author_email || author_url || ip || 'Anonymous' );
};

/**
 * Checks if a value represents a file upload field (object with 'files' property).
 *
 * @param value - The value to check.
 * @return True if the value is a file upload field.
 */
export const isFileUploadField = ( value: unknown ): boolean => {
	return !! value && typeof value === 'object' && 'files' in value;
};

/**
 * Checks if a value represents an image-select field (object with type 'image-select').
 *
 * @param value - The value to check.
 * @return True if the value is an image-select field.
 */
export const isImageSelectField = ( value: unknown ): boolean => {
	return !! value && typeof value === 'object' && 'type' in value && value.type === 'image-select';
};

/**
 * Checks if a string value looks like a phone number (as opposed to a date or other numeric string).
 *
 * @param value - The value to check.
 * @return True if the value is likely a phone number.
 */
export const isLikelyPhoneNumber = ( value: unknown ): boolean => {
	if ( typeof value !== 'string' ) {
		return false;
	}

	const normalizedValue = value.trim();

	if ( ! /^[\d+\-\s().]+$/.test( normalizedValue ) ) {
		return false;
	}

	// Exclude common date formats to avoid false positives
	if ( /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test( normalizedValue ) ) {
		return false;
	}
	if ( /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test( normalizedValue ) ) {
		return false;
	}

	const digits = normalizedValue.replace( /\D/g, '' );
	if ( digits.length < 7 || digits.length > 15 ) {
		return false;
	}

	return true;
};

/**
 * Checks if a field object is in the new collection format (has label, value, and key properties).
 *
 * @param item - The item to check.
 * @return True if the item is a collection format field.
 */
export const isCollectionFormatField = ( item: unknown ): item is ResponseField => {
	return (
		item !== null && typeof item === 'object' && 'label' in item && 'value' in item && 'key' in item
	);
};

/**
 * Checks if response fields use the new collection format (array or object of ResponseField).
 * Handles both true arrays and objects with numeric keys (e.g. from PHP JSON encoding).
 *
 * @param fields - The response fields (array or record).
 * @return True if the fields are in the new collection format.
 */
export const isFieldsCollection = ( fields: FormResponse[ 'fields' ] ): boolean => {
	if ( Array.isArray( fields ) ) {
		if ( fields.length === 0 ) {
			return true;
		}

		return isCollectionFormatField( fields[ 0 ] );
	}

	if ( ! fields || typeof fields !== 'object' ) {
		return false;
	}

	const values = Object.values( fields );

	// If values.length is 0 we cannot determine if the fields are supposed to be in the new collection format.
	return values.length > 0 && isCollectionFormatField( values[ 0 ] );
};
