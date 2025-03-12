import { useBlockProps } from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { isEmpty } from 'lodash';
import { useFormStyle } from '../util/form';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import JetpackFieldControls from './jetpack-field-controls';
import JetpackFieldLabel from './jetpack-field-label';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

const JetpackNumberField = props => {
	const {
		attributes,
		clientId,
		id,
		isSelected,
		required,
		requiredText,
		label,
		setAttributes,
		placeholder,
		min,
		max,
		width,
		insertBlocksAfter,
	} = props;

	const { blockStyle, fieldStyle } = useJetpackFieldStyles( attributes );
	const formStyle = useFormStyle( clientId );
	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field', {
			'is-selected': isSelected,
			'has-placeholder': ! isEmpty( placeholder ),
		} ),
		style: blockStyle,
	} );

	return (
		<>
			<div { ...blockProps }>
				<JetpackFieldLabel
					attributes={ attributes }
					label={ label }
					required={ required }
					requiredText={ requiredText }
					setAttributes={ setAttributes }
					style={ formStyle }
				/>
				<input
					className="jetpack-field__input"
					onChange={ e => setAttributes( { placeholder: e.target.value } ) }
					style={ fieldStyle }
					type={ isSelected ? 'text' : 'number' }
					value={ isSelected ? placeholder : '' }
					placeholder={ placeholder }
					min={ min }
					max={ max }
					onKeyDown={ event => {
						if ( event.defaultPrevented || event.key !== 'Enter' ) {
							return;
						}
						insertBlocksAfter( createBlock( getDefaultBlockName() ) );
					} }
				/>
			</div>

			<JetpackFieldControls
				id={ id }
				required={ required }
				width={ width }
				setAttributes={ setAttributes }
				placeholder={ placeholder }
				attributes={ attributes }
				extraFieldSettings={ [
					{
						index: 1,
						element: (
							<NumberControl
								key="min"
								label={ __( 'Minimum value', 'jetpack-forms' ) }
								value={ attributes.min }
								onChange={ value =>
									setAttributes( {
										min: value,
									} )
								}
								max={ max } // Value must be less than or equal to the value of the max attribute.
								__nextHasNoMarginBottom={ true }
								__next40pxDefaultSize={ true }
								help={ __(
									'The minimum value to accept in the input. Leaving empty allows any negative and positive values.',
									'jetpack-forms'
								) }
							/>
						),
					},
					{
						index: 2,
						element: (
							<NumberControl
								key="max"
								label={ __( 'Maximum value', 'jetpack-forms' ) }
								value={ attributes.max }
								onChange={ value =>
									setAttributes( {
										max: value,
									} )
								}
								min={ min } // Value must be greater than or equal to the value of the min attribute.
								__nextHasNoMarginBottom={ true }
								__next40pxDefaultSize={ true }
								help={ __( 'The maximum value to accept in the input.', 'jetpack-forms' ) }
							/>
						),
					},
				] }
			/>
		</>
	);
};

export default compose(
	withSharedFieldAttributes( [
		'borderRadius',
		'borderWidth',
		'labelFontSize',
		'fieldFontSize',
		'lineHeight',
		'labelLineHeight',
		'inputColor',
		'labelColor',
		'fieldBackgroundColor',
		'borderColor',
	] )
)( JetpackNumberField );
