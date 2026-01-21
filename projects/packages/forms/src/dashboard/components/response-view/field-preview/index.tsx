/**
 * External dependencies
 */
import {
	Icon,
	Path,
	SVG,
	Line,
	Circle,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import {
	envelope,
	mobile,
	globe,
	upload,
	postDate,
	formatListBullets,
	check,
	image,
	starFilled,
} from '@wordpress/icons';
/**
 * Internal dependencies
 */
import FieldEmail from '../field-email/index.tsx';
import FieldFile from '../field-file/index.tsx';
import FieldImageSelect from '../field-image-select/index.tsx';
import type { ResponseField } from '../../../../types/index.ts';
import './style.scss';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Custom icons matching the block editor field icons
const NameIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M8.25 11.5C9.63071 11.5 10.75 10.3807 10.75 9C10.75 7.61929 9.63071 6.5 8.25 6.5C6.86929 6.5 5.75 7.61929 5.75 9C5.75 10.3807 6.86929 11.5 8.25 11.5ZM8.25 10C8.80228 10 9.25 9.55228 9.25 9C9.25 8.44772 8.80228 8 8.25 8C7.69772 8 7.25 8.44772 7.25 9C7.25 9.55228 7.69772 10 8.25 10ZM13 15.5V17.5H11.5V15.5C11.5 14.8096 10.9404 14.25 10.25 14.25H6.25C5.55964 14.25 5 14.8096 5 15.5V17.5H3.5V15.5C3.5 13.9812 4.73122 12.75 6.25 12.75H10.25C11.7688 12.75 13 13.9812 13 15.5ZM20.5 11H14.5V9.5H20.5V11ZM20.5 14.5H14.5V13H20.5V14.5Z" />
	</SVG>
);

const TextIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M12 7H4V8.5H12V7ZM19.75 17.25V10.75H4.25V17.25H19.75ZM5.75 15.75V12.25H18.25V15.75H5.75Z" />
	</SVG>
);

const TextareaIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M20 5H4V6.5H20V5ZM5.5 11.5H18.5V18.5H5.5V11.5ZM20 20V10H4V20H20Z" />
	</SVG>
);

const ConsentIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M7 5.5H17C17.2761 5.5 17.5 5.72386 17.5 6V13H19V6C19 4.89543 18.1046 4 17 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H11.5V18.5H7C6.72386 18.5 6.5 18.2761 6.5 18V6C6.5 5.72386 6.72386 5.5 7 5.5ZM16 7.75H8V9.25H16V7.75ZM8 11H13V12.5H8V11Z" />
		<Path d="M20.1087 15.9382L15.9826 21.6689L12.959 18.5194L14.0411 17.4806L15.8175 19.331L18.8914 15.0618L20.1087 15.9382Z" />
	</SVG>
);

const SliderIcon = () => (
	<SVG width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" />
		<Circle cx="12" cy="12" r="2" fill="currentColor" />
	</SVG>
);

const CheckboxMultipleIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M7.0812 10.1419L10.6001 5.45005L9.40006 4.55005L6.91891 7.85824L5.53039 6.46972L4.46973 7.53038L7.0812 10.1419ZM12 8.5H20V7H12V8.5ZM12 17H20V15.5H12V17ZM8.5 14.5H5.5V17.5H8.5V14.5ZM5.5 13H8.5C9.32843 13 10 13.6716 10 14.5V17.5C10 18.3284 9.32843 19 8.5 19H5.5C4.67157 19 4 18.3284 4 17.5V14.5C4 13.6716 4.67157 13 5.5 13Z" />
	</SVG>
);

const RadioIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M4 7.75C4 9.40685 5.34315 10.75 7 10.75C8.65685 10.75 10 9.40685 10 7.75C10 6.09315 8.65685 4.75 7 4.75C5.34315 4.75 4 6.09315 4 7.75ZM20 8.5H12V7H20V8.5ZM20 17H12V15.5H20V17ZM7 17.75C6.17157 17.75 5.5 17.0784 5.5 16.25C5.5 15.4216 6.17157 14.75 7 14.75C7.82843 14.75 8.5 15.4216 8.5 16.25C8.5 17.0784 7.82843 17.75 7 17.75ZM4 16.25C4 17.9069 5.34315 19.25 7 19.25C8.65685 19.25 10 17.9069 10 16.25C10 14.5931 8.65685 13.25 7 13.25C5.34315 13.25 4 14.5931 4 16.25Z" />
	</SVG>
);

const NumberIcon = () => (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M12 7H4V8.5H12V7ZM19.75 17.25V10.75H4.25V17.25H19.75ZM5.75 15.75V12.25H18.25V15.75H5.75Z" />
	</SVG>
);

type FieldType =
	| 'name'
	| 'email'
	| 'phone'
	| 'telephone'
	| 'url'
	| 'file'
	| 'image-select'
	| 'date'
	| 'select'
	| 'checkbox'
	| 'checkbox-multiple'
	| 'radio'
	| 'textarea'
	| 'text'
	| 'number'
	| 'slider'
	| 'range'
	| 'rating'
	| 'consent';

type FileItem = {
	file_id: number;
	name: string;
	url: string;
	size: string;
	type?: string;
	is_previewable?: boolean;
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
			return <NameIcon />;
		case 'email':
			return <Icon icon={ envelope } />;
		case 'phone':
		case 'telephone':
			return <Icon icon={ mobile } />;
		case 'url':
			return <Icon icon={ globe } />;
		case 'file':
			return <Icon icon={ upload } />;
		case 'image-select':
			return <Icon icon={ image } />;
		case 'date':
			return <Icon icon={ postDate } />;
		case 'select':
			return <Icon icon={ formatListBullets } />;
		case 'checkbox':
			return <Icon icon={ check } />;
		case 'checkbox-multiple':
			return <CheckboxMultipleIcon />;
		case 'radio':
			return <RadioIcon />;
		case 'textarea':
			return <TextareaIcon />;
		case 'number':
			return <NumberIcon />;
		case 'slider':
		case 'range':
			return <SliderIcon />;
		case 'rating':
			return <Icon icon={ starFilled } />;
		case 'consent':
			return <ConsentIcon />;
		case 'text':
		default:
			return <TextIcon />;
	}
};

/**
 * Determines the effective field type, using the API type if available,
 * otherwise inferring from value or label.
 *
 * @param {ResponseField} field - The field object.
 * @return {FieldType} The determined field type.
 */
const getEffectiveFieldType = ( field: ResponseField ): FieldType => {
	const { type } = field;

	// Use the API-provided type if it's specific enough
	if ( type && type !== 'basic' ) {
		return type as FieldType;
	}

	// Default to text
	return 'text';
};

type FieldPreviewProps = {
	field: ResponseField;
	onFilePreview: ( file: FileItem ) => () => void;
};

const FieldPreview = ( { field, onFilePreview }: FieldPreviewProps ) => {
	const { label, value } = field;
	const fieldType = getEffectiveFieldType( field );
	const icon = getFieldIcon( fieldType );

	const renderFieldValue = () => {
		if ( field.type === 'image-select' ) {
			return (
				<FieldImageSelect
					choices={ ( value as { choices: unknown[] } ).choices }
					handleFilePreview={ onFilePreview }
				/>
			);
		}

		// File uploads
		if ( field.type === 'file' ) {
			return (
				<FieldFile
					files={ ( value as { files: FileItem[] } )?.files }
					handleFilePreview={ onFilePreview }
				/>
			);
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
		if ( EMAIL_REGEX.test( stringValue ) ) {
			return <FieldEmail email={ stringValue } />;
		}

		// Phone numbers
		if ( field.type === 'phone' || field.type === 'telephone' ) {
			return <a href={ `tel:${ stringValue }` }>{ stringValue }</a>;
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
