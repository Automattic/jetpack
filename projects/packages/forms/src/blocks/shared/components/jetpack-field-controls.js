import {
	InspectorAdvancedControls,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import {
	ExternalLink,
	PanelBody,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { isValidElement, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import JetpackFieldWidth from './jetpack-field-width.js';
import ToolbarRequiredGroup from './toolbar-required-group.js';

// List of reserved HTML form element attribute names
const reservedAttributes = [
	'accept',
	'action',
	'autocomplete',
	'enctype',
	'method',
	'name',
	'novalidate',
	'target',
	'type',
	'value',
];

const JetpackFieldControls = ( {
	attributes,
	autocomplete,
	id,
	required,
	setAttributes,
	width,
	extraFieldSettings = [],
} ) => {
	const helpMessage = __(
		"Customize the input's name/ID. Only alphanumeric, dash and underscore characters are allowed",
		'jetpack-forms'
	);

	const [ errorState, setErrorState ] = useState( {
		error: false,
		message: '',
	} );

	const setId = value => {
		const newValue = value.replace( /[^a-zA-Z0-9_-]/g, '' );
		const reservedWordError = word => {
			return sprintf(
				/* translators: %s is the reserved attribute name causing an error */
				__( 'The name/ID "%s" is a reserved word. Please use a different name.', 'jetpack-forms' ),
				word
			);
		};

		// Only set ID if it's not a reserved attribute name (case insensitive)
		if ( ! reservedAttributes.some( attr => attr.toLowerCase() === newValue.toLowerCase() ) ) {
			setErrorState( {
				error: false,
				message: '',
			} );
			setAttributes( { id: newValue } );
		} else {
			setErrorState( {
				error: true,
				message: reservedWordError( newValue ),
			} );
		}
	};

	let fieldSettings = [
		<ToggleControl
			key="required"
			label={ __( 'Field is required', 'jetpack-forms' ) }
			checked={ required }
			onChange={ value => setAttributes( { required: value } ) }
			help={ __( 'You can edit the "required" label in the editor', 'jetpack-forms' ) }
			__nextHasNoMarginBottom={ true }
		/>,
		required && (
			<ToggleControl
				key="requiredIndicator"
				label={ __( 'Show required text', 'jetpack-forms' ) }
				checked={ !! attributes.requiredIndicator }
				onChange={ value => setAttributes( { requiredIndicator: value } ) }
				help={ __(
					'Toggle whether to display the required indicator text for this field.',
					'jetpack-forms'
				) }
				__nextHasNoMarginBottom={ true }
			/>
		),
		<JetpackFieldWidth key="width" setAttributes={ setAttributes } width={ width } />,
		<ToggleControl
			key="shareFieldAttributes"
			label={ __( 'Sync fields style', 'jetpack-forms' ) }
			checked={ attributes.shareFieldAttributes }
			onChange={ value => setAttributes( { shareFieldAttributes: value } ) }
			help={ __( 'Deactivate for individual styling of this block', 'jetpack-forms' ) }
			__nextHasNoMarginBottom={ true }
		/>,
	];

	extraFieldSettings.forEach( ( { element, index } ) => {
		if ( ! isValidElement( element ) ) {
			return;
		}

		if ( index >= 0 && index < fieldSettings.length ) {
			fieldSettings = [
				...fieldSettings.slice( 0, index ),
				element,
				...fieldSettings.slice( index ),
			];
		} else {
			fieldSettings.push( element );
		}
	} );

	return (
		<>
			<BlockControls __experimentalShareWithChildBlocks>
				<ToolbarRequiredGroup
					required={ required }
					onClick={ () => setAttributes( { required: ! required } ) }
				/>
			</BlockControls>

			<InspectorControls>
				<PanelBody
					title={ __( 'Field settings', 'jetpack-forms' ) }
					className="jetpack-contact-form__panel"
				>
					<>{ fieldSettings }</>
				</PanelBody>
			</InspectorControls>
			<InspectorAdvancedControls>
				<TextControl
					className={ errorState.error ? 'jetpack-forms-field-controls__input-error' : '' }
					label={ __( 'Name/ID', 'jetpack-forms' ) }
					value={ id || '' }
					onChange={ setId }
					help={ errorState.error ? errorState.message : helpMessage }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
				<SelectControl
					label={ __( 'Autocomplete', 'jetpack-forms' ) }
					value={ autocomplete || '' }
					onChange={ value => setAttributes( { autocomplete: value } ) }
					help={
						<>
							{ __( 'Guidance to the browser for autocompleting the form.', 'jetpack-forms' ) }
							<br />
							<ExternalLink href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete">
								{ __( 'Read more', 'jetpack-forms' ) }
							</ExternalLink>
						</>
					}
					// See https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
					options={ [
						{
							label: __( 'Default', 'jetpack-forms' ),
							value: '',
						},
						{
							label: __( 'Off', 'jetpack-forms' ),
							value: 'off',
						},
						{
							label: __( 'Telephone', 'jetpack-forms' ),
							value: 'tel',
						},
						{
							label: __( 'Full name', 'jetpack-forms' ),
							value: 'name',
						},
						{
							label: __( 'First name', 'jetpack-forms' ),
							value: 'given-name',
						},
						{
							label: __( 'Middle name', 'jetpack-forms' ),
							value: 'additional-name',
						},
						{
							label: __( 'The last name', 'jetpack-forms' ),
							value: 'family-name',
						},
						{
							label: __( 'The honorific prefix ("Mrs.", etc)', 'jetpack-forms' ),
							value: 'honorific-prefix',
						},
						{
							label: __( 'The honorific suffix ("Jr." etc)', 'jetpack-forms' ),
							value: 'honorific-suffix',
						},
						{
							label: __( 'A nickname', 'jetpack-forms' ),
							value: 'nickname',
						},
						{
							label: __( 'A username', 'jetpack-forms' ),
							value: 'username',
						},
						{
							label: __( 'A job title', 'jetpack-forms' ),
							value: 'organization-title',
						},
						{
							label: __( 'A company or organization name', 'jetpack-forms' ),
							value: 'organization',
						},
						{
							label: __( 'A street address', 'jetpack-forms' ),
							value: 'street-address',
						},
						{
							label: __( 'A country code', 'jetpack-forms' ),
							value: 'country',
						},
						{
							label: __( 'A country name', 'jetpack-forms' ),
							value: 'country-name',
						},
						{
							label: __( 'A postal code or ZIP code', 'jetpack-forms' ),
							value: 'postal-code',
						},
						{
							label: __( 'Currency', 'jetpack-forms' ),
							value: 'transaction-currency',
						},
						{
							label: __( 'A preferred language', 'jetpack-forms' ),
							value: 'language',
						},
						{
							label: __( 'A birth date', 'jetpack-forms' ),
							value: 'bday',
						},
						{
							label: __( 'A gender identity (e.g. "Female")', 'jetpack-forms' ),
							value: 'sex',
						},
						{
							label: __( 'A URL', 'jetpack-forms' ),
							value: 'url',
						},
					] }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
			</InspectorAdvancedControls>
		</>
	);
};

export default JetpackFieldControls;
