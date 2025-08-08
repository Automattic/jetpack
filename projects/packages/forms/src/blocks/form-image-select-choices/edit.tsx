/**
 * External dependencies
 */
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import JetpackFieldControls from '../shared/components/jetpack-field-controls';
import useJetpackFieldStyles from '../shared/hooks/use-jetpack-field-styles';

export default function ImageChoiceFieldEdit( props ) {
	const { attributes, clientId, isSelected, setAttributes } = props;
	const { id, required, width } = attributes;
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const { isInnerBlockSelected } = useSelect(
		select => {
			const { hasSelectedInnerBlock } = select( blockEditorStore );
			return {
				isInnerBlockSelected: hasSelectedInnerBlock( clientId, true ),
			};
		},
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		className: clsx( 'jetpack-field jetpack-form-image-select-choice', {
			'is-selected': isSelected || isInnerBlockSelected,
		} ),
		style: blockStyle,
	} );

	// Starts with 3 empty choices.
	const template = [
		[ 'jetpack/form-image-select-choice' ],
		[ 'jetpack/form-image-select-choice' ],
		[ 'jetpack/form-image-select-choice' ],
	];

	const innerBlocksProps = useInnerBlocksProps(
		{ className: 'jetpack-field-image-choices__wrapper' },
		{
			allowedBlocks: [ 'jetpack/form-image-select-choice' ],
			template,
			templateLock: false, // Allow adding, removing, and moving choices
		}
	);

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />

			<JetpackFieldControls
				id={ id }
				required={ required }
				attributes={ attributes }
				setAttributes={ setAttributes }
				width={ width }
			/>
		</div>
	);
}
