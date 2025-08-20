import './editor.scss';
import { useBlockProps } from '@wordpress/block-editor';
import { VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useRef } from 'react';
import useInsertAfterOnEnterKeyDown from '../shared/hooks/use-insert-after-on-enter-key-down';

export default function SliderInputEdit( props ) {
	const { context = {}, isSelected, clientId } = props;
	const minInputRef = useRef( null );
	const maxInputRef = useRef( null );

	// Get values from context.
	const minFromContext = context[ 'jetpack/field-slider-min' ];
	const maxFromContext = context[ 'jetpack/field-slider-max' ];
	const defaultFromContext = context[ 'jetpack/field-slider-default' ];
	const stepFromContext = context[ 'jetpack/field-slider-step' ];
	const onChangeDefault = context[ 'jetpack/field-slider-onChangeDefault' ];
	const onChangeMin = context[ 'jetpack/field-slider-onChangeMin' ];
	const onChangeMax = context[ 'jetpack/field-slider-onChangeMax' ];
	const onKeyDown = useInsertAfterOnEnterKeyDown( clientId );
	const minTextLabel = context[ 'jetpack/field-slider-minLabel' ];
	const maxTextLabel = context[ 'jetpack/field-slider-maxLabel' ];
	const onChangeMinLabel = context[ 'jetpack/field-slider-onChangeMinLabel' ];
	const onChangeMaxLabel = context[ 'jetpack/field-slider-onChangeMaxLabel' ];

	// Setup local state.
	const [ localMin, setLocalMin ] = useState( String( minFromContext ) );
	const [ localMax, setLocalMax ] = useState( String( maxFromContext ) );
	const [ minFocused, setMinFocused ] = useState( false );
	const [ maxFocused, setMaxFocused ] = useState( false );
	const [ localMinLabel, setLocalMinLabel ] = useState( String( minTextLabel ) );
	const [ localMaxLabel, setLocalMaxLabel ] = useState( String( maxTextLabel ) );

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

	const handleMinClick = e => {
		minInputRef.current?.ownerDocument.activeElement === e.target || e.target.focus();
	};

	const handleMaxClick = e => {
		maxInputRef.current?.ownerDocument.activeElement === e.target || e.target.focus();
	};

	// Sync min/max numbers if context updates or min/max input loses focus.
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
				<VisuallyHidden as="label" htmlFor={ `${ clientId }-slider-min` }>
					{ __( 'Slider minimum value', 'jetpack-forms' ) }
				</VisuallyHidden>
				<input
					id={ `${ clientId }-slider-min` }
					type="number"
					className={ `jetpack-field-slider__min-input${
						! isMinValid && minFocused ? ' has-error' : ''
					}` }
					value={ removeLeadingZero( localMin ) }
					placeholder="0"
					onChange={ e => setLocalMin( e.target.value ) }
					ref={ minInputRef }
					onClick={ handleMinClick }
					onFocus={ () => setMinFocused( true ) }
					onBlur={ () => {
						setMinFocused( false );
						onChangeMin( localMin );
					} }
					onKeyDown={ onKeyDown }
				/>
				<div className="jetpack-field-slider__input-container">
					<VisuallyHidden as="label" htmlFor={ `${ clientId }-slider-default` }>
						{ __( 'Slider default value', 'jetpack-forms' ) }
					</VisuallyHidden>
					<input
						id={ `${ clientId }-slider-default` }
						type="range"
						min={ minFromContext }
						max={ maxFromContext }
						step={ stepFromContext || 1 }
						value={ defaultFromContext }
						onChange={ e => onChangeDefault( e.target.value ) }
						onKeyDown={ onKeyDown }
						className="jetpack-field-slider__range"
					/>
					<div
						className="jetpack-field-slider__value-indicator"
						style={ { left: getSliderPosition() } }
					>
						{ defaultFromContext }
					</div>
				</div>
				<VisuallyHidden as="label" htmlFor={ `${ clientId }-slider-max` }>
					{ __( 'Slider maximum value', 'jetpack-forms' ) }
				</VisuallyHidden>
				<input
					id={ `${ clientId }-slider-max` }
					type="number"
					className={ `jetpack-field-slider__max-input${
						! isMaxValid && maxFocused ? ' has-error' : ''
					}` }
					value={ removeLeadingZero( localMax ) }
					placeholder="0"
					onChange={ e => setLocalMax( e.target.value ) }
					ref={ maxInputRef }
					onClick={ handleMaxClick }
					onFocus={ () => setMaxFocused( true ) }
					onBlur={ () => {
						setMaxFocused( false );
						onChangeMax( localMax );
					} }
					onKeyDown={ onKeyDown }
				/>
			</div>
			<div className="jetpack-field-slider__text-labels">
				<input
					className="jetpack-field-slider__min-text-label"
					type="text"
					size={ Math.max( 3, localMinLabel.length ) }
					value={ localMinLabel }
					placeholder={ __( 'Add label…', 'jetpack-forms' ) }
					onChange={ e => setLocalMinLabel( e.target.value ) }
					onBlur={ () => {
						onChangeMinLabel?.( localMinLabel );
					} }
				/>
				<input
					className="jetpack-field-slider__max-text-label"
					autocomplete="off"
					type="text"
					size={ Math.max( 3, localMaxLabel.length ) }
					value={ localMaxLabel }
					placeholder={ __( 'Add label…', 'jetpack-forms' ) }
					onChange={ e => setLocalMaxLabel( e.target.value ) }
					onBlur={ () => {
						onChangeMaxLabel?.( localMaxLabel );
					} }
				/>
			</div>
		</div>
	);
}
