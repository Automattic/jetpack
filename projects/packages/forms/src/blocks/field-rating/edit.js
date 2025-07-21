import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import RatingToolbar from '../shared/components/rating-toolbar';
import useFormWrapper from '../shared/hooks/use-form-wrapper';
import useRatingSync from '../shared/hooks/use-rating-sync';

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
	const { attributes, setAttributes, clientId, isSelected } = props;
	const {
		max = 5,
		default: defaultValue = 0,
		required,
		id,
		width,
		variation = 'stars',
	} = attributes;

	useFormWrapper( props );

	// Use shared rating synchronization hook
	const { updateMax, updateDefault, updateVariation } = useRatingSync(
		clientId,
		attributes,
		setAttributes
	);

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
			[ 'jetpack/rating-input', { max, default: defaultValue } ],
		],
		templateLock: 'all',
		__experimentalCaptureToolbars: true,
	} );

	return (
		<>
			<BlockControls>
				{ isSelected && (
					<RatingToolbar
						variation={ variation }
						max={ max }
						onUpdateVariation={ updateVariation }
						onUpdateMax={ updateMax }
					/>
				) }
			</BlockControls>

			<div { ...innerBlocksProps } />

			<InspectorControls>
				<PanelBody title={ __( 'Rating settings', 'jetpack-forms' ) }>
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
						onChange={ updateDefault }
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
