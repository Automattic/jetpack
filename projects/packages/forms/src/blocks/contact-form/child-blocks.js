import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
import { filter, isEmpty, map, startsWith } from 'lodash';
import DeprecatedOptionCheckbox from '../deprecated/field-option-checkbox';
import DeprecatedOptionRadio from '../deprecated/field-option-radio';
import JetpackCheckboxField from '../field-checkbox';
import JetpackConsentField from '../field-consent/';
import JetpackDateField from '../field-date';
import JetpackEmailField from '../field-email';
import JetpackMultipleChoiceField from '../field-multiple-choice';
import JetpackNameField from '../field-name';
import JetpackNumberField from '../field-number';
import JetpackDropdownField from '../field-select';
import JetpackSingleChoiceField from '../field-single-choice';
import JetpackTelephoneField from '../field-telephone';
import JetpackTextField from '../field-text';
import JetpackTextareaField from '../field-textarea';
import JetpackUrlField from '../field-url';
import JetpackInput from '../input';
import JetpackLabel from '../label';
import JetpackOption from '../option';
import JetpackOptions from '../options';
import JetpackFieldFile from './components/jetpack-field-file';
import { getIconColor } from './util/block-icons';

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

export const childBlocks = [
	JetpackLabel,
	JetpackInput,
	JetpackOption,
	JetpackOptions,
	JetpackCheckboxField,
	JetpackConsentField,
	JetpackDateField,
	JetpackDropdownField,
	JetpackEmailField,
	JetpackMultipleChoiceField,
	JetpackNameField,
	JetpackNumberField,
	JetpackSingleChoiceField,
	JetpackTextField,
	JetpackUrlField,
	JetpackTelephoneField,
	JetpackTextareaField,
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
	// The following are required for these blocks to be parsed correctly in block
	// deprecations. They have been flagged with `supports.inserter: false` to
	// prevent further use.
	DeprecatedOptionCheckbox,
	DeprecatedOptionRadio,
];
