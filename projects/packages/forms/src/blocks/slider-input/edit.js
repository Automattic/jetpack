import { useBlockProps } from '@wordpress/block-editor';
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
	);
}
