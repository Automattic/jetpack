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
import { EMAIL_REGEX, inferFieldTypeFromLabel, getBlockIcon } from './field-preview-utils.ts';
import type { ResponseField, FieldType, FileItem } from '../../../../types/index.ts';
import './style.scss';

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
	const typeClassName = `is-field-type-${ fieldType }`;

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
		<HStack
			alignment="topLeft"
			spacing="4"
			className={ `jp-forms__field-preview ${ typeClassName }` }
		>
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
