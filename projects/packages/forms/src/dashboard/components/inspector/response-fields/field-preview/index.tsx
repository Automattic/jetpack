/**
 * External dependencies
 */
import { formatNumber } from '@automattic/number-formatters';
import {
	ExternalLink,
	Icon,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { applyFilters } from '@wordpress/hooks';
import { Badge } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import FieldEmail from '../field-email/index.tsx';
import FieldFile from '../field-file/index.tsx';
import { fieldIcons } from '../field-icons.tsx';
import FieldImageSelect from '../field-image-select/index.tsx';
import FieldPhone from '../field-phone/index.tsx';
import FieldRating from '../field-rating/index.tsx';
import { EMAIL_REGEX, inferFieldTypeFromLabel } from './field-preview-utils.ts';
import type { ResponseField, FieldType, FileItem } from '../../../../../types/index.ts';
import './style.scss';

const getFieldIcon = ( fieldType: FieldType ): React.ReactNode => {
	/**
	 * Filter to allow custom field icons.
	 *
	 * @param {JSX.Element|null} icon      - The icon element, or null for default.
	 * @param {string}           fieldType - The field type.
	 * @return {JSX.Element|null} The icon element or null.
	 */
	const customIcon = applyFilters(
		'jetpack.forms.dashboard.fieldIcon',
		null,
		fieldType
	) as JSX.Element | null;

	if ( customIcon ) {
		return customIcon;
	}

	return <Icon icon={ fieldIcons[ fieldType as keyof typeof fieldIcons ] ?? fieldIcons.text } />;
};

const BADGED_VALUE_FIELDS: FieldType[] = [ 'consent', 'checkbox', 'radio', 'select' ];

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
		/**
		 * Filter to allow custom field value rendering.
		 *
		 * External plugins can use this filter to provide custom rendering
		 * for their field types. Return a React element to override the default rendering,
		 * or null/undefined to use the default.
		 *
		 * @param {React.ReactNode|null} element   - The custom element, or null for default.
		 * @param {string}               fieldType - The field type.
		 * @param {unknown}              value     - The field value.
		 * @param {ResponseField}        field     - The full field object.
		 * @return {React.ReactNode|null} The custom element or null.
		 */
		const customRender = applyFilters(
			'jetpack.forms.dashboard.fieldValue',
			null,
			fieldType,
			value,
			field
		) as React.ReactNode | null;

		if ( customRender !== null && customRender !== undefined ) {
			return customRender;
		}

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
						<Badge intent="draft" key={ index }>
							{ item }
						</Badge>
					) ) }
				</VStack>
			);
		}

		if ( value === null || value === undefined ) {
			return '-';
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

		if ( BADGED_VALUE_FIELDS.includes( fieldType ) ) {
			return <Badge intent="draft">{ stringValue }</Badge>;
		}

		// Numbers
		if ( fieldType === 'number' ) {
			return formatNumber( Number( stringValue ) );
		}

		// Emails
		if ( fieldType === 'email' && EMAIL_REGEX.test( stringValue ) ) {
			return <FieldEmail email={ stringValue } />;
		}

		// Phone numbers
		if ( fieldType === 'phone' || fieldType === 'telephone' ) {
			return <FieldPhone phone={ stringValue } />;
		}

		if ( fieldType === 'url' && /^https?:\/\//.test( stringValue ) ) {
			return <ExternalLink href={ stringValue }>{ stringValue }</ExternalLink>;
		}

		if ( fieldType === 'rating' ) {
			return <FieldRating value={ stringValue } />;
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
				{ label && <div className="jp-forms__field-preview-label">{ label }</div> }
				<div className="jp-forms__field-preview-value">{ renderFieldValue() }</div>
			</VStack>
		</HStack>
	);
};

export default FieldPreview;
