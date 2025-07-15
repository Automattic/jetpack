import {
	useBlockProps,
	useInnerBlocksProps,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useFormWrapper from '../shared/hooks/use-form-wrapper';

export default function RatingFieldEdit( props ) {
	const { attributes, setAttributes, clientId } = props;
	const { max, default: defaultValue, required, id, width } = attributes;

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
