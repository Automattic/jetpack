import './editor.scss';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, __experimentalNumberControl as NumberControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __ } from '@wordpress/i18n';

export default function SliderInputEdit( props ) {
	const { attributes, setAttributes } = props;
	const { min, max, value, startingValue } = attributes;

	const onChange = event => {
		setAttributes( { value: Number( event.target.value ) } );
	};

	const blockProps = useBlockProps( {
		className: 'jetpack-input-range',
	} );

	// Mimic the Interactivity API's getSliderPosition logic
	const getSliderPosition = () => {
		const minNum = Number( min );
		const maxNum = Number( max );
		let valueNum = Number( value );
		valueNum = valueNum < minNum ? minNum : valueNum;
		valueNum = valueNum > maxNum ? maxNum : valueNum;
		const percent = ( ( valueNum - minNum ) * 100 ) / ( maxNum - minNum );
		return `calc(${ percent }% + (${ 8 - percent * 0.15 }px))`;
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-forms' ) }>
					<NumberControl
						key="min"
						label={ __( 'Minimum value', 'jetpack-forms' ) }
						value={ min }
						onChange={ newMin => setAttributes( { min: newMin } ) }
						max={ max }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
						help={ __(
							'The minimum value to accept in the slider. Leaving empty allows any negative and positive values.',
							'jetpack-forms'
						) }
					/>
					<NumberControl
						key="max"
						label={ __( 'Maximum value', 'jetpack-forms' ) }
						value={ max }
						onChange={ newMax => setAttributes( { max: newMax } ) }
						min={ min }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
						help={ __( 'The maximum value to accept in the slider.', 'jetpack-forms' ) }
					/>
					<NumberControl
						key="startingValue"
						label={ __( 'Starting value', 'jetpack-forms' ) }
						value={ startingValue }
						onChange={ newStartValue => setAttributes( { startingValue: newStartValue } ) }
						min={ min }
						max={ max }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
						help={ __( 'The value the slider will start at.', 'jetpack-forms' ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="jetpack-input-range-row">
					<span className="jetpack-input-range__min-label">{ min }</span>
					<div className="jetpack-input-range__input-container">
						<input
							type="range"
							min={ min }
							max={ max }
							value={ value }
							onChange={ onChange }
							className="jetpack-input-range__range"
						/>
						<div
							className="jetpack-input-range__value-indicator"
							style={ { left: getSliderPosition() } }
						>
							{ value }
						</div>
					</div>
					<span className="jetpack-input-range__max-label">{ max }</span>
				</div>
			</div>
		</>
	);
}
