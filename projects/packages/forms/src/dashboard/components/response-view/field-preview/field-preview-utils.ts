/**
 * Internal dependencies
 */
import type { FieldType } from '../../../../types/index.ts';

export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Maps default field label prefixes to their corresponding FieldType.
 * Used to infer the field type for legacy responses that don't have a type defined.
 * Labels are stored in lowercase for case-insensitive matching.
 * Order matters: more specific labels should come before generic ones.
 */
export const FIELD_TYPE_LABEL_PREFIXES: Array< [ string, FieldType ] > = [
	// Contact info fields
	[ 'first name', 'name' ],
	[ 'last name', 'name' ],
	[ 'name', 'name' ],
	[ 'email', 'email' ],
	[ 'phone', 'telephone' ],
	[ 'website', 'url' ],

	// Basic fields
	[ 'text', 'text' ],
	[ 'message', 'textarea' ],
	[ 'number', 'number' ],

	// Choice fields
	[ 'dropdown', 'select' ],
	[ 'choose one option', 'radio' ],
	[ 'choose several options', 'checkbox-multiple' ],

	// Advanced fields
	[ 'date', 'date' ],
	[ 'time', 'time' ],
	[ 'upload a file', 'file' ],
	[ 'slider', 'slider' ],
	[ 'rating', 'rating' ],

	// Consent field (partial match for long default label)
	[ 'by submitting your information', 'consent' ],
];

/**
 * Attempts to infer the field type from a label by matching against known default label prefixes.
 * This helps display correct icons for legacy responses that don't have a type defined.
 *
 * @param {string} label - The field label to match.
 * @return {FieldType | null} The inferred field type, or null if no match found.
 */
export const inferFieldTypeFromLabel = ( label: string ): FieldType | null => {
	const normalizedLabel = label.toLowerCase().replace( /:$/, '' ).trim();

	for ( const [ prefix, fieldType ] of FIELD_TYPE_LABEL_PREFIXES ) {
		if ( normalizedLabel.startsWith( prefix ) ) {
			return fieldType;
		}
	}

	return null;
};

/**
 * Extracts and renders the icon from a block definition.
 * Handles different icon formats: direct elements, functions, and nested src properties.
 *
 * @param {object} blockDef               - The block definition object.
 * @param {object} blockDef.settings      - The block settings object.
 * @param {object} blockDef.settings.icon - The icon object.
 * @return {React.ReactNode} The rendered icon element.
 */
export const getBlockIcon = ( blockDef: { settings: { icon: unknown } } ): React.ReactNode => {
	const { icon } = blockDef.settings;

	// Handle icon: { src: ... } structure
	if ( icon && typeof icon === 'object' && 'src' in icon ) {
		const src = ( icon as { src: unknown } ).src;
		// If src is a function (renderMaterialIcon returns a function), call it
		if ( typeof src === 'function' ) {
			return ( src as () => JSX.Element )();
		}
		// Otherwise it's already a React element
		return src as React.ReactNode;
	}

	// Handle icon directly being a function (e.g., field-number)
	if ( typeof icon === 'function' ) {
		return ( icon as () => JSX.Element )();
	}

	// Otherwise icon is already a React element
	return icon as React.ReactNode;
};
