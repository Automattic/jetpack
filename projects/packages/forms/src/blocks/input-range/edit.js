import './editor.scss';
import { useBlockProps } from '@wordpress/block-editor';

export default function SliderInputEdit( props ) {
	const { context = {} } = props;

	const min = context[ 'jetpack/field-slider-min' ];
	const max = context[ 'jetpack/field-slider-max' ];
	const defaultValue = context[ 'jetpack/field-slider-default' ];
	const onChangeDefault = context[ 'jetpack/field-slider-onChangeDefault' ];

	const blockProps = useBlockProps( {
		className: 'jetpack-input-range',
	} );

	const onChange = event => {
		if ( onChangeDefault ) {
			onChangeDefault( event.target.value );
		}
	};

	const getSliderPosition = () => {
		const minNum = Number( min );
		const maxNum = Number( max );
		let valueNum = Number( defaultValue );
		valueNum = valueNum < minNum ? minNum : valueNum;
		valueNum = valueNum > maxNum ? maxNum : valueNum;
		const percent = ( ( valueNum - minNum ) * 100 ) / ( maxNum - minNum );
		return `calc(${ percent }% + (${ 8 - percent * 0.15 }px))`;
	};

	return (
		<div { ...blockProps }>
			<div className="jetpack-field-slider__row">
				<span className="jetpack-field-slider__min-label">{ min }</span>
				<div className="jetpack-field-slider__input-container">
					<input
						type="range"
						min={ min }
						max={ max }
						value={ defaultValue }
						onChange={ onChange }
						className="jetpack-field-slider__range"
					/>
					<div
						className="jetpack-field-slider__value-indicator"
						style={ { left: getSliderPosition() } }
					>
						{ defaultValue }
					</div>
				</div>
				<span className="jetpack-field-slider__max-label">{ max }</span>
			</div>
		</div>
	);
}
