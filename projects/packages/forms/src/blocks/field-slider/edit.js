import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	BlockContextProvider,
} from '@wordpress/block-editor';
import { PanelBody, __experimentalNumberControl as NumberControl } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';

export default function SliderFieldEdit( props ) {
	const { attributes, setAttributes } = props;
	const { min = 0, max = 100, default: defaultValue = 0, width, id, required } = attributes;

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
			const parsedDefault = parseInt( newDefault ) || 0;
			const validatedDefault = Math.max( Math.min( parsedDefault, max ), min );
			setAttributes( { default: validatedDefault } );
		},
		[ max, min, setAttributes ]
	);

	// Initialize scalar attributes so they serialize into post markup
	useEffect( () => {
		if (
			attributes.min === undefined ||
			attributes.max === undefined ||
			attributes.default === undefined
		) {
			setAttributes( {
				min: attributes.min ?? 0,
				max: attributes.max ?? 100,
				default: attributes.default ?? 0,
			} );
		}
	}, [ attributes.min, attributes.max, attributes.default, setAttributes ] );

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
					<NumberControl
						label={ __( 'Minimum value', 'jetpack-forms' ) }
						help={ __( 'Lowest value users can select.', 'jetpack-forms' ) }
						min={ Number.MIN_SAFE_INTEGER }
						max={ max }
						value={ min }
						onChange={ onChangeMin }
					/>
					<NumberControl
						label={ __( 'Maximum value', 'jetpack-forms' ) }
						help={ __( 'Highest value users can select.', 'jetpack-forms' ) }
						min={ min }
						max={ Number.MAX_SAFE_INTEGER }
						value={ max }
						onChange={ onChangeMax }
					/>
					<NumberControl
						label={ __( 'Default value', 'jetpack-forms' ) }
						help={ __( 'Pre-selected value (must be between min and max).', 'jetpack-forms' ) }
						min={ min }
						max={ max }
						value={ defaultValue }
						onChange={ onChangeDefault }
					/>
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
