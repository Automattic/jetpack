import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, __experimentalNumberControl as NumberControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __ } from '@wordpress/i18n';
import JetpackField from '../shared/components/jetpack-field';
import useFormWrapper from '../shared/hooks/use-form-wrapper';

export default function NumberFieldEdit( props ) {
	useFormWrapper( props );
	const { attributes, clientId, insertBlocksAfter, isSelected, setAttributes } = props;

	return (
		<>
			<JetpackField
				clientId={ clientId }
				type="number"
				label={ __( 'Number', 'jetpack-forms' ) }
				required={ attributes.required }
				requiredText={ attributes.requiredText }
				setAttributes={ setAttributes }
				isSelected={ isSelected }
				defaultValue={ attributes.defaultValue }
				placeholder={ attributes.placeholder }
				id={ attributes.id }
				width={ attributes.width }
				attributes={ attributes }
				insertBlocksAfter={ insertBlocksAfter }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-forms' ) }>
					<NumberControl
						key="min"
						label={ __( 'Minimum value', 'jetpack-forms' ) }
						value={ attributes.min }
						onChange={ value => setAttributes( { min: value } ) }
						max={ attributes.max }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
						help={ __(
							'The minimum value to accept in the input. Leaving empty allows any negative and positive values.',
							'jetpack-forms'
						) }
					/>
					<NumberControl
						key="max"
						label={ __( 'Maximum value', 'jetpack-forms' ) }
						value={ attributes.max }
						onChange={ value =>
							setAttributes( {
								max: value,
							} )
						}
						min={ attributes.min }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
						help={ __( 'The maximum value to accept in the input.', 'jetpack-forms' ) }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
