import './editor.scss';
import { useBlockProps } from '@wordpress/block-editor';
import { useState, useEffect } from 'react';

export default function SliderInputEdit( props ) {
	const { context = {}, isSelected } = props;

	// Get values from context.
	const minFromContext = context[ 'jetpack/field-slider-min' ];
	const maxFromContext = context[ 'jetpack/field-slider-max' ];
	const defaultFromContext = context[ 'jetpack/field-slider-default' ];
	const onChangeDefault = context[ 'jetpack/field-slider-onChangeDefault' ];
	const onChangeMin = context[ 'jetpack/field-slider-onChangeMin' ];
	const onChangeMax = context[ 'jetpack/field-slider-onChangeMax' ];

	// Setup local state.
	const [ localMin, setLocalMin ] = useState( String( minFromContext ) );
	const [ localMax, setLocalMax ] = useState( String( maxFromContext ) );
	const [ minFocused, setMinFocused ] = useState( false );
	const [ maxFocused, setMaxFocused ] = useState( false );

	// Derived variables
	const isMinValid = Number( localMin ) <= Number( localMax );
	const isMaxValid = Number( localMax ) >= Number( localMin );

	const blockProps = useBlockProps( {
		className: `jetpack-input-range${ isSelected ? ' is-selected' : '' }`,
	} );

	const removeLeadingZero = val => {
		if ( typeof val === 'string' && val.length > 1 ) {
			return val.replace( /^0+/, '' ) || '0';
		}
		return val;
	};

	const getSliderPosition = () => {
		const min = Number( minFromContext );
		const max = Number( maxFromContext );
		const value = Number( defaultFromContext );
		const percent = ( ( value - min ) * 100 ) / ( max - min );
		return `calc(${ percent }% + (${ 8 - percent * 0.15 }px))`;
	};

	// Sync min/max if context updates or min/max input loses focus.
	useEffect( () => {
		if ( ! minFocused ) {
			setLocalMin( String( minFromContext ) );
		}
		if ( ! maxFocused ) {
			setLocalMax( String( maxFromContext ) );
		}
	}, [ minFromContext, maxFromContext, minFocused, maxFocused ] );

	return (
		<div { ...blockProps }>
			<div className="jetpack-field-slider__row">
				<input
					type="number"
					className={ `jetpack-field-slider__min-input${
						! isMinValid && minFocused ? ' has-error' : ''
					}` }
					value={ removeLeadingZero( localMin ) }
					onChange={ e => setLocalMin( e.target.value ) }
					onFocus={ () => setMinFocused( true ) }
					onBlur={ () => {
						setMinFocused( false );
						onChangeMin( localMin );
					} }
				/>
				<div className="jetpack-field-slider__input-container">
					<input
						type="range"
						min={ minFromContext }
						max={ maxFromContext }
						value={ defaultFromContext }
						onChange={ e => onChangeDefault( e.target.value ) }
						className="jetpack-field-slider__range"
					/>
					<div
						className="jetpack-field-slider__value-indicator"
						style={ { left: getSliderPosition() } }
					>
						{ defaultFromContext }
					</div>
				</div>
				<input
					type="number"
					className={ `jetpack-field-slider__max-input${
						! isMaxValid && maxFocused ? ' has-error' : ''
					}` }
					value={ removeLeadingZero( localMax ) }
					onChange={ e => setLocalMax( e.target.value ) }
					onFocus={ () => setMaxFocused( true ) }
					onBlur={ () => {
						setMaxFocused( false );
						onChangeMax( localMax );
					} }
				/>
			</div>
		</div>
	);
}
