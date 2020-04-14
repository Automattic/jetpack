/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	TextareaControl,
	TextControl,
	Disabled,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';

function JetpackFieldTextarea( {
	required,
	label,
	parentBlock,
	setAttributes,
	isSelected,
	defaultValue,
	placeholder,
	padding,
	spacing,
} ) {
	if ( parentBlock && parentBlock.attributes.padding !== padding ) {
		setAttributes( { padding: parentBlock.attributes.padding } );
	}

	if ( parentBlock && parentBlock.attributes.spacing !== spacing ) {
		setAttributes( { spacing: parentBlock.attributes.spacing } );
	}

	return (
		<Fragment>
			<div className="jetpack-field">
				<JetpackFieldLabel
					required={ required }
					label={ label }
					setAttributes={ setAttributes }
					isSelected={ isSelected }
				/>
				<Disabled>
					<TextareaControl
						placeholder={ placeholder }
						value={ placeholder }
						onChange={ value => setAttributes( { placeholder: value } ) }
						title={ __( 'Set the placeholder text', 'jetpack' ) }
						style={ {
							padding: padding + 'px',
							marginBottom: spacing + 'px',
						} }
					/>
				</Disabled>
			</div>
			<InspectorControls>
				<PanelBody title={ __( 'Field Settings', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Field is required', 'jetpack' ) }
						className="jetpack-field-label__required"
						checked={ required }
						onChange={ value => setAttributes( { required: value } ) }
						help={ __(
							'Does this field have to be completed for the form to be submitted?',
							'jetpack'
						) }
					/>
				</PanelBody>
			</InspectorControls>
		</Fragment>
	);
}

export default compose( [
	withSelect( select => {
		const { getBlock, getSelectedBlockClientId, getBlockHierarchyRootClientId } = select(
			'core/block-editor'
		);
		const selectedBlockClientId = getSelectedBlockClientId();

		return {
			parentBlock: selectedBlockClientId
				? getBlock( getBlockHierarchyRootClientId( selectedBlockClientId ) )
				: null,
		};
	} ),
] )( JetpackFieldTextarea );
