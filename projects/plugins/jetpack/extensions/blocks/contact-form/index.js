import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { getBlockType, createBlock } from '@wordpress/blocks';
import { Path, Circle } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import './editor.scss';
import { getIconColor } from '../../shared/block-icons';
import renderMaterialIcon from '../../shared/render-material-icon';
import defaultAttributes from './attributes';
import JetpackField from './components/jetpack-field';
import JetpackFieldCheckbox from './components/jetpack-field-checkbox';
import JetpackFieldConsent from './components/jetpack-field-consent';
import JetpackFieldMultiple from './components/jetpack-field-multiple';
import JetpackFieldTextarea from './components/jetpack-field-textarea';
import deprecated from './deprecated';
import edit from './edit';
import transforms from './transforms';
import variations from './variations';

export const name = 'contact-form';

const icon = renderMaterialIcon(
	<Path d="M13 7.5h5v2h-5zm0 7h5v2h-5zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM11 6H6v5h5V6zm-1 4H7V7h3v3zm1 3H6v5h5v-5zm-1 4H7v-3h3v3z" />
);

export const settings = {
	title: __( 'Form', 'jetpack' ),
	description: __( 'A simple way to get feedback from folks visiting your site.', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	keywords: [
		_x( 'email', 'block search term', 'jetpack' ),
		_x( 'feedback', 'block search term', 'jetpack' ),
		_x( 'contact form', 'block search term', 'jetpack' ),
	],
	supports: {
		color: {
			link: true,
			gradients: true,
		},
		html: false,
		spacing: {
			padding: true,
			margin: true,
		},
	},
	attributes: defaultAttributes,
	edit,
	save: () => {
		const blockProps = useBlockProps.save();
		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	},
	variations,
	category: 'grow',
	transforms,
	deprecated,
};

const FieldDefaults = {
	category: 'grow',
	parent: [ 'jetpack/contact-form' ],
	supports: {
		reusable: false,
		html: false,
	},
	attributes: {
		label: {
			type: 'string',
			default: null,
		},
		required: {
			type: 'boolean',
			default: false,
		},
		options: {
			type: 'array',
			default: [],
		},
		defaultValue: {
			type: 'string',
			default: '',
		},
		placeholder: {
			type: 'string',
			default: '',
		},
		id: {
			type: 'string',
			default: '',
		},
		width: {
			type: 'number',
			default: 100,
		},
	},
	transforms: {
		to: [
			{
				type: 'block',
				blocks: [ 'jetpack/field-text' ],
				isMatch: ( { options } ) => ! options.length,
				transform: attributes => createBlock( 'jetpack/field-text', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-name' ],
				isMatch: ( { options } ) => ! options.length,
				transform: attributes => createBlock( 'jetpack/field-name', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-email' ],
				isMatch: ( { options } ) => ! options.length,
				transform: attributes => createBlock( 'jetpack/field-email', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-url' ],
				isMatch: ( { options } ) => ! options.length,
				transform: attributes => createBlock( 'jetpack/field-url', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-date' ],
				isMatch: ( { options } ) => ! options.length,
				transform: attributes => createBlock( 'jetpack/field-date', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-telephone' ],
				isMatch: ( { options } ) => ! options.length,
				transform: attributes => createBlock( 'jetpack/field-telephone', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-textarea' ],
				isMatch: ( { options } ) => ! options.length,
				transform: attributes => createBlock( 'jetpack/field-textarea', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-checkbox-multiple' ],
				isMatch: ( { options } ) => 1 <= options.length,
				transform: attributes => createBlock( 'jetpack/field-checkbox-multiple', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-radio' ],
				isMatch: ( { options } ) => 1 <= options.length,
				transform: attributes => createBlock( 'jetpack/field-radio', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-select' ],
				isMatch: ( { options } ) => 1 <= options.length,
				transform: attributes => createBlock( 'jetpack/field-select', attributes ),
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-consent' ],
				isMatch: ( { options } ) => 1 <= options.length,
				transform: attributes => createBlock( 'jetpack/field-consent', attributes ),
			},
		],
	},
	save: () => null,
	example: {},
};

const getFieldLabel = ( { attributes, name: blockName } ) => {
	return null === attributes.label ? getBlockType( blockName ).title : attributes.label;
};

const editField = type => props => {
	return (
		<JetpackField
			type={ type }
			label={ getFieldLabel( props ) }
			required={ props.attributes.required }
			setAttributes={ props.setAttributes }
			isSelected={ props.isSelected }
			defaultValue={ props.attributes.defaultValue }
			placeholder={ props.attributes.placeholder }
			id={ props.attributes.id }
			width={ props.attributes.width }
		/>
	);
};

const editMultiField = type => props => (
	<JetpackFieldMultiple
		label={ getFieldLabel( props ) }
		required={ props.attributes.required }
		options={ props.attributes.options }
		setAttributes={ props.setAttributes }
		type={ type }
		isSelected={ props.isSelected }
		id={ props.attributes.id }
		width={ props.attributes.width }
	/>
);

export const childBlocks = [
	{
		name: 'field-text',
		settings: {
			...FieldDefaults,
			title: __( 'Text', 'jetpack' ),
			description: __( 'When you need just a small amount of text, add a text input.', 'jetpack' ),
			icon: renderMaterialIcon(
				<Path fill={ getIconColor() } d="M4 9h16v2H4V9zm0 4h10v2H4v-2z" />
			),
			edit: editField( 'text' ),
		},
	},
	{
		name: 'field-name',
		settings: {
			...FieldDefaults,
			title: __( 'Name', 'jetpack' ),
			description: __(
				'Introductions are important. Add an input for folks to add their name.',
				'jetpack'
			),
			icon: renderMaterialIcon(
				<Path
					fill={ getIconColor() }
					d="M12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2m0 10c2.7 0 5.8 1.29 6 2H6c.23-.72 3.31-2 6-2m0-12C9.79 4 8 5.79 8 8s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
				/>
			),
			edit: editField( 'text' ),
		},
	},
	{
		name: 'field-email',
		settings: {
			...FieldDefaults,
			title: __( 'Email', 'jetpack' ),
			keywords: [ __( 'e-mail', 'jetpack' ), __( 'mail', 'jetpack' ), 'email' ],
			description: __( 'Want to reply to folks? Add an email address input.', 'jetpack' ),
			icon: renderMaterialIcon(
				<Path
					fill={ getIconColor() }
					d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z"
				/>
			),
			edit: editField( 'email' ),
		},
	},

	{
		name: 'field-url',
		settings: {
			...FieldDefaults,
			title: __( 'Website', 'jetpack' ),
			keywords: [ 'url', __( 'internet page', 'jetpack' ), 'link' ],
			description: __( 'Add an address input for a website.', 'jetpack' ),
			icon: renderMaterialIcon(
				<Path
					fill={ getIconColor() }
					d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"
				/>
			),
			edit: editField( 'url' ),
		},
	},

	{
		name: 'field-date',
		settings: {
			...FieldDefaults,
			title: __( 'Date Picker', 'jetpack' ),
			keywords: [
				__( 'Calendar', 'jetpack' ),
				_x( 'day month year', 'block search term', 'jetpack' ),
			],
			description: __( 'The best way to set a date. Add a date picker.', 'jetpack' ),
			icon: renderMaterialIcon(
				<Path
					fill={ getIconColor() }
					d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zm0-12H5V5h14v2zM7 11h5v5H7z"
				/>
			),
			edit: editField( 'text' ),
		},
	},
	{
		name: 'field-telephone',
		settings: {
			...FieldDefaults,
			title: __( 'Phone Number', 'jetpack' ),
			keywords: [
				__( 'Phone', 'jetpack' ),
				__( 'Cellular phone', 'jetpack' ),
				__( 'Mobile', 'jetpack' ),
			],
			description: __( 'Add a phone number input.', 'jetpack' ),
			icon: renderMaterialIcon(
				<Path
					fill={ getIconColor() }
					d="M6.54 5c.06.89.21 1.76.45 2.59l-1.2 1.2c-.41-1.2-.67-2.47-.76-3.79h1.51m9.86 12.02c.85.24 1.72.39 2.6.45v1.49c-1.32-.09-2.59-.35-3.8-.75l1.2-1.19M7.5 3H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.49c0-.55-.45-1-1-1-1.24 0-2.45-.2-3.57-.57-.1-.04-.21-.05-.31-.05-.26 0-.51.1-.71.29l-2.2 2.2c-2.83-1.45-5.15-3.76-6.59-6.59l2.2-2.2c.28-.28.36-.67.25-1.02C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1z"
				/>
			),
			edit: editField( 'tel' ),
		},
	},
	{
		name: 'field-textarea',
		settings: {
			...FieldDefaults,
			title: __( 'Message', 'jetpack' ),
			keywords: [ __( 'Textarea', 'jetpack' ), 'textarea', __( 'Multiline text', 'jetpack' ) ],
			description: __(
				'Let folks speak their mind. This text box is great for longer responses.',
				'jetpack'
			),
			icon: renderMaterialIcon(
				<Path fill={ getIconColor() } d="M21 11.01L3 11v2h18zM3 16h12v2H3zM21 6H3v2.01L21 8z" />
			),
			edit: props => (
				<JetpackFieldTextarea
					label={ getFieldLabel( props ) }
					required={ props.attributes.required }
					setAttributes={ props.setAttributes }
					isSelected={ props.isSelected }
					defaultValue={ props.attributes.defaultValue }
					placeholder={ props.attributes.placeholder }
					id={ props.attributes.id }
					width={ props.attributes.width }
				/>
			),
		},
	},
	{
		name: 'field-checkbox',
		settings: {
			...FieldDefaults,
			title: __( 'Checkbox', 'jetpack' ),
			keywords: [ __( 'Confirm', 'jetpack' ), __( 'Accept', 'jetpack' ) ],
			description: __( 'Add a single checkbox.', 'jetpack' ),
			icon: renderMaterialIcon(
				<Path
					fill={ getIconColor() }
					d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z"
				/>
			),
			edit: props => (
				<JetpackFieldCheckbox
					label={ props.attributes.label } // label intentinally left blank
					required={ props.attributes.required }
					setAttributes={ props.setAttributes }
					isSelected={ props.isSelected }
					defaultValue={ props.attributes.defaultValue }
					id={ props.attributes.id }
					width={ props.attributes.width }
				/>
			),
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: '',
				},
			},
		},
	},
	{
		name: 'field-consent',
		settings: {
			...FieldDefaults,
			title: __( 'Consent', 'jetpack' ),
			keywords: [ __( 'Consent', 'jetpack' ) ],
			description: __( 'Ask for consent', 'jetpack' ),
			icon: renderMaterialIcon(
				<Path
					fill={ getIconColor() }
					d="m81 370h142v40h-142zm0-39h142v-40h-142zm0-79h245v-40h-245zm378 260h-40c0-40.253906-32.746094-73-73-73s-73 32.746094-73 73h-40c0-42.085938 23.128906-78.867188 57.34375-98.3125-11.40625-13.023438-18.34375-30.054688-18.34375-48.6875 0-40.804688 33.195312-74 74-74s74 33.195312 74 74c0 18.632812-6.9375 35.664062-18.34375 48.6875 34.214844 19.445312 57.34375 56.226562 57.34375 98.3125zm-113-113c18.746094 0 34-15.253906 34-34s-15.253906-34-34-34-34 15.253906-34 34 15.253906 34 34 34zm-286 73h138.316406c-3.460937 12.757812-5.316406 26.164062-5.316406 40h-133c-33.085938 0-60-26.914062-60-60v-392c0-33.085938 26.914062-60 60-60h203.757812l142.132813 142.855469v125.210937c-12.042969-7.476562-25.453125-12.765625-39.890625-15.324218v-81.632813h-71.109375c-33.085937 0-60-26.914063-60-60v-71.109375h-174.890625c-11.027344 0-20 8.972656-20 20v392c0 11.027344 8.972656 20 20 20zm234.890625-340.890625h42.972656l-62.972656-63.234375v43.234375c0 11.03125 8.96875 20 20 20zm0 0"
				/>,
				24,
				25,
				'-26 0 512 512'
			),
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: __( 'Consent', 'jetpack' ),
				},
				consentType: {
					type: 'string',
					default: 'implicit',
				},
				implicitConsentMessage: {
					type: 'string',
					default: __(
						"By submitting your information, you're giving us permission to email you. You may unsubscribe at any time.",
						'jetpack'
					),
				},
				explicitConsentMessage: {
					type: 'string',
					default: __( 'Can we send you an email from time to time?', 'jetpack' ),
				},
			},
			edit: ( { attributes, isSelected, setAttributes } ) => {
				const {
					id,
					width,
					consentType,
					implicitConsentMessage,
					explicitConsentMessage,
				} = attributes;
				return (
					<JetpackFieldConsent
						id={ id }
						isSelected={ isSelected }
						width={ width }
						consentType={ consentType }
						implicitConsentMessage={ implicitConsentMessage }
						explicitConsentMessage={ explicitConsentMessage }
						setAttributes={ setAttributes }
					/>
				);
			},
		},
	},
	{
		name: 'field-checkbox-multiple',
		settings: {
			...FieldDefaults,
			title: __( 'Checkbox Group', 'jetpack' ),
			keywords: [ __( 'Choose Multiple', 'jetpack' ), __( 'Option', 'jetpack' ) ],
			description: __( 'People love options. Add several checkbox items.', 'jetpack' ),
			icon: renderMaterialIcon(
				<Path
					fill={ getIconColor() }
					d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"
				/>
			),
			edit: editMultiField( 'checkbox' ),
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: 'Choose several',
				},
			},
		},
	},
	{
		name: 'field-radio',
		settings: {
			...FieldDefaults,
			title: __( 'Radio', 'jetpack' ),
			keywords: [ __( 'Choose', 'jetpack' ), __( 'Select', 'jetpack' ), __( 'Option', 'jetpack' ) ],
			description: __(
				'Inspired by radios, only one radio item can be selected at a time. Add several radio button items.',
				'jetpack'
			),
			icon: renderMaterialIcon(
				<Fragment>
					<Path
						fill={ getIconColor() }
						d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
					/>
					<Circle cx="12" cy="12" r="5" />
				</Fragment>
			),
			edit: editMultiField( 'radio' ),
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: 'Choose one',
				},
			},
		},
	},
	{
		name: 'field-select',
		settings: {
			...FieldDefaults,
			title: __( 'Select', 'jetpack' ),
			keywords: [
				__( 'Choose', 'jetpack' ),
				__( 'Dropdown', 'jetpack' ),
				__( 'Option', 'jetpack' ),
			],
			description: __( 'Compact, but powerful. Add a select box with several items.', 'jetpack' ),
			icon: renderMaterialIcon(
				<Path fill={ getIconColor() } d="M3 17h18v2H3zm16-5v1H5v-1h14m2-2H3v5h18v-5zM3 6h18v2H3z" />
			),
			edit: editMultiField( 'select' ),
			attributes: {
				...FieldDefaults.attributes,
				label: {
					type: 'string',
					default: 'Select one',
				},
			},
		},
	},
];
