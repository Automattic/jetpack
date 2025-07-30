import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import RatingToolbar from '../shared/components/rating-toolbar';
import useFormWrapper from '../shared/hooks/use-form-wrapper';

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
	const { max = 5, default: defaultValue = 0, required, id, width, className = '' } = attributes;

	useFormWrapper( props );

	// Direct update functions for rating attributes
	const updateMax = newMax => {
		const validatedMax = Math.min( Math.max( parseInt( newMax ) || 5, 2 ), 10 );
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

	useEffect( () => {
		setAttributes( { onChangeDefault } );
	}, [ onChangeDefault, setAttributes ] );

	const updateClassName = newClassName => {
		setAttributes( { className: newClassName } );
	};

	const blockProps = useBlockProps( {
		className: `jetpack-field jetpack-field-rating${
			width ? ` jetpack-field__width-${ width }` : ''
		}`,
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'jetpack/label', 'jetpack/rating-input' ],
		template: [
			[
				'jetpack/label',
				{
					label: __( 'Rating', 'jetpack-forms' ),
					placeholder: __( 'Add label…', 'jetpack-forms' ),
				},
			],
			[ 'jetpack/rating-input', {} ],
		],
		templateLock: 'all',
		__experimentalCaptureToolbars: true,
	} );

	return (
		<>
			<BlockControls __experimentalShareWithChildBlocks>
				<RatingToolbar
					className={ className }
					max={ max }
					onUpdateClassName={ updateClassName }
					onUpdateMax={ updateMax }
				/>
			</BlockControls>

			<div { ...innerBlocksProps } />

			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-forms' ) }>
					<RangeControl
						label={ __( 'Maximum rating', 'jetpack-forms' ) }
						help={ __( 'Highest rating value users can select (2–10)', 'jetpack-forms' ) }
						min={ 2 }
						max={ 10 }
						value={ max }
						onChange={ updateMax }
					/>
					<RangeControl
						label={ __( 'Default rating', 'jetpack-forms' ) }
						help={ __( 'Pre-selected rating value (0 for no selection)', 'jetpack-forms' ) }
						min={ 0 }
						max={ max }
						value={ defaultValue }
						onChange={ onChangeDefault }
					/>
				</PanelBody>
			</InspectorControls>

			<JetpackFieldControls
				clientId={ clientId }
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				width={ width }
			/>
		</>
	);
}
