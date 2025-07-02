import './editor.scss';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, __experimentalNumberControl as NumberControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function SliderInputEdit( props ) {
	const { attributes, setAttributes } = props;
	const { min = 0, max = 100, value = 50 } = attributes;
	const [ internalValue, setInternalValue ] = useState( value );

	const onChange = event => {
		const newValue = Number( event.target.value );
		setInternalValue( newValue );
		setAttributes( { value: newValue } );
	};

	const blockProps = useBlockProps( {
		className: 'jetpack-slider-input',
	} );

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
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				<div className="jetpack-slider-input__current-value">
					{ __( 'Selected:', 'jetpack-forms' ) } { internalValue }
				</div>
				<div className="jetpack-slider-input__slider-row">
					<span className="jetpack-slider-input__min-label">{ min }</span>
					<input
						type="range"
						min={ min }
						max={ max }
						value={ internalValue }
						onChange={ onChange }
						className="jetpack-slider-input__range"
					/>
					<span className="jetpack-slider-input__max-label">{ max }</span>
				</div>
			</div>
		</>
	);
}
