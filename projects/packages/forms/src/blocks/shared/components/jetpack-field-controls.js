import {
	InspectorAdvancedControls,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { isValidElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackManageResponsesSettings from '../../contact-form/components/jetpack-manage-responses-settings';
import JetpackFieldWidth from './jetpack-field-width';
import ToolbarRequiredGroup from './toolbar-required-group';

const JetpackFieldControls = ( {
	attributes,
	id,
	required,
	setAttributes,
	width,
	extraFieldSettings = [],
} ) => {
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
				<PanelBody title={ __( 'Manage responses', 'jetpack-forms' ) }>
					<JetpackManageResponsesSettings isChildBlock />
				</PanelBody>
				<PanelBody title={ __( 'Field settings', 'jetpack-forms' ) }>
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
