import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { plus, lineSolid } from '@wordpress/icons';
import { StarIcon, HeartIcon } from '../input-rating/icons';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';

export default function RatingFieldEdit( props ) {
	const { attributes, setAttributes, clientId } = props;
	const {
		max,
		default: defaultValue,
		required,
		id,
		width,
		variation = 'stars',
		className: classNameAttr = '',
	} = attributes;

	// Retrieve the clientId of the child rating-input block so we can sync its attributes.
	const ratingInputClientId = useSelect(
		select => {
			const { getBlocks } = select( blockEditorStore );
			const children = getBlocks( clientId ) || [];
			const ratingInput = children.find( block => block.name === 'jetpack/rating-input' );
			return ratingInput?.clientId;
		},
		[ clientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const updateMax = newMax => {
		const newProps = {
			max: newMax,
			default: newMax < defaultValue ? newMax : defaultValue,
		};
		setAttributes( newProps );
		if ( ratingInputClientId ) {
			updateBlockAttributes( ratingInputClientId, newProps );
		}
	};

	const updateDefault = newVal => {
		setAttributes( { default: newVal } );
		if ( ratingInputClientId ) {
			updateBlockAttributes( ratingInputClientId, { default: newVal } );
		}
	};

	// Helper to update style variation (stars / hearts)
	const updateVariation = newVariation => {
		if ( newVariation === variation ) {
			return;
		}

		// Remove previous is-style-* class if present
		const cleanedClassName = ( classNameAttr || '' ).replace( /is-style-[^\s]+/g, '' ).trim();

		const newClassName = `${ cleanedClassName } ${ `is-style-${ newVariation }` }`.trim();

		setAttributes( {
			variation: newVariation,
			className: newClassName,
		} );

		if ( ratingInputClientId ) {
			updateBlockAttributes( ratingInputClientId, { variation: newVariation } );
		}
	};

	useFormWrapper( props );

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
	} );

	return (
		<>
			{ /* Toolbar controls */ }
			<BlockControls>
				{ /* Variation toggle group */ }
				<ToolbarGroup>
					<ToolbarButton
						icon={ variation === 'stars' ? HeartIcon : StarIcon }
						label={
							variation === 'stars'
								? __( 'Transform to hearts', 'jetpack-forms' )
								: __( 'Transform to stars', 'jetpack-forms' )
						}
						onClick={ () => updateVariation( variation === 'stars' ? 'hearts' : 'stars' ) }
					/>
				</ToolbarGroup>

				{ /* Rating count controls group */ }
				<ToolbarGroup>
					<ToolbarButton
						icon={ lineSolid }
						label={ __( 'Remove star', 'jetpack-forms' ) }
						onClick={ () => updateMax( Math.max( 2, max - 1 ) ) }
						disabled={ max <= 2 }
					/>
					<ToolbarButton
						icon={ plus }
						label={ __( 'Add star', 'jetpack-forms' ) }
						onClick={ () => updateMax( Math.min( 10, max + 1 ) ) }
						disabled={ max >= 10 }
					/>
				</ToolbarGroup>
			</BlockControls>

			<div { ...innerBlocksProps } />

			<InspectorControls>
				<PanelBody title={ __( 'Rating settings', 'jetpack-forms' ) }>
					<RangeControl
						label={ __( 'Max value', 'jetpack-forms' ) }
						min={ 2 }
						max={ 10 }
						value={ max }
						onChange={ updateMax }
					/>
					<RangeControl
						label={ __( 'Default value', 'jetpack-forms' ) }
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
