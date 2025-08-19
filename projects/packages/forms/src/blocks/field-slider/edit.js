import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	BlockContextProvider,
} from '@wordpress/block-editor';
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalNumberControl as NumberControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	PanelBody,
} from '@wordpress/components';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
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
	} = attributes;

	const onChangeMin = useCallback(
		newMin => {
			const parsedMin = parseInt( newMin ) || 0;
			const validatedMin = Math.min( parsedMin, max );
			const validatedDefault = Math.max( defaultValue, validatedMin );
			setAttributes( {
				min: validatedMin,
				default: validatedDefault,
			} );
		},
		[ max, defaultValue, setAttributes ]
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
			const parsedDefault = parseFloat( newDefault ) || 0;
			const validatedDefault = Math.max( Math.min( parsedDefault, max ), min );
			setAttributes( { default: validatedDefault } );
		},
		[ max, min, setAttributes ]
	);

	const onChangeStep = useCallback(
		newStep => {
			const parsedStep = parseFloat( newStep );
			const safeStep = ! isNaN( parsedStep ) && parsedStep > 0 ? parsedStep : 1;
			// Snap default to the new step within [min, max]
			const snappedDefault = ( () => {
				const ratio = ( defaultValue - min ) / safeStep;
				const snapped = min + Math.round( ratio ) * safeStep;
				return Math.max( Math.min( snapped, max ), min );
			} )();
			setAttributes( { step: safeStep, default: snappedDefault } );
		},
		[ defaultValue, min, max, setAttributes ]
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
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-forms' ) }>
					<HStack alignment="top" className="jp-field-slider-inspector-row">
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Min value', 'jetpack-forms' ) }
							max={ max }
							min={ Number.MIN_SAFE_INTEGER }
							onChange={ onChangeMin }
							value={ min }
						/>
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Max value', 'jetpack-forms' ) }
							max={ Number.MAX_SAFE_INTEGER }
							min={ min }
							onChange={ onChangeMax }
							value={ max }
						/>
					</HStack>
					<HStack alignment="top" className="jp-field-slider-inspector-row">
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Default value', 'jetpack-forms' ) }
							min={ min }
							max={ max }
							value={ defaultValue }
							onChange={ onChangeDefault }
						/>
						<NumberControl
							__next40pxDefaultSize
							label={ __( 'Increment', 'jetpack-forms' ) }
							min={ 0 }
							step={ 1 }
							value={ step }
							onChange={ onChangeStep }
						/>
					</HStack>
				</PanelBody>
			</InspectorControls>
			<BlockContextProvider
				value={ {
					'jetpack/field-slider-onChangeDefault': onChangeDefault,
					'jetpack/field-slider-onChangeMin': onChangeMin,
					'jetpack/field-slider-onChangeMax': onChangeMax,
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
			/>
		</>
	);
}
