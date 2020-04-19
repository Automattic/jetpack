/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { BaseControl, PanelBody, ToggleControl } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import { compose, withInstanceId } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import JetpackFieldLabel from './jetpack-field-label';

function JetpackFieldCheckbox( props ) {
	const {
		instanceId,
		required,
		label,
		setAttributes,
		isSelected,
		defaultValue,
		parentBlock,
		spacing,
	} = props;

	useEffect( () => {
		if ( parentBlock && parentBlock.attributes.spacing !== spacing ) {
			setAttributes( { spacing: parentBlock.attributes.spacing } );
		}
	} );

	return (
		<BaseControl
			id={ `jetpack-field-checkbox-${ instanceId }` }
			className="jetpack-field jetpack-field-checkbox"
			label={
				<div
					style={ {
						marginBottom: spacing + 'px',
					} }
				>
					<input
						className="jetpack-field-checkbox__checkbox"
						type="checkbox"
						disabled
						checked={ defaultValue }
					/>
					<JetpackFieldLabel
						required={ required }
						label={ label }
						setAttributes={ setAttributes }
						isSelected={ isSelected }
					/>
					<InspectorControls>
						<PanelBody title={ __( 'Field Settings', 'jetpack' ) }>
							<ToggleControl
								label={ __( 'Checked by default', 'jetpack' ) }
								checked={ defaultValue }
								onChange={ value => setAttributes( { defaultValue: value } ) }
							/>
						</PanelBody>
					</InspectorControls>
				</div>
			}
		/>
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
	withInstanceId,
] )( JetpackFieldCheckbox );
