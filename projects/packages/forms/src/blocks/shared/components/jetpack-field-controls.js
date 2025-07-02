import {
	InspectorAdvancedControls,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { isValidElement, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import JetpackFieldWidth from './jetpack-field-width';
import JetpackManageResponsesSettings from './jetpack-manage-responses-settings';
import ToolbarRequiredGroup from './toolbar-required-group';

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
				<PanelBody title={ __( 'Manage responses', 'jetpack-forms' ) }>
					<JetpackManageResponsesSettings isChildBlock />
				</PanelBody>
				<PanelBody title={ __( 'Field settings', 'jetpack-forms' ) }>
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
			</InspectorAdvancedControls>
		</>
	);
};

export default JetpackFieldControls;
