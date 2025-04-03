import {
	InspectorAdvancedControls,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { isValidElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ToolbarRequiredGroup from '../../contact-form/components/block-controls/toolbar-required-group';
import JetpackFieldWidth from '../../contact-form/components/jetpack-field-width';
import JetpackManageResponsesSettings from '../../contact-form/components/jetpack-manage-responses-settings';
import useFormStyle from '../hooks/use-form-style';
import { FORM_STYLE } from '../util/constants';
import getBlockStyle from '../util/get-block-style';

const JetpackFieldControls = ( {
	attributes,
	blockClassNames,
	clientId,
	id,
	required,
	setAttributes,
	type,
	width,
	extraFieldSettings = [],
} ) => {
	const formStyle = useFormStyle( clientId );
	const blockStyle = getBlockStyle( blockClassNames );
	const isChoicesBlock = [ 'radio', 'checkbox' ].includes( type );

	const optionColorLabel =
		blockStyle === 'button'
			? __( 'Button Text', 'jetpack-forms' )
			: __( 'Option Text', 'jetpack-forms', 0 );

	const inputColorLabel = isChoicesBlock
		? optionColorLabel
		: __( 'Field Text', 'jetpack-forms', 0 );

	const backgroundColorLabel = isChoicesBlock
		? __( 'Background', 'jetpack-forms' )
		: __( 'Field Background', 'jetpack-forms', 0 );

	const colorSettings = [
		{
			value: attributes.labelColor,
			onChange: value => setAttributes( { labelColor: value } ),
			label: __( 'Label Text', 'jetpack-forms' ),
		},
		{
			value: attributes.inputColor,
			onChange: value => setAttributes( { inputColor: value } ),
			label: inputColorLabel,
		},
	];

	if ( isChoicesBlock && blockStyle === 'button' ) {
		colorSettings.push( {
			value: attributes.buttonBackgroundColor,
			onChange: value => setAttributes( { buttonBackgroundColor: value } ),
			label: __( 'Button Background', 'jetpack-forms' ),
		} );
	}

	if ( ! isChoicesBlock || formStyle === FORM_STYLE.OUTLINED ) {
		colorSettings.push( {
			value: attributes.fieldBackgroundColor,
			onChange: value => setAttributes( { fieldBackgroundColor: value } ),
			label: backgroundColorLabel,
		} );

		colorSettings.push( {
			value: attributes.borderColor,
			onChange: value => setAttributes( { borderColor: value } ),
			label: __( 'Border', 'jetpack-forms' ),
		} );
	}

	const setId = value => {
		const newValue = value.replace( /[^a-zA-Z0-9_-]/g, '' );
		setAttributes( { id: newValue } );
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
				<PanelBody title={ __( 'Manage Responses', 'jetpack-forms' ) }>
					<JetpackManageResponsesSettings isChildBlock />
				</PanelBody>
				<PanelBody title={ __( 'Field Settings', 'jetpack-forms' ) }>
					<>{ fieldSettings }</>
				</PanelBody>
			</InspectorControls>
			<InspectorAdvancedControls>
				<TextControl
					label={ __( 'Name/ID', 'jetpack-forms' ) }
					value={ id || '' }
					onChange={ setId }
					help={ __(
						"Customize the input's name/ID. Only alphanumeric, dash and underscore characters are allowed",
						'jetpack-forms'
					) }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
			</InspectorAdvancedControls>
		</>
	);
};

export default JetpackFieldControls;
