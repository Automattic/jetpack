import './editor.scss';
import { useBlockProps } from '@wordpress/block-editor';

export default function SliderInputEdit( props ) {
	const { context = {}, isSelected } = props;

	const min = context[ 'jetpack/field-slider-min' ];
	const max = context[ 'jetpack/field-slider-max' ];
	const defaultValue = context[ 'jetpack/field-slider-default' ];
	const onChangeDefault = context[ 'jetpack/field-slider-onChangeDefault' ];
	const onChangeMin = context[ 'jetpack/field-slider-onChangeMin' ];
	const onChangeMax = context[ 'jetpack/field-slider-onChangeMax' ];

	const blockProps = useBlockProps( {
		className: `jetpack-input-range${ isSelected ? ' is-selected' : '' }`,
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
				<input
					type="number"
					className="jetpack-field-slider__min-input"
					value={ min }
					onChange={ e => {
						onChangeMin && onChangeMin( e.target.value === '' ? 0 : e.target.value );
					} }
				/>
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
				<input
					type="number"
					className="jetpack-field-slider__max-input"
					value={ max }
					onChange={ e => {
						onChangeMax && onChangeMax( e.target.value === '' ? 0 : e.target.value );
					} }
				/>
			</div>
		</div>
	);
}
