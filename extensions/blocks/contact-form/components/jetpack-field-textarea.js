/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useEffect } from '@wordpress/element';
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	TextareaControl,
	Disabled,
	Toolbar,
	ToolbarButton,
	Path,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';
import renderMaterialIcon from '../../../shared/render-material-icon';

function JetpackFieldTextarea( props ) {
	const {
		required,
		label,
		parentBlock,
		setAttributes,
		isSelected,
		placeholder,
		padding,
		spacing,
	} = props;

	useEffect( () => {
		if ( parentBlock && parentBlock.attributes.padding !== padding ) {
			setAttributes( { padding: parentBlock.attributes.padding } );
		}

		if ( parentBlock && parentBlock.attributes.spacing !== spacing ) {
			setAttributes( { spacing: parentBlock.attributes.spacing } );
		}
	} );

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

			<BlockControls>
				<Toolbar>
					<ToolbarButton
						title={ __( 'Required' ) }
						icon={ renderMaterialIcon(
							<Path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z" />
						) }
						onClick={ () => {
							setAttributes( { required: ! required } );
						} }
						className={ required ? 'is-pressed' : undefined }
					/>
				</Toolbar>
			</BlockControls>

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
