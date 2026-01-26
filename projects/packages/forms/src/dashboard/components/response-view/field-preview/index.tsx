/**
 * External dependencies
 */
import { Badge } from '@automattic/ui';
import {
	ExternalLink,
	Icon,
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
import { EMAIL_REGEX, getIconSource, inferFieldTypeFromLabel } from './field-preview-utils.ts';
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
			return <Icon icon={ getIconSource( NameFieldBlock.settings.icon ) } />;
		case 'email':
			return <Icon icon={ getIconSource( EmailFieldBlock.settings.icon ) } />;
		case 'phone':
		case 'telephone':
			return <Icon icon={ getIconSource( TelephoneFieldBlock.settings.icon ) } />;
		case 'url':
			return <Icon icon={ getIconSource( UrlFieldBlock.settings.icon ) } />;
		case 'file':
			return <Icon icon={ getIconSource( FileFieldBlock.settings.icon ) } />;
		case 'image-select':
			return <Icon icon={ getIconSource( ImageSelectFieldBlock.settings.icon ) } />;
		case 'date':
			return <Icon icon={ getIconSource( DateFieldBlock.settings.icon ) } />;
		case 'time':
			return <Icon icon={ getIconSource( TimeFieldBlock.settings.icon ) } />;
		case 'hidden':
			return <Icon icon={ getIconSource( HiddenFieldBlock.settings.icon ) } />;
		case 'select':
			return <Icon icon={ getIconSource( SelectFieldBlock.settings.icon ) } />;
		case 'checkbox':
			return <Icon icon={ getIconSource( CheckboxFieldBlock.settings.icon ) } />;
		case 'checkbox-multiple':
			return <Icon icon={ getIconSource( MultipleChoiceFieldBlock.settings.icon ) } />;
		case 'radio':
			return <Icon icon={ getIconSource( SingleChoiceFieldBlock.settings.icon ) } />;
		case 'textarea':
			return <Icon icon={ getIconSource( TextareaFieldBlock.settings.icon ) } />;
		case 'number':
			return <Icon icon={ getIconSource( NumberFieldBlock.settings.icon ) } />;
		case 'slider':
		case 'range':
			return <Icon icon={ getIconSource( SliderFieldBlock.settings.icon ) } />;
		case 'rating':
			return <Icon icon={ getIconSource( RatingFieldBlock.settings.icon ) } />;
		case 'consent':
			return <Icon icon={ getIconSource( ConsentFieldBlock.settings.icon ) } />;
		case 'text':
		default:
			return <Icon icon={ getIconSource( TextFieldBlock.settings.icon ) } />;
	}
};

type FieldPreviewProps = {
	field: ResponseField;
	onFilePreview: ( file: FileItem ) => () => void;
};

const FieldPreview = ( { field, onFilePreview }: FieldPreviewProps ) => {
	const { label, value, type } = field;
	// For legacy responses without a proper type (undefined or "basic"), try to infer from label
	const fieldType: FieldType =
		type && type !== 'basic' ? type : inferFieldTypeFromLabel( label ) ?? 'text';
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

		if ( fieldType === 'checkbox-multiple' && Array.isArray( value ) ) {
			return (
				<VStack spacing="2" alignment="topLeft">
					{ ( value as string[] ).map( ( item, index ) => (
						<Badge key={ index }>{ item }</Badge>
					) ) }
				</VStack>
			);
		}

		// Handle arrays (e.g., multiple choice selections but also anything else coming as array)
		if ( Array.isArray( value ) ) {
			return value.join( ', ' );
		}

		// Handle objects that aren't special types - convert to string representation
		if ( typeof value === 'object' ) {
			return JSON.stringify( value );
		}

		const stringValue = String( value );

		// Empty values are shown as a dash
		if ( stringValue.trim() === '' ) {
			return '-';
		}

		// These fields carry a single string as value and
		// design option is to show a badge with the value
		const badgedValueFields = [ 'consent', 'checkbox', 'radio', 'select' ];
		if ( badgedValueFields.includes( fieldType ) ) {
			return <Badge>{ stringValue }</Badge>;
		}

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

	const renderLabel = () => {
		// If the label ends with a colon or question mark,
		// return it as is to avoid adding a colon or question mark
		if ( label.endsWith( ':' ) || label.endsWith( '?' ) ) {
			return label;
		}

		if ( fieldType === 'consent' && label.endsWith( '.' ) ) {
			return `${ label.slice( 0, -1 ) }:`;
		}

		// Default to adding a colon to the label
		return `${ label }:`;
	};

	return (
		<HStack
			alignment="topLeft"
			spacing="4"
			className={ `jp-forms__field-preview ${ typeClassName }` }
		>
			<div className="jp-forms__field-preview-icon">{ icon }</div>
			<VStack spacing="0" className="jp-forms__field-preview-content">
				<div className="jp-forms__field-preview-label">{ renderLabel() }</div>
				<div className="jp-forms__field-preview-value">{ renderFieldValue() }</div>
			</VStack>
		</HStack>
	);
};

export default FieldPreview;
