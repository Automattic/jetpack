import { useBlockProps, useInnerBlocksProps, BlockContextProvider } from '@wordpress/block-editor';
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalNumberControl as NumberControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	TextControl,
	BaseControl,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackFieldControls from '../shared/components/jetpack-field-controls.js';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';
import './editor.scss';

export default function SliderFieldEdit( props ) {
	useFormWrapper( props );

	const { attributes, setAttributes } = props;
	const {
		min = 0,
		max = 100,
		default: defaultValue = 0,
		step = 1,
		width,
		id,
		required,
		minLabel = '',
		maxLabel = '',
	} = attributes;

	const [ localDefault, setLocalDefault ] = useState( String( defaultValue ) );
	const [ defaultFocused, setDefaultFocused ] = useState( false );

	useEffect( () => {
		if ( ! defaultFocused ) {
			setLocalDefault( String( defaultValue ) );
		}
	}, [ defaultValue, defaultFocused ] );

	const snapToStep = useCallback(
		( val, stepSize, base = min ) => {
			const clamped = Math.min( Math.max( val, base ), max );
			return base + Math.round( ( clamped - base ) / stepSize ) * stepSize;
		},
		[ min, max ]
	);

	const onChangeMin = useCallback(
		newMin => {
			const parsedMin = parseInt( newMin ) || 0;
			const validatedMin = Math.min( parsedMin, max );
			const validatedDefault = Math.max( defaultValue, validatedMin );
			const snappedDefault = snapToStep( validatedDefault, step, validatedMin );
			setAttributes( {
				min: validatedMin,
				default: snappedDefault,
			} );
		},
		[ max, defaultValue, step, setAttributes, snapToStep ]
	);

	const onChangeMax = useCallback(
		newMax => {
			const parsedMax = parseInt( newMax ) || 0;
			const validatedMax = Math.max( parsedMax, min );
			const validatedDefault = Math.min( defaultValue, validatedMax );
			setAttributes( {
				max: validatedMax,
				default: validatedDefault,
			} );
		},
		[ min, defaultValue, setAttributes ]
	);

	// This is passed to child input-range block via context.
	const onChangeDefault = useCallback(
		newDefault => {
			const snapped = snapToStep( newDefault, step );
			setAttributes( { default: snapped } );
			setLocalDefault( String( snapped ) );
		},
		[ snapToStep, step, setAttributes ]
	);

	const onChangeStep = useCallback(
		newStep => {
			const stepSize = newStep > 0 ? newStep : 1;
			const snappedDefault = snapToStep( defaultValue, stepSize );
			setAttributes( { step: stepSize, default: snappedDefault } );
		},
		[ defaultValue, setAttributes, snapToStep ]
	);

	const onChangeMinLabel = useCallback(
		newMinLabel => {
			setAttributes( { minLabel: newMinLabel } );
		},
		[ setAttributes ]
	);

	const onChangeMaxLabel = useCallback(
		newMaxLabel => {
			setAttributes( { maxLabel: newMaxLabel } );
		},
		[ setAttributes ]
	);

	// Initialize scalar attributes so they serialize into post markup
	useEffect( () => {
		if (
			attributes.min === undefined ||
			attributes.max === undefined ||
			attributes.default === undefined ||
			attributes.step === undefined
		) {
			setAttributes( {
				min: attributes.min ?? 0,
				max: attributes.max ?? 100,
				default: attributes.default ?? 0,
				step: attributes.step ?? 1,
			} );
		}
	}, [ attributes.min, attributes.max, attributes.default, attributes.step, setAttributes ] );

	const blockProps = useBlockProps( {
		className: `jetpack-field jetpack-field-slider${
			width ? ` jetpack-field__width-${ width }` : ''
		}`,
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/label', 'jetpack/input-range' ],
		template: [
			[
				'jetpack/label',
				{
					label: __( 'Slider', 'jetpack-forms' ),
					placeholder: __( 'Add label…', 'jetpack-forms' ),
				},
			],
			[ 'jetpack/input-range', {} ],
		],
		templateLock: 'all',
	} );

	return (
		<>
			<BlockContextProvider
				value={ {
					'jetpack/field-slider-onChangeDefault': onChangeDefault,
					'jetpack/field-slider-onChangeMin': onChangeMin,
					'jetpack/field-slider-onChangeMax': onChangeMax,
					'jetpack/field-slider-minLabel': minLabel,
					'jetpack/field-slider-maxLabel': maxLabel,
					'jetpack/field-slider-onChangeMinLabel': onChangeMinLabel,
					'jetpack/field-slider-onChangeMaxLabel': onChangeMaxLabel,
				} }
			>
				<div { ...innerBlocksProps } />
			</BlockContextProvider>
			<JetpackFieldControls
				attributes={ attributes }
				id={ id }
				required={ required }
				setAttributes={ setAttributes }
				width={ width }
				extraFieldSettings={ [
					{
						index: 2,
						element: (
							<BaseControl __nextHasNoMarginBottom={ true } key="sliderFieldControls">
								<HStack alignment="top" className="jp-field-slider-inspector-row">
									<NumberControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'Min value', 'jetpack-forms' ) }
										max={ max }
										min={ Number.MIN_SAFE_INTEGER }
										onChange={ onChangeMin }
										value={ min }
										spinControls="custom"
									/>
									<NumberControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'Max value', 'jetpack-forms' ) }
										max={ Number.MAX_SAFE_INTEGER }
										min={ min }
										onChange={ onChangeMax }
										value={ max }
										spinControls="custom"
									/>
								</HStack>
								<HStack alignment="top" className="jp-field-slider-inspector-row">
									<TextControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'Min label', 'jetpack-forms' ) }
										value={ minLabel }
										onChange={ onChangeMinLabel }
									/>
									<TextControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'Max label', 'jetpack-forms' ) }
										value={ maxLabel }
										onChange={ onChangeMaxLabel }
									/>
								</HStack>
								<HStack alignment="top" className="jp-field-slider-inspector-row">
									<NumberControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'Default value', 'jetpack-forms' ) }
										min={ min }
										max={ max }
										value={ localDefault }
										onChange={ val => {
											setLocalDefault( val );
											const snapped = snapToStep( val, step );
											setAttributes( { default: snapped } );
										} }
										onFocus={ () => setDefaultFocused( true ) }
										onBlur={ () => setDefaultFocused( false ) }
										spinControls="custom"
										step={ step || 1 }
									/>
									<NumberControl
										__next40pxDefaultSize
										__nextHasNoMarginBottom
										label={ __( 'Increment', 'jetpack-forms' ) }
										min={ 0 }
										step={ 1 }
										value={ step }
										onChange={ onChangeStep }
										spinControls="custom"
									/>
								</HStack>
							</BaseControl>
						),
					},
				] }
			/>
		</>
	);
}
