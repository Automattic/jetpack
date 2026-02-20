import { useBlockProps, useInnerBlocksProps, BlockContextProvider } from '@wordpress/block-editor';
import {
	__experimentalNumberControl as NumberControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	RangeControl,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import JetpackFieldControls from '../shared/components/jetpack-field-controls.js';
import useFormWrapper from '../shared/hooks/use-form-wrapper.js';
import { MAX_RATING_ICONS } from './rating-icons.js';

/**
 * Rating Field Edit Component
 *
 * Wrapper block that contains a rating input component. Provides settings
 * panel and toolbar controls for configuring rating behavior and appearance.
 *
 * @param {object} props - Component props from WordPress block editor
 * @return {import('react').JSX.Element} Rating field editor component
 */
export default function RatingFieldEdit( props ) {
	const { attributes, setAttributes, clientId } = props;
	const { max = 5, default: defaultValue = 0, required, id, width } = attributes;

	useFormWrapper( props );

	// Direct update functions for rating attributes
	const updateMax = newMax => {
		const validatedMax = Math.min( Math.max( parseInt( newMax ) || 5, 2 ), MAX_RATING_ICONS );
		const validatedDefault = Math.min( defaultValue, validatedMax );
		setAttributes( {
			max: validatedMax,
			default: validatedDefault,
		} );
	};

	const onChangeDefault = useCallback(
		newDefault => {
			const validatedDefault = Math.min( Math.max( parseInt( newDefault ) || 0, 0 ), max );
			setAttributes( { default: validatedDefault } );
		},
		[ max, setAttributes ]
	);

	const blockProps = useBlockProps( {
		className: `jetpack-field jetpack-field-rating${
			width ? ` jetpack-field__width-${ width }` : ''
		}`,
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/label', 'jetpack/input-rating' ],
		template: [
			[
				'jetpack/label',
				{
					label: __( 'Rating', 'jetpack-forms' ),
					placeholder: __( 'Add label…', 'jetpack-forms' ),
				},
			],
			[ 'jetpack/input-rating', {} ],
		],
		templateLock: 'all',
		__experimentalCaptureToolbars: true,
	} );

	return (
		<>
			<BlockContextProvider
				value={ {
					'jetpack/field-rating-max': max,
					'jetpack/field-rating-default': defaultValue,
					'jetpack/field-rating-iconStyle': attributes.iconStyle || 'stars',
					'jetpack/field-rating-onChangeDefault': onChangeDefault,
				} }
			>
				<div { ...innerBlocksProps } />
			</BlockContextProvider>

			<JetpackFieldControls
				clientId={ clientId }
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				width={ width }
				extraFieldSettings={ [
					{
						index: 1,
						element: (
							<div key="ratingFieldControls">
								<NumberControl
									__next40pxDefaultSize
									__unstableInputWidth="50%"
									help={ sprintf(
										/* translators: %d: maximum rating value (e.g. 10) */
										__( 'Highest rating users can select (2–%d).', 'jetpack-forms' ),
										MAX_RATING_ICONS
									) }
									label={ __( 'Maximum rating', 'jetpack-forms' ) }
									max={ MAX_RATING_ICONS }
									min={ 2 }
									onChange={ updateMax }
									spinControls="custom"
									value={ max }
								/>
								<RangeControl
									label={ __( 'Default rating', 'jetpack-forms' ) }
									help={ __( 'Pre-selected rating value (0 for no selection)', 'jetpack-forms' ) }
									min={ 0 }
									max={ max }
									value={ defaultValue }
									onChange={ onChangeDefault }
								/>
							</div>
						),
					},
				] }
			/>
		</>
	);
}
