import { InnerBlocks, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Path, Rect, Icon } from '@wordpress/components';
import { select } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';
import { globe, envelope, mobile, upload, next } from '@wordpress/icons';
import { filter, isEmpty, map, startsWith, trim } from 'lodash';
import FormProgressIndicatorEdit from '../form-progress-indicator/edit';
import FormProgressIndicatorSave from '../form-progress-indicator/save';
import StepEdit from '../step/edit';
import StepSave from '../step/save';
import StepContainerEdit from '../step-container/edit';
import StepContainerSave from '../step-container/save';
import StepDividerEdit from '../step-divider/edit';
import StepNavigationEdit from '../step-navigation/edit';
import StepNavigationSave from '../step-navigation/save';
import JetpackField from './components/jetpack-field';
import JetpackFieldCheckbox from './components/jetpack-field-checkbox';
import JetpackFieldConsent from './components/jetpack-field-consent';
import JetpackDatePicker from './components/jetpack-field-datepicker';
import JetpackDropdown from './components/jetpack-field-dropdown';
import JetpackFieldFile from './components/jetpack-field-file';
import JetpackFieldMultipleChoice from './components/jetpack-field-multiple-choice';
import JetpackFieldMultipleChoiceItem from './components/jetpack-field-multiple-choice/item';
import JetpackFieldNumber from './components/jetpack-field-number';
import JetpackFieldSingleChoice from './components/jetpack-field-single-choice';
import JetpackFieldSingleChoiceItem from './components/jetpack-field-single-choice/item';
import JetpackFieldTextarea from './components/jetpack-field-textarea';
import { getIconColor } from './util/block-icons';
import { useFormWrapper } from './util/form';
import mergeSettings from './util/merge-settings';
import renderMaterialIcon from './util/render-material-icon';

const FieldDefaults = {
	apiVersion: 3,
	category: 'contact-form',
	supports: {
		reusable: false,
		html: false,
	},
	attributes: {
		label: {
			type: 'string',
			default: null,
			role: 'content',
		},
		required: {
			type: 'boolean',
			default: false,
		},
		requiredText: {
			type: 'string',
			role: 'content',
		},
		options: {
			type: 'array',
			default: [],
			role: 'content',
		},
		defaultValue: {
			type: 'string',
			default: '',
			role: 'content',
		},
		placeholder: {
			type: 'string',
			default: '',
			role: 'content',
		},
		id: {
			type: 'string',
			default: '',
		},
		width: {
			type: 'number',
			default: 100,
		},
		borderRadius: {
			type: 'number',
			default: '',
		},
		borderWidth: {
			type: 'number',
			default: '',
		},
		labelFontSize: {
			type: 'string',
		},
		fieldFontSize: {
			type: 'string',
		},
		lineHeight: {
			type: 'number',
		},
		labelLineHeight: {
			type: 'number',
		},
		inputColor: {
			type: 'string',
		},
		labelColor: {
			type: 'string',
		},
		fieldBackgroundColor: {
			type: 'string',
		},
		buttonBackgroundColor: {
			type: 'string',
		},
		buttonBorderRadius: {
			type: 'number',
			default: '',
		},
		buttonBorderWidth: {
			type: 'number',
			default: '',
		},
		borderColor: {
			type: 'string',
		},
		shareFieldAttributes: {
			type: 'boolean',
			default: true,
		},
	},
	transforms: {
		to: [
			{
				type: 'block',
				blocks: [ 'jetpack/field-number' ],
				transform: attributes => createBlock( 'jetpack/field-number', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-text' ],
				transform: attributes => createBlock( 'jetpack/field-text', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-name' ],
				transform: attributes => createBlock( 'jetpack/field-name', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-email' ],
				transform: attributes => createBlock( 'jetpack/field-email', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-url' ],
				transform: attributes => createBlock( 'jetpack/field-url', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-date' ],
				transform: attributes => createBlock( 'jetpack/field-date', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-telephone' ],
				transform: attributes => createBlock( 'jetpack/field-telephone', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-textarea' ],
				transform: attributes => createBlock( 'jetpack/field-textarea', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-checkbox-multiple' ],
				transform: ( attributes, innerBlocks ) => {
					let newInnerBlocks = [];

					if ( ! isEmpty( innerBlocks ) ) {
						const optionBlocks = filter( innerBlocks, ( { name } ) =>
							startsWith( name, 'jetpack/field-option' )
						);

						newInnerBlocks = map( optionBlocks, block =>
							createBlock( 'jetpack/field-option-checkbox', {
								label: block.attributes.label,
								fieldType: 'checkbox',
							} )
						);
					} else if ( attributes.options?.length ) {
						newInnerBlocks = map( attributes.options, option =>
							createBlock( 'jetpack/field-option-checkbox', {
								label: option,
								fieldType: 'checkbox',
							} )
						);
					}

					return createBlock( 'jetpack/field-checkbox-multiple', attributes, newInnerBlocks );
				},
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-radio' ],
				transform: ( attributes, innerBlocks ) => {
					let newInnerBlocks = [];

					if ( ! isEmpty( innerBlocks ) ) {
						const optionBlocks = filter( innerBlocks, ( { name } ) =>
							startsWith( name, 'jetpack/field-option' )
						);

						newInnerBlocks = map( optionBlocks, block =>
							createBlock( 'jetpack/field-option-radio', {
								label: block.attributes.label,
								fieldType: 'radio',
							} )
						);
					} else if ( attributes.options?.length ) {
						newInnerBlocks = map( attributes.options, option =>
							createBlock( 'jetpack/field-option-radio', {
								label: option,
								fieldType: 'radio',
							} )
						);
					}

					return createBlock( 'jetpack/field-radio', attributes, newInnerBlocks );
				},
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-select' ],
				transform: ( attributes, innerBlocks ) => {
					if ( ! isEmpty( innerBlocks ) ) {
						const optionBlocks = filter( innerBlocks, ( { name } ) =>
							startsWith( name, 'jetpack/field-option' )
						);
						attributes.options = map( optionBlocks, b => b.attributes.label );
					}

					attributes.options = attributes.options?.length ? attributes.options : [ '' ];
					return createBlock( 'jetpack/field-select', attributes );
				},
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-consent' ],
				transform: attributes => createBlock( 'jetpack/field-consent', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-checkbox' ],
				transform: attributes => createBlock( 'jetpack/field-checkbox', attributes ),
			},
		],
	},
	save: () => null,
	example: {},
};

// Storing in variables to avoid JS mangling breaking translation calls
const severalOptionsDefault = __( 'Choose several options', 'jetpack-forms' );
const oneOptionDefault = __( 'Choose one option', 'jetpack-forms' );

const multiFieldV1 = fieldType => ( {
	attributes: {
		...FieldDefaults.attributes,
		label: {
			type: 'string',
			default: fieldType === 'checkbox' ? severalOptionsDefault : oneOptionDefault,
		},
	},
	migrate: attributes => {
		const blockName = `jetpack/field-option-${ fieldType }`;
		const nonEmptyOptions = filter( attributes.options, o => ! isEmpty( trim( o ) ) );
		const newInnerBlocks = map( nonEmptyOptions, option =>
			createBlock( blockName, {
				label: option,
			} )
		);

		attributes.options = [];

		return [ attributes, newInnerBlocks ];
	},
	isEligible: attr => attr.options && filter( attr.options, o => ! isEmpty( trim( o ) ) ).length,
	save: () => null,
} );

const editField = type => props => {
	useFormWrapper( props );

	return (
		<JetpackField
			clientId={ props.clientId }
			type={ type }
			label={ props.attributes.label }
			required={ props.attributes.required }
			requiredText={ props.attributes.requiredText }
			setAttributes={ props.setAttributes }
			isSelected={ props.isSelected }
			defaultValue={ props.attributes.defaultValue }
			placeholder={ props.attributes.placeholder }
			id={ props.attributes.id }
			width={ props.attributes.width }
			attributes={ props.attributes }
			insertBlocksAfter={ props.insertBlocksAfter }
		/>
	);
};

const EditTextarea = props => {
	useFormWrapper( props );

	return (
		<JetpackFieldTextarea
			clientId={ props.clientId }
			label={ props.attributes.label }
			required={ props.attributes.required }
			requiredText={ props.attributes.requiredText }
			attributes={ props.attributes }
			setAttributes={ props.setAttributes }
			isSelected={ props.isSelected }
			defaultValue={ props.attributes.defaultValue }
			placeholder={ props.attributes.placeholder }
			id={ props.attributes.id }
			width={ props.attributes.width }
		/>
	);
};

const EditCheckbox = props => {
	useFormWrapper( props );

	return (
		<JetpackFieldCheckbox
			clientId={ props.clientId }
			label={ props.attributes.label } // label intentionally left blank
			required={ props.attributes.required }
			requiredText={ props.attributes.requiredText }
			setAttributes={ props.setAttributes }
			isSelected={ props.isSelected }
			defaultValue={ props.attributes.defaultValue }
			id={ props.attributes.id }
			width={ props.attributes.width }
			attributes={ props.attributes }
			insertBlocksAfter={ props.insertBlocksAfter }
		/>
	);
};

const EditConsent = ( {
	attributes,
	clientId,
	isSelected,
	name,
	setAttributes,
	insertBlocksAfter,
} ) => {
	useFormWrapper( { attributes, clientId, name } );

	const { id, width, consentType, implicitConsentMessage, explicitConsentMessage } = attributes;
	return (
		<JetpackFieldConsent
			clientId={ clientId }
			id={ id }
			isSelected={ isSelected }
			width={ width }
			consentType={ consentType }
			implicitConsentMessage={ implicitConsentMessage }
			explicitConsentMessage={ explicitConsentMessage }
			setAttributes={ setAttributes }
			attributes={ attributes }
			insertBlocksAfter={ insertBlocksAfter }
		/>
	);
};

const EditNumber = props => {
	useFormWrapper( props );

	return (
		<JetpackFieldNumber
			clientId={ props.clientId }
			label={ props.attributes.label }
			required={ props.attributes.required }
			requiredText={ props.attributes.requiredText }
			setAttributes={ props.setAttributes }
			isSelected={ props.isSelected }
			defaultValue={ props.attributes.defaultValue }
			placeholder={ props.attributes.placeholder }
			id={ props.attributes.id }
			width={ props.attributes.width }
			attributes={ props.attributes }
			insertBlocksAfter={ props.insertBlocksAfter }
			min={ props.attributes.min }
			max={ props.attributes.max }
		/>
	);
};

/**
 * Determines if the current block selection is within a contact form.
 *
 * @return {boolean} Whether the selection is within a contact form
 */
const isWithinContactForm = () => {
	const blockEditor = select( 'core/block-editor' );
	if ( ! blockEditor ) {
		return false;
	}

	const selectedBlockClientIds = blockEditor.getSelectedBlockClientIds();
	if ( ! selectedBlockClientIds?.length ) {
		return false;
	}

	return selectedBlockClientIds.some( blockId => {
		const parentBlocks = blockEditor.getBlockParentsByBlockName( blockId, 'jetpack/contact-form' );
		return parentBlocks.length > 0;
	} );
};

export const childBlocks = [
	{
		name: 'field-text',
		settings: {
			...FieldDefaults,
			title: __( 'Text Input Field', 'jetpack-forms' ),
			description: __( 'Collect short text responses from site visitors.', 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: renderMaterialIcon(
					<Path d="M12 7H4V8.5H12V7ZM19.75 17.25V10.75H4.25V17.25H19.75ZM5.75 15.75V12.25H18.25V15.75H5.75Z" />
				),
			},
			edit: editField( 'text' ),
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: __( 'Text', 'jetpack-forms' ),
					role: 'content',
				},
			},
		},
	},
	{
		name: 'field-number',
		settings: {
			...FieldDefaults,
			title: __( 'Number Input Field', 'jetpack-forms' ),
			description: __( 'Collect numbers from site visitors.', 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: renderMaterialIcon(
					<Path d="M12 7H4V8.5H12V7ZM19.75 17.25V10.75H4.25V17.25H19.75ZM5.75 15.75V12.25H18.25V15.75H5.75Z" />
				),
			},
			edit: EditNumber,
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: __( 'Number', 'jetpack-forms' ),
				},
				min: {
					type: 'number',
					default: '',
				},
				max: {
					type: 'number',
					default: '',
				},
			},
		},
	},
	{
		name: 'field-name',
		settings: {
			...FieldDefaults,
			title: __( 'Name Field', 'jetpack-forms' ),
			description: __( "Collect the site visitor's name.", 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: renderMaterialIcon(
					<Path d="M8.25 11.5C9.63071 11.5 10.75 10.3807 10.75 9C10.75 7.61929 9.63071 6.5 8.25 6.5C6.86929 6.5 5.75 7.61929 5.75 9C5.75 10.3807 6.86929 11.5 8.25 11.5ZM8.25 10C8.80228 10 9.25 9.55228 9.25 9C9.25 8.44772 8.80228 8 8.25 8C7.69772 8 7.25 8.44772 7.25 9C7.25 9.55228 7.69772 10 8.25 10ZM13 15.5V17.5H11.5V15.5C11.5 14.8096 10.9404 14.25 10.25 14.25H6.25C5.55964 14.25 5 14.8096 5 15.5V17.5H3.5V15.5C3.5 13.9812 4.73122 12.75 6.25 12.75H10.25C11.7688 12.75 13 13.9812 13 15.5ZM20.5 11H14.5V9.5H20.5V11ZM20.5 14.5H14.5V13H20.5V14.5Z" />
				),
			},
			edit: editField( 'text' ),
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: __( 'Name', 'jetpack-forms' ),
					role: 'content',
				},
			},
		},
	},
	{
		name: 'field-email',
		settings: {
			...FieldDefaults,
			title: __( 'Email Field', 'jetpack-forms' ),
			keywords: [ __( 'e-mail', 'jetpack-forms' ), __( 'mail', 'jetpack-forms' ), 'email' ],
			description: __( 'Collect email addresses from your visitors.', 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: <Icon icon={ envelope } />,
			},
			edit: editField( 'email' ),
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: __( 'Email', 'jetpack-forms' ),
					role: 'content',
				},
			},
		},
	},
	{
		name: 'field-url',
		settings: {
			...FieldDefaults,
			title: __( 'Website Field', 'jetpack-forms' ),
			keywords: [
				__( 'url', 'jetpack-forms' ),
				__( 'internet page', 'jetpack-forms' ),
				__( 'link', 'jetpack-forms' ),
				__( 'website', 'jetpack-forms' ),
			],
			description: __( 'Collect a website address from your site visitors.', 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: <Icon icon={ globe } />,
			},
			edit: editField( 'url' ),
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: __( 'Website', 'jetpack-forms' ),
					role: 'content',
				},
			},
		},
	},
	{
		name: 'field-date',
		settings: {
			...FieldDefaults,
			title: __( 'Date Picker', 'jetpack-forms' ),
			keywords: [
				__( 'Calendar', 'jetpack-forms' ),
				_x( 'day month year', 'block search term', 'jetpack-forms' ),
			],
			description: __( 'Capture date information with a date picker.', 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: renderMaterialIcon(
					<Path
						fillRule="evenodd"
						d="M4.5 7H19.5V19C19.5 19.2761 19.2761 19.5 19 19.5H5C4.72386 19.5 4.5 19.2761 4.5 19V7ZM3 5V7V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V7V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5ZM11 9.25H7V13.25H11V9.25Z"
					/>
				),
			},
			edit: JetpackDatePicker,
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: __( 'Date', 'jetpack-forms' ),
					role: 'content',
				},
				dateFormat: {
					type: 'string',
					default: 'yy-mm-dd',
				},
			},
		},
	},
	{
		name: 'field-telephone',
		settings: {
			...FieldDefaults,
			title: __( 'Phone Number Field', 'jetpack-forms' ),
			keywords: [
				__( 'Phone', 'jetpack-forms' ),
				__( 'Cellular phone', 'jetpack-forms' ),
				__( 'Mobile', 'jetpack-forms' ),
			],
			description: __( 'Collect phone numbers from site visitors.', 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: <Icon icon={ mobile } />,
			},
			edit: editField( 'tel' ),
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: 'Phone',
					role: 'content',
				},
			},
		},
	},
	{
		name: 'field-file',
		settings: {
			...FieldDefaults,
			title: __( 'File Upload Field', 'jetpack-forms' ),
			keywords: [
				__( 'File', 'jetpack-forms' ),
				__( 'Upload', 'jetpack-forms' ),
				__( 'Attachment', 'jetpack-forms' ),
			],
			description: __( 'Allow visitors to upload files through your form.', 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: <Icon icon={ upload } />,
			},
			edit: JetpackFieldFile,
			save: () => {
				const blockProps = useBlockProps.save();
				const innerBlocksProps = useInnerBlocksProps.save( {
					className: 'jetpack-form-file-field__content-wrap',
				} );
				return (
					<div { ...blockProps }>
						<div { ...innerBlocksProps } />
					</div>
				);
			},
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: __( 'Upload a file', 'jetpack-forms' ),
					role: 'content',
				},
				filetype: {
					type: 'string',
					default: '',
				},
			},
			isBeta: true,
		},
	},
	{
		name: 'field-textarea',
		settings: {
			...FieldDefaults,
			title: __( 'Multi-line Text Field', 'jetpack-forms' ),
			keywords: [
				__( 'Textarea', 'jetpack-forms' ),
				'textarea',
				__( 'Multiline text', 'jetpack-forms' ),
			],
			description: __( 'Capture longform text responses from site visitors.', 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: renderMaterialIcon(
					<Path d="M20 5H4V6.5H20V5ZM5.5 11.5H18.5V18.5H5.5V11.5ZM20 20V10H4V20H20Z" />
				),
			},
			edit: EditTextarea,
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: __( 'Message', 'jetpack-forms' ),
					role: 'content',
				},
			},
		},
	},
	{
		name: 'field-checkbox',
		settings: {
			...FieldDefaults,
			title: __( 'Checkbox', 'jetpack-forms' ),
			keywords: [ __( 'Confirm', 'jetpack-forms' ), __( 'Accept', 'jetpack-forms' ) ],
			description: __( 'Confirm or select information with a single checkbox.', 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: renderMaterialIcon(
					<Path
						fillRule="evenodd"
						d="M6.125 6H17.875C17.944 6 18 6.05596 18 6.125V17.875C18 17.944 17.944 18 17.875 18H6.125C6.05596 18 6 17.944 6 17.875V6.125C6 6.05596 6.05596 6 6.125 6ZM4.5 6.125C4.5 5.22754 5.22754 4.5 6.125 4.5H17.875C18.7725 4.5 19.5 5.22754 19.5 6.125V17.875C19.5 18.7725 18.7725 19.5 17.875 19.5H6.125C5.22754 19.5 4.5 18.7725 4.5 17.875V6.125ZM10.5171 16.4421L16.5897 8.71335L15.4103 7.78662L10.4828 14.0579L8.57616 11.7698L7.42383 12.7301L10.5171 16.4421Z"
					/>
				),
			},
			edit: EditCheckbox,
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: '',
					role: 'content',
				},
			},
		},
	},
	{
		name: 'field-consent',
		settings: {
			...FieldDefaults,
			title: __( 'Terms Consent', 'jetpack-forms' ),
			keywords: [ __( 'Consent', 'jetpack-forms' ) ],
			description: __(
				'Communicate site terms and offer visitors consent to those terms.',
				'jetpack-forms'
			),
			icon: {
				foreground: getIconColor(),
				src: renderMaterialIcon(
					<>
						<Path d="M7 5.5H17C17.2761 5.5 17.5 5.72386 17.5 6V13H19V6C19 4.89543 18.1046 4 17 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H11.5V18.5H7C6.72386 18.5 6.5 18.2761 6.5 18V6C6.5 5.72386 6.72386 5.5 7 5.5ZM16 7.75H8V9.25H16V7.75ZM8 11H13V12.5H8V11Z" />
						<Path d="M20.1087 15.9382L15.9826 21.6689L12.959 18.5194L14.0411 17.4806L15.8175 19.331L18.8914 15.0618L20.1087 15.9382Z" />
					</>
				),
			},
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: __( 'Consent', 'jetpack-forms' ),
				},
				consentType: {
					type: 'string',
					default: 'implicit',
				},
				implicitConsentMessage: {
					type: 'string',
					default: __(
						"By submitting your information, you're giving us permission to email you. You may unsubscribe at any time.",
						'jetpack-forms'
					),
				},
				explicitConsentMessage: {
					type: 'string',
					default: __( 'Can we send you an email from time to time?', 'jetpack-forms' ),
				},
			},
			edit: EditConsent,
		},
	},
	{
		name: JetpackFieldSingleChoice.name,
		settings: mergeSettings( FieldDefaults, {
			...JetpackFieldSingleChoice.settings,
			deprecated: [
				{
					save() {
						return <InnerBlocks.Content />;
					},
				},
				multiFieldV1( 'radio' ),
			],
		} ),
	},
	JetpackFieldSingleChoiceItem,
	{
		name: JetpackFieldMultipleChoice.name,
		settings: mergeSettings( FieldDefaults, {
			...JetpackFieldMultipleChoice.settings,
			deprecated: [
				{
					save() {
						return <InnerBlocks.Content />;
					},
				},
				multiFieldV1( 'checkbox' ),
			],
		} ),
	},
	JetpackFieldMultipleChoiceItem,
	{
		name: 'field-select',
		settings: {
			...FieldDefaults,
			title: __( 'Dropdown Field', 'jetpack-forms' ),
			keywords: [
				__( 'Choose', 'jetpack-forms' ),
				__( 'Dropdown', 'jetpack-forms' ),
				__( 'Option', 'jetpack-forms' ),
			],
			description: __(
				'Add a compact select box, that when expanded, allows visitors to choose one value from the list.',
				'jetpack-forms'
			),
			icon: {
				foreground: getIconColor(),
				src: renderMaterialIcon(
					<Path
						fill={ getIconColor() }
						d="M5 4.5H19C19.2761 4.5 19.5 4.72386 19.5 5V19C19.5 19.2761 19.2761 19.5 19 19.5H5C4.72386 19.5 4.5 19.2761 4.5 19V5C4.5 4.72386 4.72386 4.5 5 4.5ZM19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5Z"
					/>
				),
			},
			edit: JetpackDropdown,
			attributes: {
				...FieldDefaults.attributes,
				toggleLabel: {
					type: 'string',
					default: null,
					role: 'content',
				},
				options: {
					type: 'array',
					default: [ '' ],
					role: 'content',
				},
			},
		},
	},
	{
		name: 'step-container',
		settings: {
			apiVersion: 3,
			title: __( 'Steps', 'jetpack-forms' ),
			allowedBlocks: [ 'jetpack/form-step' ],
			ancestor: [ 'jetpack/contact-form' ],
			category: 'contact-form',
			description: __( 'A container that organizes multiple form steps.', 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: renderMaterialIcon(
					<>
						<Path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M19 4.5H5C4.72386 4.5 4.5 4.72386 4.5 5V19C4.5 19.2761 4.72386 19.5 5 19.5H19C19.2761 19.5 19.5 19.2761 19.5 19V5C19.5 4.72386 19.2761 4.5 19 4.5ZM5 3C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5Z"
						/>
						<Path d="M6.1001 6H12.1001V7.5H6.1001V6Z" />
						<Path
							d="M7.6001 9.75H16.6001C17.0143 9.75 17.3501 10.0858 17.3501 10.5V11.5C17.3501 11.9142 17.0143 12.25 16.6001 12.25H7.6001C7.18588 12.25 6.8501 11.9142 6.8501 11.5V10.5C6.8501 10.0858 7.18588 9.75 7.6001 9.75Z"
							strokeWidth="1.5"
							stroke="currentColor"
							fill="none"
						/>
						<Path
							d="M7.6001 14.75H16.6001C17.0143 14.75 17.3501 15.0858 17.3501 15.5V16.5C17.3501 16.9142 17.0143 17.25 16.6001 17.25H7.6001C7.18588 17.25 6.8501 16.9142 6.8501 16.5V15.5C6.8501 15.0858 7.18588 14.75 7.6001 14.75Z"
							strokeWidth="1.5"
							stroke="currentColor"
							fill="none"
						/>
					</>
				),
			},
			supports: {
				html: false,
				reusable: false,
				align: true,
				color: {
					gradients: true,
					link: true,
					background: true,
				},
				spacing: {
					padding: true,
					margin: true,
				},
				dimensions: {
					minHeight: true, // Enable min height control.
				},
			},
			attributes: {
				align: {
					type: 'string',
				},
				backgroundColor: {
					type: 'string',
				},
				gradient: {
					type: 'string',
				},
				textColor: {
					type: 'string',
				},
				style: {
					type: 'object',
				},
			},
			edit: StepContainerEdit,
			save: StepContainerSave,
			example: {},
		},
	},
	{
		name: 'form-step',
		settings: {
			apiVersion: 3,
			title: __( 'Step', 'jetpack-forms' ),
			category: 'contact-form',
			description: __( 'A single step in a multi-step form.', 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: renderMaterialIcon(
					<>
						<Path d="M17.5 9V6C17.5 5.46957 17.2893 4.96086 16.9142 4.58579C16.5391 4.21071 16.0304 4 15.5 4H8.5C7.96957 4 7.46086 4.21071 7.08579 4.58579C6.71071 4.96086 6.5 5.46957 6.5 6V9H8V6C8 5.86739 8.05268 5.74021 8.14645 5.64645C8.24021 5.55268 8.36739 5.5 8.5 5.5H15.5C15.6326 5.5 15.7598 5.55268 15.8536 5.64645C15.9473 5.74021 16 5.86739 16 6V9H17.5ZM17.5 15.5V18C17.5 18.5304 17.2893 19.0391 16.9142 19.4142C16.5391 19.7893 16.0304 20 15.5 20H8.5C7.96957 20 7.46086 19.7893 7.08579 19.4142C6.71071 19.0391 6.5 18.5304 6.5 18V15.5H8V18C8 18.1326 8.05268 18.2598 8.14645 18.3536C8.24021 18.4473 8.36739 18.5 8.5 18.5H15.5C15.6326 18.5 15.7598 18.4473 15.8536 18.3536C15.9473 18.2598 16 18.1326 16 18V15.5H17.5ZM4 13H20V11.5H4V13Z" />
					</>
				),
			},
			parent: [ 'jetpack/step-container' ],
			supports: {
				html: false,
				reusable: false,
				inserter: true,
				align: true,
				color: {
					gradients: true,
					link: true,
				},
				spacing: {
					padding: true,
					margin: true,
				},
			},
			attributes: {
				align: {
					type: 'string',
				},
				backgroundColor: {
					type: 'string',
				},
				gradient: {
					type: 'string',
				},
				textColor: {
					type: 'string',
				},
				style: {
					type: 'object',
				},
				stepLabel: {
					type: 'string',
					default: __( 'Step', 'jetpack-forms' ),
				},
			},
			edit: StepEdit,
			save: StepSave,
			transforms: {
				from: [
					{
						type: 'block',
						blocks: [ 'core/group' ],
						isMatch: isWithinContactForm,
						transform: ( attributes, innerBlocks ) => {
							return createBlock( 'jetpack/form-step', {}, innerBlocks || [] );
						},
					},
					{
						// Transform from multiple selected blocks ('*')
						type: 'block',
						isMultiBlock: true,
						blocks: [ '*' ],
						isMatch: isWithinContactForm,
						transform: () => {
							try {
								const blockEditor = select( 'core/block-editor' );
								if ( ! blockEditor ) {
									return [ createBlock( 'jetpack/form-step', {} ) ];
								}

								const selectedIds = blockEditor.getSelectedBlockClientIds();
								if ( ! selectedIds?.length ) {
									return [ createBlock( 'jetpack/form-step', {} ) ];
								}

								const newBlocks = [];
								for ( const id of selectedIds ) {
									const block = blockEditor.getBlock( id );
									if ( block && block.name ) {
										newBlocks.push( createBlock( block.name, { ...block.attributes } ) );
									}
								}

								const formStep = createBlock( 'jetpack/form-step', {}, newBlocks );

								return [ formStep ];
							} catch {
								return [ createBlock( 'jetpack/form-step', {} ) ];
							}
						},
					},
				],
			},
			example: {},
		},
	},
	{
		name: 'form-step-navigation',
		settings: {
			...FieldDefaults,
			ancestor: [ 'jetpack/contact-form', 'jetpack/form-step' ],
			supports: {
				...FieldDefaults.supports,
				layout: {
					allowSwitching: false,
					allowInheriting: false,
					default: {
						type: 'flex',
					},
				},
			},
			title: __( 'Step navigation', 'jetpack-forms' ),
			description: __( 'Responsible for the navigation between steps.', 'jetpack-forms' ),
			icon: {
				foreground: getIconColor(),
				src: <Icon icon={ next } />,
			},
			edit: StepNavigationEdit,
			save: StepNavigationSave,
			transforms: {},
			example: {},
		},
	},
	{
		name: 'form-progress-indicator',
		settings: {
			...FieldDefaults,
			ancestor: [ 'jetpack/contact-form' ],
			supports: {
				html: false,
				reusable: false,
				spacing: {
					padding: true,
					margin: true,
				},
			},
			title: __( 'Progress indicator', 'jetpack-forms' ),
			description: __(
				'Show a visual indicator of progress through multi-step forms.',
				'jetpack-forms'
			),
			icon: {
				foreground: getIconColor(),
				src: renderMaterialIcon(
					<>
						<Rect
							x="3.75"
							y="9.75"
							width="16.5"
							height="4.5"
							rx="2.25"
							stroke={ getIconColor() }
							fill="none"
							strokeWidth="1.5"
						/>
						<Rect x="2" y="9" width="8" height="6" rx="3" />
					</>
				),
			},
			edit: FormProgressIndicatorEdit,
			save: FormProgressIndicatorSave,
			attributes: {
				backgroundColor: {
					type: 'string',
				},
				progressColor: {
					type: 'string',
				},
				gradient: {
					type: 'string',
				},
				style: {
					type: 'object',
				},
			},
			transforms: {},
			example: {},
		},
	},
	{
		name: 'step-divider',
		settings: {
			apiVersion: 3,
			title: __( 'Step Divider', 'jetpack-forms' ),
			description: __( 'Split the current step into two steps.', 'jetpack-forms' ),
			category: 'contact-form',
			parent: [ 'jetpack/form-step' ],
			icon: {
				foreground: getIconColor(),
				src: renderMaterialIcon( <Path d="M19 13H5v-2h14v2z" /> ),
			},
			supports: {
				html: false,
				reusable: false,
			},
			edit: StepDividerEdit,
		},
	},
];
