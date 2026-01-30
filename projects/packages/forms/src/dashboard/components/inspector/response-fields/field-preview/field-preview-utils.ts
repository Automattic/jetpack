/**
 * External dependencies
 */
import { Icon } from '@wordpress/components';
/**
 * Internal dependencies
 */
import type { FieldType } from '../../../../../types/index.ts';

export type BlockIcon = React.ComponentProps< typeof Icon >[ 'icon' ];

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
	[ 'can we send you an email from time to time', 'consent' ],
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
 * Extracts the icon source from a block's icon definition.
 * Block icons can be defined as { src: ... } or directly as a function/element.
 *
 * @param {unknown} icon - The block icon definition.
 * @return {BlockIcon} The icon source compatible with the Icon component.
 */
export const getIconSource = ( icon: unknown ): BlockIcon => {
	if ( icon && typeof icon === 'object' && 'src' in icon ) {
		return ( icon as { src: BlockIcon } ).src;
	}
	return icon as BlockIcon;
};
