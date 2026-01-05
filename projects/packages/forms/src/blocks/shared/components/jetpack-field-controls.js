import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { isValidElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackFieldId from './jetpack-field-id-control.js';
import JetpackFieldWidth from './jetpack-field-width.js';
import ToolbarRequiredGroup from './toolbar-required-group.js';

const JetpackFieldControls = ( {
	attributes,
	id,
	required,
	setAttributes,
	width,
	extraFieldSettings = [],
} ) => {
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
			<JetpackFieldId id={ id } setAttributes={ setAttributes } />
		</>
	);
};

export default JetpackFieldControls;
