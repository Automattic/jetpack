/**
 * External dependencies
 */
import {
	ExternalLink,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
/**
 * Internal dependencies
 */
// Field block definitions - used to get consistent icons
import CheckboxFieldBlock from '../../../../blocks/field-checkbox/index.js';
import ConsentFieldBlock from '../../../../blocks/field-consent/index.js';
import DateFieldBlock from '../../../../blocks/field-date/index.js';
import EmailFieldBlock from '../../../../blocks/field-email/index.js';
import FileFieldBlock from '../../../../blocks/field-file/index.js';
import HiddenFieldBlock from '../../../../blocks/field-hidden/index.js';
import ImageSelectFieldBlock from '../../../../blocks/field-image-select/index.tsx';
import MultipleChoiceFieldBlock from '../../../../blocks/field-multiple-choice/index.js';
import NameFieldBlock from '../../../../blocks/field-name/index.js';
import NumberFieldBlock from '../../../../blocks/field-number/index.js';
import RatingFieldBlock from '../../../../blocks/field-rating/index.js';
import SelectFieldBlock from '../../../../blocks/field-select/index.js';
import SingleChoiceFieldBlock from '../../../../blocks/field-single-choice/index.js';
import SliderFieldBlock from '../../../../blocks/field-slider/index.js';
import TelephoneFieldBlock from '../../../../blocks/field-telephone/index.js';
import TextFieldBlock from '../../../../blocks/field-text/index.js';
import TextareaFieldBlock from '../../../../blocks/field-textarea/index.js';
import TimeFieldBlock from '../../../../blocks/field-time/index.js';
import UrlFieldBlock from '../../../../blocks/field-url/index.js';
import FieldEmail from '../field-email/index.tsx';
import FieldFile from '../field-file/index.tsx';
import FieldImageSelect from '../field-image-select/index.tsx';
import type { ResponseField, FieldType, FileItem } from '../../../../types/index.ts';
import './style.scss';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Maps default field label prefixes to their corresponding FieldType.
 * Used to infer the field type for legacy responses that don't have a type defined.
 * Labels are stored in lowercase for case-insensitive matching.
 * Order matters: more specific labels should come before generic ones.
 */
const FIELD_TYPE_LABEL_PREFIXES: Array< [ string, FieldType ] > = [
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
const inferFieldTypeFromLabel = ( label: string ): FieldType | null => {
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
const getBlockIcon = ( blockDef: { settings: { icon: unknown } } ): React.ReactNode => {
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

/**
 * Returns the appropriate icon for the field type.
 *
 * @param {FieldType} fieldType - The field type.
 * @return {React.ReactNode} The icon element.
 */
const getFieldIcon = ( fieldType: FieldType ): React.ReactNode => {
	switch ( fieldType ) {
		case 'name':
			return getBlockIcon( NameFieldBlock );
		case 'email':
			return getBlockIcon( EmailFieldBlock );
		case 'phone':
		case 'telephone':
			return getBlockIcon( TelephoneFieldBlock );
		case 'url':
			return getBlockIcon( UrlFieldBlock );
		case 'file':
			return getBlockIcon( FileFieldBlock );
		case 'image-select':
			return getBlockIcon( ImageSelectFieldBlock );
		case 'date':
			return getBlockIcon( DateFieldBlock );
		case 'time':
			return getBlockIcon( TimeFieldBlock );
		case 'hidden':
			return getBlockIcon( HiddenFieldBlock );
		case 'select':
			return getBlockIcon( SelectFieldBlock );
		case 'checkbox':
			return getBlockIcon( CheckboxFieldBlock );
		case 'checkbox-multiple':
			return getBlockIcon( MultipleChoiceFieldBlock );
		case 'radio':
			return getBlockIcon( SingleChoiceFieldBlock );
		case 'textarea':
			return getBlockIcon( TextareaFieldBlock );
		case 'number':
			return getBlockIcon( NumberFieldBlock );
		case 'slider':
		case 'range':
			return getBlockIcon( SliderFieldBlock );
		case 'rating':
			return getBlockIcon( RatingFieldBlock );
		case 'consent':
			return getBlockIcon( ConsentFieldBlock );
		case 'text':
		default:
			return getBlockIcon( TextFieldBlock );
	}
};

type FieldPreviewProps = {
	field: ResponseField;
	onFilePreview: ( file: FileItem ) => () => void;
};

const FieldPreview = ( { field, onFilePreview }: FieldPreviewProps ) => {
	const { label, value, type } = field;
	// For legacy responses without a proper type (undefined or "basic"), try to infer from label
	const hasValidType = type && type !== 'basic';
	const fieldType = hasValidType
		? ( type as FieldType )
		: inferFieldTypeFromLabel( label ) || 'text';
	const icon = getFieldIcon( fieldType );

	const renderFieldValue = () => {
		// Image select fields
		if ( fieldType === 'image-select' ) {
			const choices = ( value as { choices?: unknown[] } )?.choices;
			return <FieldImageSelect choices={ choices } handleFilePreview={ onFilePreview } />;
		}

		// File uploads
		if ( fieldType === 'file' ) {
			const files = ( value as { files?: FileItem[] } )?.files;
			return <FieldFile files={ files } handleFilePreview={ onFilePreview } />;
		}

		// Handle null/undefined
		if ( value === null || value === undefined ) {
			return '-';
		}

		// Handle arrays (e.g., multiple choice selections)
		if ( Array.isArray( value ) ) {
			return value.join( ', ' );
		}

		// Handle objects that aren't special types - convert to string representation
		if ( typeof value === 'object' ) {
			return JSON.stringify( value );
		}

		const stringValue = String( value );

		// Emails
		if ( fieldType === 'email' && EMAIL_REGEX.test( stringValue ) ) {
			return <FieldEmail email={ stringValue } />;
		}

		// Phone numbers
		if ( fieldType === 'phone' || fieldType === 'telephone' ) {
			return <a href={ `tel:${ stringValue }` }>{ stringValue }</a>;
		}

		if ( fieldType === 'url' && /^https?:\/\//.test( stringValue ) ) {
			return <ExternalLink href={ stringValue }>{ stringValue }</ExternalLink>;
		}

		return stringValue;
	};

	return (
		<HStack alignment="topLeft" spacing="4" className="jp-forms__field-preview">
			<div className="jp-forms__field-preview-icon">{ icon }</div>
			<VStack spacing="0" className="jp-forms__field-preview-content">
				<div className="jp-forms__field-preview-label">
					{ label.endsWith( '?' ) ? label : `${ label }:` }
				</div>
				<div className="jp-forms__field-preview-value">{ renderFieldValue() }</div>
			</VStack>
		</HStack>
	);
};

export default FieldPreview;
